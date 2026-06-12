namespace Aig.Lms.Modules.Identity.Infrastructure.Auth;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; init; } = string.Empty;
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public int ExpiryMinutes { get; init; } = 60;
    public int RefreshTokenExpiryDays { get; init; } = 7;
    public int MaxFailedLoginAttempts { get; init; } = 5;
    public int LockoutMinutes { get; init; } = 15;
}
