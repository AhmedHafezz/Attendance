using System.Globalization;
using Attendance.API.DTOs.Cosec;

namespace Attendance.API.Services;

// Parses the pipe-delimited "Getting Daily Attendance Data" response from the Matrix COSEC
// Web API (attendance-daily). Rows are '|'-separated and the whole payload is terminated by
// a literal "<EOT>" marker. Column order matches the field-name list we sent in the request,
// so we map columns back to names positionally using that same list rather than a fixed schema.
public static class CosecResponseParser
{
    private const string EotMarker = "<EOT>";

    private static readonly string[] DateTimeFormats =
    [
        "dd-MM-yyyy HH:mm:ss",
        "dd/MM/yyyy HH:mm:ss",
        "ddMMyyyy HH:mm:ss",
        "dd-MM-yyyy HH:mm",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-ddTHH:mm:ss",
    ];

    public static List<CosecAttendanceRecord> Parse(string rawResponse, IReadOnlyList<string> fieldNames)
    {
        var records = new List<CosecAttendanceRecord>();
        if (string.IsNullOrWhiteSpace(rawResponse)) return records;

        var body = rawResponse.Replace(EotMarker, string.Empty);
        var lines = body.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var line in lines)
        {
            var columns = line.Split('|');
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < fieldNames.Count && i < columns.Length; i++)
            {
                row[fieldNames[i].Trim()] = columns[i].Trim();
            }

            if (!row.TryGetValue("USERID", out var userId) || string.IsNullOrWhiteSpace(userId))
                continue;

            var record = new CosecAttendanceRecord { UserId = userId };

            for (var slot = 1; slot <= 12; slot++)
            {
                if (!row.TryGetValue($"PUNCH{slot}", out var punchRaw) || string.IsNullOrWhiteSpace(punchRaw))
                    continue;

                if (!TryParsePunchTime(punchRaw, out var punchTime))
                    continue;

                var spfId = 0;
                if (row.TryGetValue($"SPFID{slot}", out var spfRaw))
                    int.TryParse(spfRaw, out spfId);

                record.Punches.Add(new CosecPunchEntry { PunchTime = punchTime, SpfId = spfId });
            }

            if (record.Punches.Count > 0)
                records.Add(record);
        }

        return records;
    }

    private static bool TryParsePunchTime(string raw, out DateTime result)
    {
        foreach (var format in DateTimeFormats)
        {
            if (DateTime.TryParseExact(raw, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out result))
                return true;
        }

        return DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out result);
    }
}
