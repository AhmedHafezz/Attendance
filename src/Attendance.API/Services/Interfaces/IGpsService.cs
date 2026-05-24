namespace Attendance.API.Services.Interfaces;

public interface IGpsService
{
    double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2);
    Task<bool> IsWithinGeoFenceAsync(int branchId, double latitude, double longitude);
}
