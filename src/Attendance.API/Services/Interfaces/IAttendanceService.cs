using Attendance.API.DTOs.Attendance;

namespace Attendance.API.Services.Interfaces;

public interface IAttendanceService
{
    Task<PunchResponse> PunchAsync(int employeeId, PunchRequest request);
    Task<IEnumerable<AttendanceHistoryDto>> GetHistoryAsync(int employeeId, DateTime? from, DateTime? to);
    Task<IEnumerable<AttendanceSummaryDto>> GetSummaryAsync(int employeeId, int year, int month);
    Task<IEnumerable<AttendanceHistoryDto>> GetBranchAttendanceAsync(int branchId, DateTime date);
}
