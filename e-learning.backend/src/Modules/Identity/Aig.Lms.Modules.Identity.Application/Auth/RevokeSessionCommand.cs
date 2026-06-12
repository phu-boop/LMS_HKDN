using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record RevokeSessionCommand(Guid SessionId, Guid RequestingUserId, bool IsAdmin = false);
public sealed record RevokeSessionResult(bool Succeeded, string? Error);

public sealed class RevokeSessionCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IAuditLogService _auditLogService;

    public RevokeSessionCommandHandler(IUserRepository userRepository, IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _auditLogService = auditLogService;
    }

    public async Task<RevokeSessionResult> HandleAsync(RevokeSessionCommand command, CancellationToken ct = default)
    {
        var session = await _userRepository.FindSessionByIdAsync(command.SessionId, ct);

        if (session is null || session.Status != "ACTIVE")
            return new RevokeSessionResult(false, "Session not found or already revoked.");

        // Non-admin users may only revoke their own sessions
        if (!command.IsAdmin && session.UserId != command.RequestingUserId)
            return new RevokeSessionResult(false, "Session not found or already revoked.");

        await _userRepository.RevokeSessionAsync(command.SessionId, ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "SESSION_REVOKED",
            EntityType: "UserSession",
            EntityId: command.SessionId,
            SchoolId: session.SchoolId,
            ActorUserId: command.RequestingUserId,
            Metadata: $"{{\"target_user_id\":\"{session.UserId}\",\"is_admin\":{command.IsAdmin.ToString().ToLower()}}}"), ct);

        return new RevokeSessionResult(true, null);
    }
}
