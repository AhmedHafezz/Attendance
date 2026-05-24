using Attendance.API.Data;
using Attendance.API.DTOs.ZKDevice;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Services;

public class ZKSyncService(AppDbContext db) : IZKSyncService
{
    public async Task<SyncResponse> ProcessDeviceLogsAsync(int deviceId, SyncRequest request)
    {
        var device = await db.ZKDevices
            .Include(d => d.Branch)
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.IsActive)
            ?? throw new KeyNotFoundException("Device not found or inactive.");

        var response = new SyncResponse { TotalReceived = request.Logs.Count };

        foreach (var entry in request.Logs)
        {
            try
            {
                var employee = await db.Employees
                    .FirstOrDefaultAsync(e => e.EmployeeCode == entry.EmployeeCode
                                           && e.CompanyId == device.Branch.CompanyId
                                           && e.IsActive);

                if (employee is null)
                {
                    response.Skipped++;
                    response.Errors.Add($"Employee '{entry.EmployeeCode}' not found.");
                    continue;
                }

                // avoid duplicate logs from same device
                bool duplicate = await db.DeviceLogs.AnyAsync(dl =>
                    dl.DeviceId == deviceId &&
                    dl.EmployeeCode == entry.EmployeeCode &&
                    dl.PunchTime == entry.PunchTime);

                if (duplicate)
                {
                    response.Skipped++;
                    continue;
                }

                var punchType = entry.RawPunchType == 0 ? PunchType.CheckIn : PunchType.CheckOut;

                var attendanceLog = new AttendanceLog
                {
                    EmployeeId = employee.Id,
                    BranchId = device.BranchId,
                    PunchType = punchType,
                    PunchTime = entry.PunchTime,
                    Source = AttendanceSource.ZKDevice,
                    DeviceId = deviceId,
                    IsValid = true
                };

                db.AttendanceLogs.Add(attendanceLog);
                await db.SaveChangesAsync();

                var deviceLog = new DeviceLog
                {
                    DeviceId = deviceId,
                    EmployeeCode = entry.EmployeeCode,
                    PunchTime = entry.PunchTime,
                    RawPunchType = entry.RawPunchType,
                    IsSynced = true,
                    SyncedAt = DateTime.UtcNow,
                    AttendanceLogId = attendanceLog.Id
                };

                db.DeviceLogs.Add(deviceLog);
                await db.SaveChangesAsync();

                response.Processed++;
            }
            catch (Exception ex)
            {
                response.Skipped++;
                response.Errors.Add($"Error processing entry for '{entry.EmployeeCode}': {ex.Message}");
            }
        }

        device.LastSyncAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return response;
    }

    public async Task<int> GetPendingSyncCountAsync(int deviceId)
    {
        return await db.DeviceLogs
            .CountAsync(dl => dl.DeviceId == deviceId && !dl.IsSynced);
    }
}
