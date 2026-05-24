namespace Attendance.API.Models;

public class Branch
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company Company { get; set; } = null!;
    public ICollection<Employee> Employees { get; set; } = [];
    public ICollection<AttendanceLog> AttendanceLogs { get; set; } = [];
    public ICollection<ZKDevice> ZKDevices { get; set; } = [];
    public ICollection<GeoFence> GeoFences { get; set; } = [];
    public ICollection<VisitorLog> VisitorLogs { get; set; } = [];
}
