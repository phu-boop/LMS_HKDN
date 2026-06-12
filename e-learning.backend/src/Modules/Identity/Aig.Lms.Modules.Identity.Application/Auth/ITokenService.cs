using Aig.Lms.Modules.Identity.Domain;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public interface ITokenService
{
    string GenerateAccessToken(UserAccount user, IReadOnlyList<string> roles, Guid? tenantId = null, string? subdomain = null, Guid? sessionId = null);
    int ExpiresInSeconds { get; }
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
    int RefreshTokenExpiryDays { get; }
    int MaxFailedLoginAttempts { get; }
    int LockoutMinutes { get; }
}
