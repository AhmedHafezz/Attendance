using Attendance.API.Data;
using Attendance.API.DTOs.Attendance;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Services;

public class AttendanceService(AppDbContext db, IGpsService gps) : IAttendanceService
{
    public async Task<PunchResponse> PunchAsync(int employeeId, PunchRequest request)
    {
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId && e.IsActive)
            ?? throw new KeyNotFoundException("Employee not found or inactive.");

        bool locationValidated = false;
        bool isValid = true;

        if (request.Latitude.HasValue && request.Longitude.HasValue)
        {
            locationValidated = await gps.IsWithinGeoFenceAsync(
                employee.BranchId, request.Latitude.Value, request.Longitude.Value);
            isValid = locationValidated;
        }

        var log = new AttendanceLog
        {
            EmployeeId = employeeId,
            BranchId = employee.BranchId,
            PunchType = request.PunchType,
            PunchTime = DateTime.UtcNow,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Source = AttendanceSource.Mobile,
            IsValid = isValid,
            Notes = request.Notes
        };

        db.AttendanceLogs.Add(log);
        await db.SaveChangesAsync();

        return new PunchResponse
        {
            Id = log.Id,
            PunchType = log.PunchType,
            PunchTime = log.PunchTime,
            IsValid = log.IsValid,
            LocationValidated = locationValidated,
            Message = isValid
                ? $"{request.PunchType} recorded successfully."
                : "Punch recorded but location is outside the allowed geo-fence."
        };
    }

    public async Task<IEnumerable<AttendanceHistoryDto>> GetHistoryAsync(
        int employeeId, DateTime? from, DateTime? to)
    {
        var query = db.AttendanceLogs
            .Include(a => a.Employee)
            .Include(a => a.Branch)
            .Where(a => a.EmployeeId == employeeId);

        if (from.HasValue) query = query.Where(a => a.PunchTime >= from.Value);
        if (to.HasValue) query = query.Where(a => a.PunchTime <= to.Value);

        return await query
            .OrderByDescending(a => a.PunchTime)
            .Select(a => new AttendanceHistoryDto
            {
                Id = a.Id,
                EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                EmployeeCode = a.Employee.EmployeeCode,
                PunchType = a.PunchType,
                PunchTime = a.PunchTime,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Source = a.Source.ToString(),
                IsValid = a.IsValid,
                Notes = a.Notes,
                BranchName = a.Branch.Name
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<AttendanceSummaryDto>> GetSummaryAsync(
        int employeeId, int year, int month)
    {
        var from = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var to = from.AddMonths(1);

        var logs = await db.AttendanceLogs
            .Where(a => a.EmployeeId == employeeId && a.PunchTime >= from && a.PunchTime < to && a.IsValid)
            .OrderBy(a => a.PunchTime)
            .ToListAsync();

        var grouped = logs.GroupBy(a => a.PunchTime.Date);
        var summaries = new List<AttendanceSummaryDto>();

        foreach (var group in grouped)
        {
            var checkIn = group.FirstOrDefault(a => a.PunchType == PunchType.CheckIn)?.PunchTime;
            var checkOut = group.LastOrDefault(a => a.PunchType == PunchType.CheckOut)?.PunchTime;
            TimeSpan? duration = (checkIn.HasValue && checkOut.HasValue)
                ? checkOut.Value - checkIn.Value
                : null;

            summaries.Add(new AttendanceSummaryDto
            {
                Date = group.Key,
                CheckIn = checkIn,
                CheckOut = checkOut,
                Duration = duration,
                Status = checkIn.HasValue ? (checkOut.HasValue ? "Complete" : "Open") : "Absent"
            });
        }

        return summaries;
    }

    public async Task<IEnumerable<AttendanceHistoryDto>> GetBranchAttendanceAsync(
        int branchId, DateTime date)
    {
        var from = date.Date;
        var to = from.AddDays(1);

        return await db.AttendanceLogs
            .Include(a => a.Employee)
            .Include(a => a.Branch)
            .Where(a => a.BranchId == branchId && a.PunchTime >= from && a.PunchTime < to)
            .OrderByDescending(a => a.PunchTime)
            .Select(a => new AttendanceHistoryDto
            {
                Id = a.Id,
                EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
                EmployeeCode = a.Employee.EmployeeCode,
                PunchType = a.PunchType,
                PunchTime = a.PunchTime,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Source = a.Source.ToString(),
                IsValid = a.IsValid,
                Notes = a.Notes,
                BranchName = a.Branch.Name
            })
            .ToListAsync();
    }
}
