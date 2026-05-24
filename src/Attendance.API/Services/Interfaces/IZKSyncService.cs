using Attendance.API.DTOs.ZKDevice;

namespace Attendance.API.Services.Interfaces;

public interface IZKSyncService
{
    Task<SyncResponse> ProcessDeviceLogsAsync(int deviceId, SyncRequest request);
    Task<int> GetPendingSyncCountAsync(int deviceId);
}
