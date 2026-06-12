using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Users.Application.Users;

public sealed record ResetPasswordCommand(
    Guid UserId,
    string NewPassword,
    Guid? ActorUserId = null,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed class ResetPasswordCommandHandler
{
    private readonly IUsersRepository _repository;
    private readonly IAuditLogService _auditLog;

    public ResetPasswordCommandHandler(IUsersRepository repository, IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog   = auditLog;
    }

    public async Task<bool> HandleAsync(ResetPasswordCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.NewPassword))
            throw new ArgumentException("New password must not be empty.", nameof(command.NewPassword));

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(command.NewPassword);
        var updated = await _repository.ResetPasswordAsync(command.UserId, passwordHash, ct);
        if (!updated)
            return false;

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "USER_PASSWORD_RESET",
            EntityType:  "user_account",
            EntityId:    command.UserId,
            ActorUserId: command.ActorUserId,
            IpAddress:   command.IpAddress,
            UserAgent:   command.UserAgent), ct);

        return true;
    }
}
