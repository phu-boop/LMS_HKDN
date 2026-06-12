using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

// ─── Logout Everywhere — revoke all OTHER active sessions, keep current ───

public sealed record RevokeAllOtherSessionsCommand(
    Guid UserId,
    string CurrentRefreshToken,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed record RevokeAllOtherSessionsResult(bool Succeeded, int RevokedCount);

public sealed class RevokeAllOtherSessionsCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;

    public RevokeAllOtherSessionsCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
    }

    public async Task<RevokeAllOtherSessionsResult> HandleAsync(
        RevokeAllOtherSessionsCommand command,
        CancellationToken ct = default)
    {
        // Identify the current session to keep
        var tokenHash = _tokenService.HashRefreshToken(command.CurrentRefreshToken);
        var currentSession = await _userRepository.FindSessionByRefreshTokenHashAsync(tokenHash, ct);

        // If the token belongs to a different user, treat as "no current session" (revoke all)
        Guid? keepSessionId = currentSession?.UserId == command.UserId ? currentSession.Id : null;

        var revokedCount = await _userRepository.RevokeOtherSessionsAsync(command.UserId, keepSessionId, ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "SESSION_REVOKED_ALL",
            EntityType: "UserAccount",
            EntityId: command.UserId,
            ActorUserId: command.UserId,
            IpAddress: command.IpAddress,
            UserAgent: command.UserAgent,
            Metadata: $"{{\"revoked_count\":{revokedCount},\"kept_session_id\":\"{keepSessionId}\"}}"), ct);

        return new RevokeAllOtherSessionsResult(true, revokedCount);
    }
}

// ─── Admin: Revoke ALL sessions of any user ────────────────────────────────

public sealed record AdminRevokeAllUserSessionsCommand(
    Guid TargetUserId,
    Guid AdminId,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed record AdminRevokeAllUserSessionsResult(bool Succeeded, string? Error);

public sealed class AdminRevokeAllUserSessionsCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogService _auditLogService;

    public AdminRevokeAllUserSessionsCommandHandler(
        IUserRepository userRepository,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _auditLogService = auditLogService;
    }

    public async Task<AdminRevokeAllUserSessionsResult> HandleAsync(
        AdminRevokeAllUserSessionsCommand command,
        CancellationToken ct = default)
    {
        var user = await _userRepository.FindByIdAsync(command.TargetUserId, ct);
        if (user is null)
            return new AdminRevokeAllUserSessionsResult(false, "User not found.");

        await _userRepository.RevokeAllUserSessionsAsync(command.TargetUserId, ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "SESSION_REVOKED_ALL",
            EntityType: "UserAccount",
            EntityId: command.TargetUserId,
            ActorUserId: command.AdminId,
            IpAddress: command.IpAddress,
            UserAgent: command.UserAgent,
            Metadata: $"{{\"target_user_id\":\"{command.TargetUserId}\",\"is_admin\":true}}"), ct);

        return new AdminRevokeAllUserSessionsResult(true, null);
    }
}
