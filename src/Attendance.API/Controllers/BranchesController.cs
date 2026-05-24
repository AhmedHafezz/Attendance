using Attendance.API.Data;
using Attendance.API.DTOs.Branch;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/[controller]")]
public class BranchesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BranchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int? companyId)
    {
        var query = db.Branches
            .Include(b => b.Company)
            .Include(b => b.Employees)
            .AsQueryable();

        if (companyId.HasValue) query = query.Where(b => b.CompanyId == companyId);

        var branches = await query
            .OrderBy(b => b.Name)
            .Select(b => new BranchDto
            {
                Id = b.Id,
                CompanyId = b.CompanyId,
                CompanyName = b.Company.Name,
                Name = b.Name,
                Code = b.Code,
                Address = b.Address,
                IsActive = b.IsActive,
                EmployeeCount = b.Employees.Count(e => e.IsActive),
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(branches);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var branch = await db.Branches
            .Include(b => b.Company)
            .Include(b => b.Employees)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (branch is null) return NotFound();

        return Ok(new BranchDto
        {
            Id = branch.Id,
            CompanyId = branch.CompanyId,
            CompanyName = branch.Company.Name,
            Name = branch.Name,
            Code = branch.Code,
            Address = branch.Address,
            IsActive = branch.IsActive,
            EmployeeCount = branch.Employees.Count(e => e.IsActive),
            CreatedAt = branch.CreatedAt
        });
    }

    [HttpPost]
    [ProducesResponseType(typeof(BranchDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest request)
    {
        if (await db.Branches.AnyAsync(b => b.CompanyId == request.CompanyId && b.Code == request.Code))
            return Conflict(new { message = "Branch code already exists for this company." });

        var branch = new Branch
        {
            CompanyId = request.CompanyId,
            Name = request.Name,
            Code = request.Code,
            Address = request.Address
        };

        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = branch.Id }, new BranchDto
        {
            Id = branch.Id,
            CompanyId = branch.CompanyId,
            Name = branch.Name,
            Code = branch.Code,
            Address = branch.Address,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt
        });
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Deactivate(int id)
    {
        var branch = await db.Branches.FindAsync(id);
        if (branch is null) return NotFound();

        branch.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
