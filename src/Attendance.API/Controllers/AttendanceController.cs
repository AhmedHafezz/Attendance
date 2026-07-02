using System.Security.Claims;
using Attendance.API.DTOs.Attendance;
using Attendance.API.Extensions;
using Attendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    [HttpPost("punch")]
    [ProducesResponseType(typeof(PunchResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Punch([FromBody] PunchRequest request)
    {
        var employeeId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await attendanceService.PunchAsync(employeeId, request);
        return Ok(result);
    }

    [HttpGet("history")]
    [ProducesResponseType(typeof(IEnumerable<AttendanceHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var employeeId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var history = await attendanceService.GetHistoryAsync(employeeId, from, to);
        return Ok(history);
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(IEnumerable<AttendanceSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int year,
        [FromQuery] int month)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        if (month == 0) month = DateTime.UtcNow.Month;

        var employeeId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var summary = await attendanceService.GetSummaryAsync(employeeId, year, month);
        return Ok(summary);
    }

    [Authorize(Roles = "Manager,Admin")]
    [HttpGet("branch/{branchId:int}")]
    [ProducesResponseType(typeof(IEnumerable<AttendanceHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBranchAttendance(
        int branchId,
        [FromQuery] DateTime? date)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var targetDate = date ?? DateTime.UtcNow.Date;
        var logs = await attendanceService.GetBranchAttendanceAsync(branchId, companyId, targetDate);
        return Ok(logs);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("company")]
    [ProducesResponseType(typeof(IEnumerable<AttendanceHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompanyAttendance([FromQuery] DateTime? date)
    {
        if (User.GetCompanyId() is not int companyId) return Unauthorized();

        var targetDate = date ?? DateTime.UtcNow.Date;
        var logs = await attendanceService.GetCompanyAttendanceAsync(companyId, targetDate);
        return Ok(logs);
    }
}
