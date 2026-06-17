namespace Attendance.API.Models;

public class AttendanceLog
{
    public long Id { get; set; }
    public int EmployeeId { get; set; }
    public int BranchId { get; set; }
    public PunchType PunchType { get; set; }
    public DateTime PunchTime { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public AttendanceSource Source { get; set; } = AttendanceSource.Mobile;
    public int? DeviceId { get; set; }
    public bool IsValid { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Employee Employee { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ZKDevice? Device { get; set; }
}

public enum PunchType
{
    CheckIn = 0,
    CheckOut = 1
}

public enum AttendanceSource
{
    Mobile = 0,
    ZKDevice = 1,
    Manual = 2,
    Cosec = 3
}
