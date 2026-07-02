using Attendance.API.Data;
using Attendance.API.DTOs.Visitor;
using Attendance.API.Extensions;
using Attendance.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class VisitorsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<VisitorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? branchId,
        [FromQuery] DateTime? date,
        [FromQuery] bool? activeOnly)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var query = db.VisitorLogs
            .Include(v => v.Branch)
            .Include(v => v.HostEmployee)
            .Where(v => v.Branch.CompanyId == companyId);

        if (branchId.HasValue) query = query.Where(v => v.BranchId == branchId);
        if (activeOnly == true) query = query.Where(v => v.CheckOutTime == null);

        if (date.HasValue)
        {
            var from = date.Value.Date;
            var to = from.AddDays(1);
            query = query.Where(v => v.CheckInTime >= from && v.CheckInTime < to);
        }

        var visitors = await query
            .OrderByDescending(v => v.CheckInTime)
            .Select(v => new VisitorDto
            {
                Id = v.Id,
                BranchId = v.BranchId,
                BranchName = v.Branch.Name,
                VisitorName = v.VisitorName,
                VisitorPhone = v.VisitorPhone,
                VisitorEmail = v.VisitorEmail,
                HostEmployeeName = v.HostEmployee != null
                    ? $"{v.HostEmployee.FirstName} {v.HostEmployee.LastName}" : null,
                Purpose = v.Purpose,
                CheckInTime = v.CheckInTime,
                CheckOutTime = v.CheckOutTime,
                BadgeNumber = v.BadgeNumber
            })
            .ToListAsync();

        return Ok(visitors);
    }

    [HttpPost]
    [ProducesResponseType(typeof(VisitorDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CheckIn([FromBody] CreateVisitorRequest request)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        if (!await db.Branches.AnyAsync(b => b.Id == request.BranchId && b.CompanyId == companyId))
            return BadRequest(new { message = "Invalid branch." });

        var visitor = new VisitorLog
        {
            BranchId = request.BranchId,
            VisitorName = request.VisitorName,
            VisitorPhone = request.VisitorPhone,
            VisitorEmail = request.VisitorEmail,
            HostEmployeeId = request.HostEmployeeId,
            Purpose = request.Purpose,
            CheckInTime = DateTime.UtcNow,
            BadgeNumber = request.BadgeNumber,
            NationalId = request.NationalId
        };

        db.VisitorLogs.Add(visitor);
        await db.SaveChangesAsync();

        if (visitor.HostEmployeeId.HasValue)
            await db.Entry(visitor).Reference(v => v.HostEmployee).LoadAsync();
        await db.Entry(visitor).Reference(v => v.Branch).LoadAsync();

        return CreatedAtAction(nameof(GetAll), new { branchId = visitor.BranchId }, new VisitorDto
        {
            Id = visitor.Id,
            BranchId = visitor.BranchId,
            BranchName = visitor.Branch.Name,
            VisitorName = visitor.VisitorName,
            VisitorPhone = visitor.VisitorPhone,
            VisitorEmail = visitor.VisitorEmail,
            HostEmployeeName = visitor.HostEmployee != null
                ? $"{visitor.HostEmployee.FirstName} {visitor.HostEmployee.LastName}" : null,
            Purpose = visitor.Purpose,
            CheckInTime = visitor.CheckInTime,
            BadgeNumber = visitor.BadgeNumber
        });
    }

    [HttpPut("{id:long}/checkout")]
    [ProducesResponseType(typeof(VisitorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckOut(long id, [FromBody] CheckOutVisitorRequest? request)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var visitor = await db.VisitorLogs
            .Include(v => v.Branch)
            .Include(v => v.HostEmployee)
            .FirstOrDefaultAsync(v => v.Id == id && v.Branch.CompanyId == companyId);

        if (visitor is null) return NotFound();
        if (visitor.CheckOutTime.HasValue)
            return BadRequest(new { message = "Visitor already checked out." });

        visitor.CheckOutTime = request?.CheckOutTime ?? DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new VisitorDto
        {
            Id = visitor.Id,
            BranchId = visitor.BranchId,
            BranchName = visitor.Branch.Name,
            VisitorName = visitor.VisitorName,
            VisitorPhone = visitor.VisitorPhone,
            VisitorEmail = visitor.VisitorEmail,
            HostEmployeeName = visitor.HostEmployee != null
                ? $"{visitor.HostEmployee.FirstName} {visitor.HostEmployee.LastName}" : null,
            Purpose = visitor.Purpose,
            CheckInTime = visitor.CheckInTime,
            CheckOutTime = visitor.CheckOutTime,
            BadgeNumber = visitor.BadgeNumber
        });
    }
}
