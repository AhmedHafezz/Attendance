using System.ComponentModel.DataAnnotations;
using Attendance.API.Models;

namespace Attendance.API.DTOs.Employee;

public class CreateEmployeeRequest
{
    [Required]
    public int BranchId { get; set; }

    [Required, MaxLength(50)]
    public string EmployeeCode { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }

    public EmployeeRole Role { get; set; } = EmployeeRole.Employee;
    public string? ProfileImageUrl { get; set; }
}
