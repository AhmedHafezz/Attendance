namespace Attendance.API.DTOs.ZKDevice;

public class ZKDeviceDto
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string DeviceSerial { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public DateTime? LastSyncAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RegisterDeviceRequest
{
    public int BranchId { get; set; }
    public string DeviceSerial { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
}

public class DeviceAuthRequest
{
    public string DeviceSerial { get; set; } = string.Empty;
    public string DeviceKey { get; set; } = string.Empty;
}

public class SyncLogEntry
{
    public string EmployeeCode { get; set; } = string.Empty;
    public DateTime PunchTime { get; set; }
    public int RawPunchType { get; set; }
}

public class SyncRequest
{
    public List<SyncLogEntry> Logs { get; set; } = [];
}

public class SyncResponse
{
    public int TotalReceived { get; set; }
    public int Processed { get; set; }
    public int Skipped { get; set; }
    public List<string> Errors { get; set; } = [];
}
