namespace Attendance.API.Models;

public class ZKDevice
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string DeviceSerial { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceKey { get; set; } = string.Empty;
    public DateTime? LastSyncAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Branch Branch { get; set; } = null!;
    public ICollection<DeviceLog> DeviceLogs { get; set; } = [];
    public ICollection<AttendanceLog> AttendanceLogs { get; set; } = [];
}
