namespace Aig.Lms.Modules.Identity.Domain;

public static class ConcurrentSessionPolicy
{
    public const string BlockNew = "BLOCK_NEW";
    public const string KickOldest = "KICK_OLDEST";
}

public sealed class SchoolSessionPolicy
{
    public int MaxConcurrentSessions { get; init; } = 50;
    public string Policy { get; init; } = ConcurrentSessionPolicy.KickOldest;
    public DateTime? ContractEnd { get; init; }
    public bool EnforceExpiry { get; init; } = true;

    public bool IsContractExpired() =>
        EnforceExpiry && ContractEnd.HasValue && ContractEnd.Value.ToUniversalTime() < DateTime.UtcNow;
}

public sealed class UserAccount
{
    public Guid Id { get; init; }
    public Guid? SchoolId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string PasswordHash { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int FailedLoginCount { get; init; }
    public DateTime? LockedUntil { get; init; }
}

public sealed class UserSession
{
    public Guid Id { get; init; }
    public Guid TenantId { get; init; }
    public Guid? SchoolId { get; init; }
    public Guid UserId { get; init; }
    public string RefreshTokenHash { get; init; } = string.Empty;
    public string? DeviceFingerprint { get; init; }
    public string? UserAgent { get; init; }
    public string? IpAddress { get; init; }
    public DateTime StartedAt { get; init; }
    public DateTime LastSeenAt { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime? EndedAt { get; init; }
    public string Status { get; init; } = string.Empty;
}
