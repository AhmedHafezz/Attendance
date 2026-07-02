using System.Security.Cryptography;
using Attendance.API.Data;
using Attendance.API.DTOs.ZKDevice;
using Attendance.API.Extensions;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ZKDevicesController(AppDbContext db, IZKSyncService syncService) : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ZKDeviceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var query = db.ZKDevices
            .Include(d => d.Branch)
            .Where(d => d.Branch.CompanyId == companyId);
        if (branchId.HasValue) query = query.Where(d => d.BranchId == branchId);

        var devices = await query
            .OrderBy(d => d.DeviceName)
            .Select(d => new ZKDeviceDto
            {
                Id = d.Id,
                BranchId = d.BranchId,
                BranchName = d.Branch.Name,
                DeviceSerial = d.DeviceSerial,
                DeviceName = d.DeviceName,
                LastSyncAt = d.LastSyncAt,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(devices);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterDeviceRequest request)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        if (!await db.Branches.AnyAsync(b => b.Id == request.BranchId && b.CompanyId == companyId))
            return BadRequest(new { message = "Invalid branch." });

        if (await db.ZKDevices.AnyAsync(d => d.DeviceSerial == request.DeviceSerial))
            return Conflict(new { message = "Device serial already registered." });

        var deviceKey = GenerateDeviceKey();

        var device = new ZKDevice
        {
            BranchId = request.BranchId,
            DeviceSerial = request.DeviceSerial,
            DeviceName = request.DeviceName,
            DeviceKey = BCrypt.Net.BCrypt.HashPassword(deviceKey)
        };

        db.ZKDevices.Add(device);
        await db.SaveChangesAsync();

        return Created($"/api/v1/zkdevices/{device.Id}", new
        {
            device.Id,
            device.DeviceSerial,
            device.DeviceName,
            DeviceKey = deviceKey, // only returned once at registration
            message = "Store this device key securely — it will not be shown again."
        });
    }

    [HttpPost("auth")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AuthenticateDevice([FromBody] DeviceAuthRequest request)
    {
        var device = await db.ZKDevices
            .FirstOrDefaultAsync(d => d.DeviceSerial == request.DeviceSerial && d.IsActive);

        if (device is null || !BCrypt.Net.BCrypt.Verify(request.DeviceKey, device.DeviceKey))
            return Unauthorized(new { message = "Invalid device credentials." });

        return Ok(new { device.Id, device.DeviceName, message = "Device authenticated." });
    }

    [HttpPost("{deviceId:int}/sync")]
    [ProducesResponseType(typeof(SyncResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Sync(
        int deviceId,
        [FromHeader(Name = "X-Device-Key")] string deviceKey,
        [FromBody] SyncRequest request)
    {
        var device = await db.ZKDevices
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.IsActive);

        if (device is null || !BCrypt.Net.BCrypt.Verify(deviceKey, device.DeviceKey))
            return Unauthorized(new { message = "Invalid device credentials." });

        var result = await syncService.ProcessDeviceLogsAsync(deviceId, request);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Deactivate(int id)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var device = await db.ZKDevices
            .FirstOrDefaultAsync(d => d.Id == id && d.Branch.CompanyId == companyId);
        if (device is null) return NotFound();

        device.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateDeviceKey()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes);
    }
}
