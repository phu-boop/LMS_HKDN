namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record LoginCommand(
    string Username,
    string Password,
    string? Domain = null,
    string? UserAgent = null,
    string? IpAddress = null);

public sealed record LoginResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    IdentityTenantBranding? TenantBranding,
    string TokenType = "Bearer");

public sealed record IdentityTenantBranding(
    string TenantCode,
    string Name,
    string Subdomain,
    string Domain,
    bool IsWhiteLabel,
    string? LogoUrl,
    string? AvatarUrl,
    string? WatermarkSettings);

public sealed record LoginError(string Code, string Message, int? RetryAfterSeconds = null);

