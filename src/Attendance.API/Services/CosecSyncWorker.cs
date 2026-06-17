using Attendance.API.Configuration;
using Attendance.API.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace Attendance.API.Services;

public class CosecSyncWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<CosecSettings> options,
    ILogger<CosecSyncWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled)
        {
            logger.LogInformation("COSEC sync worker is disabled (CosecSettings:Enabled = false). Skipping.");
            return;
        }

        var interval = TimeSpan.FromMinutes(Math.Max(options.Value.SyncIntervalMinutes, 1));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<ICosecSyncService>();
                var result = await syncService.PollAndSyncAsync(stoppingToken);

                if (result.Errors.Count > 0)
                {
                    logger.LogWarning(
                        "COSEC sync completed with issues: fetched={Fetched} processed={Processed} skipped={Skipped} errors={Errors}",
                        result.RecordsFetched, result.PunchesProcessed, result.PunchesSkipped, string.Join(" | ", result.Errors));
                }
                else
                {
                    logger.LogInformation(
                        "COSEC sync completed: fetched={Fetched} processed={Processed} skipped={Skipped}",
                        result.RecordsFetched, result.PunchesProcessed, result.PunchesSkipped);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled error during COSEC sync cycle.");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }
}
