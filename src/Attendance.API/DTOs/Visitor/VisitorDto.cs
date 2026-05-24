namespace Attendance.API.DTOs.Visitor;

public class VisitorDto
{
    public long Id { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string VisitorName { get; set; } = string.Empty;
    public string? VisitorPhone { get; set; }
    public string? VisitorEmail { get; set; }
    public string? HostEmployeeName { get; set; }
    public string? Purpose { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? BadgeNumber { get; set; }
    public bool IsCheckedOut => CheckOutTime.HasValue;
}

public class CreateVisitorRequest
{
    public int BranchId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string? VisitorPhone { get; set; }
    public string? VisitorEmail { get; set; }
    public int? HostEmployeeId { get; set; }
    public string? Purpose { get; set; }
    public string? BadgeNumber { get; set; }
    public string? NationalId { get; set; }
}

public class CheckOutVisitorRequest
{
    public DateTime? CheckOutTime { get; set; }
}
