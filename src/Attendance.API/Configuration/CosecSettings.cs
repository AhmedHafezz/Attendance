namespace Attendance.API.Configuration;

public class CosecSettings
{
    public bool Enabled { get; set; } = false;
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKeyHeaderName { get; set; } = "APIKEY";
    public string ApiKey { get; set; } = string.Empty;

    // COSEC "range" selector for attendance-daily (all/organization/branch/department/...)
    public string Range { get; set; } = "all";
    public string? RangeId { get; set; }

    public int SyncIntervalMinutes { get; set; } = 15;

    // How many extra days back to re-request, to catch punches the device reports late.
    public int LookbackDays { get; set; } = 1;

    // IANA id of the timezone the COSEC device clock/punches are recorded in.
    public string DeviceTimeZoneId { get; set; } = "Africa/Cairo";
}
