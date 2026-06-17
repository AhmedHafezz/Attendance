using Attendance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Attendance.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "Admin")]
public class CosecController(ICosecSyncService syncService) : ControllerBase
{
    // Manually triggers a COSEC poll/sync cycle without waiting for the background worker's
    // interval — useful for verifying connectivity/credentials after configuring CosecSettings.
    [HttpPost("sync-now")]
    public async Task<IActionResult> SyncNow(CancellationToken ct)
    {
        var result = await syncService.PollAndSyncAsync(ct);
        return Ok(result);
    }
}
