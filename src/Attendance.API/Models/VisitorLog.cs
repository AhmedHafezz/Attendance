namespace Attendance.API.Models;

public class VisitorLog
{
    public long Id { get; set; }
    public int BranchId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string? VisitorPhone { get; set; }
    public string? VisitorEmail { get; set; }
    public int? HostEmployeeId { get; set; }
    public string? Purpose { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? BadgeNumber { get; set; }
    public string? NationalId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Branch Branch { get; set; } = null!;
    public Employee? HostEmployee { get; set; }
}
