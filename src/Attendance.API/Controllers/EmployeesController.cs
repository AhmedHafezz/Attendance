using System.Security.Claims;
using Attendance.API.Data;
using Attendance.API.DTOs.Employee;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class EmployeesController(AppDbContext db) : ControllerBase
{
    private int CurrentCompanyId => int.Parse(User.FindFirstValue("company_id")!);

    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? branchId,
        [FromQuery] bool? isActive)
    {
        var companyId = CurrentCompanyId;
        var query = db.Employees
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .Where(e => e.CompanyId == companyId);

        if (branchId.HasValue) query = query.Where(e => e.BranchId == branchId);
        if (isActive.HasValue) query = query.Where(e => e.IsActive == isActive);

        var employees = await query
            .OrderBy(e => e.LastName).ThenBy(e => e.FirstName)
            .Select(e => MapToDto(e))
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var employee = await db.Employees
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee is null) return NotFound();
        return Ok(MapToDto(employee));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var companyId = CurrentCompanyId;

        if (await db.Employees.AnyAsync(e => e.Email == request.Email))
            return Conflict(new { message = "Email already in use." });

        if (await db.Employees.AnyAsync(e => e.EmployeeCode == request.EmployeeCode))
            return Conflict(new { message = "Employee code already in use." });

        if (!await db.Branches.AnyAsync(b => b.Id == request.BranchId && b.CompanyId == companyId))
            return BadRequest(new { message = "Invalid branch." });

        var employee = new Employee
        {
            CompanyId = companyId,
            BranchId = request.BranchId,
            EmployeeCode = request.EmployeeCode,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = request.Phone,
            Role = request.Role,
            ProfileImageUrl = request.ProfileImageUrl
        };

        db.Employees.Add(employee);
        await db.SaveChangesAsync();

        await db.Entry(employee).Reference(e => e.Company).LoadAsync();
        await db.Entry(employee).Reference(e => e.Branch).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, MapToDto(employee));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var companyId = CurrentCompanyId;
        var employee = await db.Employees
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == companyId);

        if (employee is null) return NotFound();

        if (request.BranchId.HasValue &&
            !await db.Branches.AnyAsync(b => b.Id == request.BranchId && b.CompanyId == companyId))
            return BadRequest(new { message = "Invalid branch." });

        if (request.FirstName is not null) employee.FirstName = request.FirstName;
        if (request.LastName is not null) employee.LastName = request.LastName;
        if (request.Phone is not null) employee.Phone = request.Phone;
        if (request.BranchId.HasValue) employee.BranchId = request.BranchId.Value;
        if (request.Role.HasValue) employee.Role = request.Role.Value;
        if (request.ProfileImageUrl is not null) employee.ProfileImageUrl = request.ProfileImageUrl;
        if (request.IsActive.HasValue) employee.IsActive = request.IsActive.Value;

        await db.SaveChangesAsync();
        return Ok(MapToDto(employee));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(int id)
    {
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == id && e.CompanyId == CurrentCompanyId);
        if (employee is null) return NotFound();

        employee.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static EmployeeDto MapToDto(Employee e) => new()
    {
        Id = e.Id,
        EmployeeCode = e.EmployeeCode,
        FirstName = e.FirstName,
        LastName = e.LastName,
        Email = e.Email,
        Phone = e.Phone,
        Role = e.Role,
        ProfileImageUrl = e.ProfileImageUrl,
        IsActive = e.IsActive,
        CompanyId = e.CompanyId,
        CompanyName = e.Company?.Name ?? string.Empty,
        BranchId = e.BranchId,
        BranchName = e.Branch?.Name ?? string.Empty,
        CreatedAt = e.CreatedAt
    };
}
