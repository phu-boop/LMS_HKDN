using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Users.Application.Users;

public sealed record ChangeUserStatusCommand(
    Guid UserId,
    string Status,
    Guid? ActorUserId = null,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed class ChangeUserStatusCommandHandler
{
    private readonly IUsersRepository _repository;
    private readonly IAuditLogService _auditLog;

    public ChangeUserStatusCommandHandler(IUsersRepository repository, IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog   = auditLog;
    }

    public async Task<bool> HandleAsync(ChangeUserStatusCommand command, CancellationToken ct = default)
    {
        var updated = await _repository.ChangeStatusAsync(command.UserId, command.Status, ct);
        if (!updated)
            return false;

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "USER_STATUS_CHANGED",
            EntityType:  "user_account",
            EntityId:    command.UserId,
            ActorUserId: command.ActorUserId,
            IpAddress:   command.IpAddress,
            UserAgent:   command.UserAgent,
            Metadata:    $"{{\"newStatus\":\"{command.Status}\"}}"), ct);

        return true;
    }
}
