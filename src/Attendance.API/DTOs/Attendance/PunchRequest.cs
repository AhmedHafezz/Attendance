using System.ComponentModel.DataAnnotations;
using Attendance.API.Models;

namespace Attendance.API.DTOs.Attendance;

public class PunchRequest
{
    [Required]
    public PunchType PunchType { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Notes { get; set; }
}
