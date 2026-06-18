using Attendance.API.Configuration;
using Attendance.API.Data;
using Attendance.API.DTOs.Cosec;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Attendance.API.Services;

public class CosecSyncService(
    HttpClient httpClient,
    IOptions<CosecSettings> options,
    AppDbContext db,
    ILogger<CosecSyncService> logger) : ICosecSyncService
{
    private readonly CosecSettings _settings = options.Value;

    private static readonly string[] FieldNames =
    [
        "USERID",
        .. Enumerable.Range(1, 12).Select(i => $"PUNCH{i}"),
        .. Enumerable.Range(1, 12).Select(i => $"SPFID{i}"),
    ];

    public async Task<CosecSyncResult> PollAndSyncAsync(CancellationToken ct = default)
    {
        var result = new CosecSyncResult();

        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.BaseUrl))
        {
            result.Errors.Add("COSEC sync is disabled or BaseUrl is not configured (see CosecSettings in appsettings.json).");
            return result;
        }

        TimeZoneInfo deviceTz;
        try
        {
            deviceTz = TimeZoneInfo.FindSystemTimeZoneById(_settings.DeviceTimeZoneId);
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Invalid CosecSettings.DeviceTimeZoneId '{_settings.DeviceTimeZoneId}': {ex.Message}");
            return result;
        }

        var url = BuildRequestUrl(deviceTz);

        string raw;
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
                request.Headers.TryAddWithoutValidation(_settings.ApiKeyHeaderName, _settings.ApiKey);

            using var response = await httpClient.SendAsync(request, ct);
            raw = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                result.Errors.Add($"COSEC server returned HTTP {(int)response.StatusCode}: {raw}");
                return result;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reach COSEC server at {BaseUrl}", _settings.BaseUrl);
            result.Errors.Add($"Request to COSEC server failed: {ex.Message}");
            return result;
        }

        var records = CosecResponseParser.Parse(raw, FieldNames);
        result.RecordsFetched = records.Count;

        foreach (var record in records)
        {
            var employee = await db.Employees
                .FirstOrDefaultAsync(e => e.EmployeeCode == record.UserId && e.IsActive, ct);

            if (employee is null)
            {
                result.PunchesSkipped += record.Punches.Count;
                result.Errors.Add($"Unknown COSEC USERID '{record.UserId}' — no matching active employee code.");
                continue;
            }

            foreach (var punch in record.Punches)
            {
                try
                {
                    var punchTimeUtc = TimeZoneInfo.ConvertTimeToUtc(
                        DateTime.SpecifyKind(punch.PunchTime, DateTimeKind.Unspecified), deviceTz);

                    var alreadyLogged = await db.DeviceLogs.AnyAsync(
                        dl => dl.EmployeeCode == record.UserId && dl.PunchTime == punchTimeUtc, ct);

                    if (alreadyLogged)
                    {
                        result.PunchesSkipped++;
                        continue;
                    }

                    var punchType = punch.SpfId != 0 && punch.SpfId % 2 == 0
                        ? PunchType.CheckOut
                        : PunchType.CheckIn;

                    var attendanceLog = new AttendanceLog
                    {
                        EmployeeId = employee.Id,
                        BranchId = employee.BranchId,
                        PunchType = punchType,
                        PunchTime = punchTimeUtc,
                        Source = AttendanceSource.Cosec,
                        Notes = $"COSEC SPFID {punch.SpfId}"
                    };

                    db.AttendanceLogs.Add(attendanceLog);
                    await db.SaveChangesAsync(ct);

                    db.DeviceLogs.Add(new DeviceLog
                    {
                        DeviceId = null,
                        EmployeeCode = record.UserId,
                        PunchTime = punchTimeUtc,
                        RawPunchType = punch.SpfId,
                        IsSynced = true,
                        SyncedAt = DateTime.UtcNow,
                        AttendanceLogId = attendanceLog.Id
                    });
                    await db.SaveChangesAsync(ct);

                    result.PunchesProcessed++;
                }
                catch (Exception ex)
                {
                    result.PunchesSkipped++;
                    result.Errors.Add($"Error saving punch for '{record.UserId}' at {punch.PunchTime:O}: {ex.Message}");
                }
            }
        }

        return result;
    }

    private string BuildRequestUrl(TimeZoneInfo deviceTz)
    {
        var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, deviceTz).Date;
        var fromLocal = todayLocal.AddDays(-Math.Max(_settings.LookbackDays, 0));
        var dateRange = $"{fromLocal:ddMMyyyy}-{todayLocal:ddMMyyyy}";

        var args = new List<string> { "action=get", $"date-range={dateRange}", $"range={_settings.Range}" };
        if (!string.IsNullOrWhiteSpace(_settings.RangeId))
            args.Add($"id={_settings.RangeId}");
        args.Add($"field-name={string.Join(',', FieldNames)}");

        var query = string.Join(';', args);
        return $"{_settings.BaseUrl.TrimEnd('/')}/attendance-daily?{query}";
    }
}
