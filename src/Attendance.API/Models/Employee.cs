namespace Attendance.API.Models;

public class Employee
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int BranchId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public EmployeeRole Role { get; set; } = EmployeeRole.Employee;
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company Company { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ICollection<AttendanceLog> AttendanceLogs { get; set; } = [];
    public ICollection<VisitorLog> HostedVisitors { get; set; } = [];
}

public enum EmployeeRole
{
    Employee = 0,
    Manager = 1,
    Admin = 2
}
