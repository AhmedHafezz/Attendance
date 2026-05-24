using Attendance.API.DTOs.Auth;

namespace Attendance.API.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken);
    Task RevokeTokenAsync(int employeeId);
}
