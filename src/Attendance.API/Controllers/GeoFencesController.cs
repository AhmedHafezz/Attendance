using Attendance.API.Data;
using Attendance.API.DTOs.GeoFence;
using Attendance.API.Extensions;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/[controller]")]
public class GeoFencesController(AppDbContext db, IGpsService gps) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<GeoFenceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var query = db.GeoFences
            .Include(g => g.Branch)
            .Where(g => g.Branch.CompanyId == companyId);
        if (branchId.HasValue) query = query.Where(g => g.BranchId == branchId);

        var fences = await query
            .OrderBy(g => g.BranchId)
            .Select(g => new GeoFenceDto
            {
                Id = g.Id,
                BranchId = g.BranchId,
                BranchName = g.Branch.Name,
                Name = g.Name,
                Latitude = g.Latitude,
                Longitude = g.Longitude,
                RadiusMeters = g.RadiusMeters,
                EnforceOnMobile = g.EnforceOnMobile,
                IsActive = g.IsActive
            })
            .ToListAsync();

        return Ok(fences);
    }

    [HttpPost]
    [ProducesResponseType(typeof(GeoFenceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateGeoFenceRequest request)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        if (!await db.Branches.AnyAsync(b => b.Id == request.BranchId && b.CompanyId == companyId))
            return BadRequest(new { message = "Invalid branch." });

        var fence = new GeoFence
        {
            BranchId = request.BranchId,
            Name = request.Name,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            RadiusMeters = request.RadiusMeters,
            EnforceOnMobile = request.EnforceOnMobile
        };

        db.GeoFences.Add(fence);
        await db.SaveChangesAsync();

        await db.Entry(fence).Reference(g => g.Branch).LoadAsync();

        return CreatedAtAction(nameof(GetAll), new { branchId = fence.BranchId }, new GeoFenceDto
        {
            Id = fence.Id,
            BranchId = fence.BranchId,
            BranchName = fence.Branch.Name,
            Name = fence.Name,
            Latitude = fence.Latitude,
            Longitude = fence.Longitude,
            RadiusMeters = fence.RadiusMeters,
            EnforceOnMobile = fence.EnforceOnMobile,
            IsActive = fence.IsActive
        });
    }

    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Validate(
        [FromQuery] int branchId,
        [FromQuery] double lat,
        [FromQuery] double lon)
    {
        var isInside = await gps.IsWithinGeoFenceAsync(branchId, lat, lon);
        return Ok(new { branchId, latitude = lat, longitude = lon, isWithinFence = isInside });
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var fence = await db.GeoFences
            .FirstOrDefaultAsync(g => g.Id == id && g.Branch.CompanyId == companyId);
        if (fence is null) return NotFound();

        db.GeoFences.Remove(fence);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
