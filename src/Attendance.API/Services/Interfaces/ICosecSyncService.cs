using Attendance.API.DTOs.Cosec;

namespace Attendance.API.Services.Interfaces;

public interface ICosecSyncService
{
    Task<CosecSyncResult> PollAndSyncAsync(CancellationToken ct = default);
}
