using System.ComponentModel.DataAnnotations;
using Attendance.API.Models;

namespace Attendance.API.DTOs.Employee;

public class UpdateEmployeeRequest
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public int? BranchId { get; set; }
    public EmployeeRole? Role { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool? IsActive { get; set; }
}
