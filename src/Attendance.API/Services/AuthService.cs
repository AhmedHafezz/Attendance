using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Attendance.API.Data;
using Attendance.API.DTOs.Auth;
using Attendance.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Attendance.API.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var employee = await db.Employees
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .FirstOrDefaultAsync(e => e.Email == request.Email && e.IsActive);

        if (employee is null || !BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash))
            return null;

        var (accessToken, expiresAt) = GenerateAccessToken(employee);
        var refreshToken = GenerateRefreshToken();

        employee.RefreshToken = refreshToken;
        employee.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            config.GetValue<int>("JwtSettings:RefreshTokenExpiryDays", 30));

        await db.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            Employee = new EmployeeInfo
            {
                Id = employee.Id,
                EmployeeCode = employee.EmployeeCode,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                Role = employee.Role.ToString(),
                ProfileImageUrl = employee.ProfileImageUrl,
                CompanyId = employee.CompanyId,
                BranchId = employee.BranchId
            }
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        var employee = await db.Employees
            .Include(e => e.Company)
            .Include(e => e.Branch)
            .FirstOrDefaultAsync(e =>
                e.RefreshToken == refreshToken &&
                e.RefreshTokenExpiry > DateTime.UtcNow &&
                e.IsActive);

        if (employee is null)
            return null;

        var (accessToken, expiresAt) = GenerateAccessToken(employee);
        var newRefreshToken = GenerateRefreshToken();

        employee.RefreshToken = newRefreshToken;
        employee.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            config.GetValue<int>("JwtSettings:RefreshTokenExpiryDays", 30));

        await db.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            Employee = new EmployeeInfo
            {
                Id = employee.Id,
                EmployeeCode = employee.EmployeeCode,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                Role = employee.Role.ToString(),
                ProfileImageUrl = employee.ProfileImageUrl,
                CompanyId = employee.CompanyId,
                BranchId = employee.BranchId
            }
        };
    }

    public async Task RevokeTokenAsync(int employeeId)
    {
        var employee = await db.Employees.FindAsync(employeeId);
        if (employee is null) return;

        employee.RefreshToken = null;
        employee.RefreshTokenExpiry = null;
        await db.SaveChangesAsync();
    }

    private (string token, DateTime expiresAt) GenerateAccessToken(Models.Employee employee)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = config.GetValue<int>("JwtSettings:AccessTokenExpiryMinutes", 60);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new Claim(ClaimTypes.Email, employee.Email),
            new Claim(ClaimTypes.Role, employee.Role.ToString()),
            new Claim("company_id", employee.CompanyId.ToString()),
            new Claim("branch_id", employee.BranchId.ToString()),
            new Claim("employee_code", employee.EmployeeCode)
        };

        var token = new JwtSecurityToken(
            issuer: config["JwtSettings:Issuer"],
            audience: config["JwtSettings:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }
}
