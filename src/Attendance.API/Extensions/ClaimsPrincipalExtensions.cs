using System.Security.Claims;

namespace Attendance.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Company id from the JWT "company_id" claim, or null when the claim is
    /// absent or malformed. Callers must treat null as an unauthorized request —
    /// tenant scoping must never fall back to client-supplied values.
    /// </summary>
    public static int? GetCompanyId(this ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue("company_id"), out var id) ? id : null;
}
