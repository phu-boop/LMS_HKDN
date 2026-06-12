using Aig.Lms.Modules.Identity.Domain;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public interface IUserRepository
{
    Task<UserAccount?> FindByIdentifierAsync(string identifier, CancellationToken ct = default);
    Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetRoleCodesAsync(Guid userId, CancellationToken ct = default);
    Task<Guid?> GetTenantIdAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Guid>> GetActiveTenantIdsAsync(Guid userId, CancellationToken ct = default);
    Task UpdateLastLoginAsync(Guid userId, CancellationToken ct = default);
    Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken ct = default);
    Task UpdatePasswordAsync(Guid userId, string newPasswordHash, CancellationToken ct = default);

    // Brute-force protection
    Task IncrementFailedLoginAsync(Guid userId, CancellationToken ct = default);
    Task ResetFailedLoginAsync(Guid userId, CancellationToken ct = default);
    Task LockUserAsync(Guid userId, DateTime lockedUntil, CancellationToken ct = default);

    // Session management
    Task<Guid> CreateSessionAsync(UserSession session, CancellationToken ct = default);
    Task<UserSession?> FindSessionByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken ct = default);
    Task<UserSession?> FindSessionByIdAsync(Guid sessionId, CancellationToken ct = default);
    Task UpdateSessionLastSeenAsync(Guid sessionId, string newRefreshTokenHash, DateTime newExpiresAt, CancellationToken ct = default);
    Task UpdateSessionTenantAsync(Guid sessionId, Guid newTenantId, string newRefreshTokenHash, CancellationToken ct = default);
    Task RevokeSessionAsync(Guid sessionId, CancellationToken ct = default);
    Task RevokeAllUserSessionsAsync(Guid userId, CancellationToken ct = default);
    Task<int> RevokeOtherSessionsAsync(Guid userId, Guid? exceptSessionId, CancellationToken ct = default);

    // Concurrent session policy
    Task<SchoolSessionPolicy> GetSchoolSessionPolicyAsync(Guid? schoolId, CancellationToken ct = default);
    Task<int> CountActiveSessionsAsync(Guid userId, Guid? schoolId, CancellationToken ct = default);
    Task<UserSession?> GetOldestActiveSessionAsync(Guid userId, Guid? schoolId, CancellationToken ct = default);
    Task<IReadOnlyList<UserSession>> GetUserSessionsAsync(Guid userId, bool activeOnly = true, CancellationToken ct = default);
    Task<AdminSessionDashboardDto> GetAdminSessionDashboardAsync(Guid? tenantId, CancellationToken ct = default);
}
