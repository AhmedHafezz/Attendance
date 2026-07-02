using System.Linq.Expressions;
using Attendance.API.Data;
using Attendance.API.DTOs.Attendance;
using Attendance.API.Models;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Services;

public class AttendanceService(AppDbContext db) : IAttendanceService
{
    public async Task<PunchResponse> PunchAsync(int employeeId, PunchRequest request)
    {
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId && e.IsActive)
            ?? throw new KeyNotFoundException("Employee not found or inactive.");

        var log = new AttendanceLog
        {
            EmployeeId = employeeId,
            BranchId = employee.BranchId,
            PunchType = request.PunchType,
            PunchTime = DateTime.UtcNow,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Source = AttendanceSource.Mobile,
            Notes = request.Notes
        };

        db.AttendanceLogs.Add(log);
        await db.SaveChangesAsync();

        return new PunchResponse
        {
            Id = log.Id,
            PunchType = log.PunchType,
            PunchTime = log.PunchTime,
            Message = $"{request.PunchType} recorded successfully."
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
            .Where(a => a.EmployeeId == employeeId && a.PunchTime >= from && a.PunchTime < to)
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

    // Branch attendance is scoped by companyId as well as branchId so a caller
    // can never read another tenant's branch by passing its id.
    public Task<IEnumerable<AttendanceHistoryDto>> GetBranchAttendanceAsync(
        int branchId, int companyId, DateTime date) =>
        QueryAttendanceAsync(a => a.BranchId == branchId && a.Branch.CompanyId == companyId, date);

    public Task<IEnumerable<AttendanceHistoryDto>> GetCompanyAttendanceAsync(
        int companyId, DateTime date) =>
        QueryAttendanceAsync(a => a.Branch.CompanyId == companyId, date);

    private async Task<IEnumerable<AttendanceHistoryDto>> QueryAttendanceAsync(
        Expression<Func<AttendanceLog, bool>> scope, DateTime date)
    {
        var from = date.Date;
        var to = from.AddDays(1);

        return await db.AttendanceLogs
            .Where(scope)
            .Where(a => a.PunchTime >= from && a.PunchTime < to)
            .OrderByDescending(a => a.PunchTime)
            .Select(ToHistoryDto)
            .ToListAsync();
    }

    private static readonly Expression<Func<AttendanceLog, AttendanceHistoryDto>> ToHistoryDto =
        a => new AttendanceHistoryDto
        {
            Id = a.Id,
            EmployeeName = $"{a.Employee.FirstName} {a.Employee.LastName}",
            EmployeeCode = a.Employee.EmployeeCode,
            PunchType = a.PunchType,
            PunchTime = a.PunchTime,
            Latitude = a.Latitude,
            Longitude = a.Longitude,
            Source = a.Source.ToString(),
            Notes = a.Notes,
            BranchName = a.Branch.Name
        };
}
