using Attendance.API.Models;

namespace Attendance.API.DTOs.Attendance;

public class AttendanceHistoryDto
{
    public long Id { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public PunchType PunchType { get; set; }
    public DateTime PunchTime { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Source { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string BranchName { get; set; } = string.Empty;
}

public class AttendanceSummaryDto
{
    public DateTime Date { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public TimeSpan? Duration { get; set; }
    public string Status { get; set; } = string.Empty;
}
