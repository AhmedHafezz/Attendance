namespace Attendance.API.DTOs.GeoFence;

public class GeoFenceDto
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int RadiusMeters { get; set; }
    public bool EnforceOnMobile { get; set; }
    public bool IsActive { get; set; }
}

public class CreateGeoFenceRequest
{
    public int BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int RadiusMeters { get; set; } = 100;
    public bool EnforceOnMobile { get; set; } = true;
}
