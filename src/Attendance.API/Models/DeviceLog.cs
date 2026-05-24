namespace Attendance.API.Models;

public class DeviceLog
{
    public long Id { get; set; }
    public int DeviceId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public DateTime PunchTime { get; set; }
    public int RawPunchType { get; set; }
    public bool IsSynced { get; set; } = false;
    public DateTime? SyncedAt { get; set; }
    public long? AttendanceLogId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ZKDevice Device { get; set; } = null!;
    public AttendanceLog? AttendanceLog { get; set; }
}
