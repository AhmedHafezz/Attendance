using Attendance.API.Models;

namespace Attendance.API.DTOs.Attendance;

public class PunchResponse
{
    public long Id { get; set; }
    public PunchType PunchType { get; set; }
    public DateTime PunchTime { get; set; }
    public bool IsValid { get; set; }
    public bool LocationValidated { get; set; }
    public string? Message { get; set; }
}
