using Attendance.API.Data;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Services;

public class GpsService(AppDbContext db) : IGpsService
{
    private const double EarthRadiusMeters = 6_371_000;

    public double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusMeters * c;
    }

    public async Task<bool> IsWithinGeoFenceAsync(int branchId, double latitude, double longitude)
    {
        var fences = await db.GeoFences
            .Where(g => g.BranchId == branchId && g.IsActive && g.EnforceOnMobile)
            .ToListAsync();

        if (fences.Count == 0)
            return true; // no fence configured = unrestricted

        return fences.Any(f =>
            CalculateDistanceMeters(latitude, longitude, f.Latitude, f.Longitude) <= f.RadiusMeters);
    }

    private static double ToRad(double degrees) => degrees * Math.PI / 180;
}
