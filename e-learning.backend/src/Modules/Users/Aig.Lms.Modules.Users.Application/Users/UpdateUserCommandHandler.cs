using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Users.Application.Users;

public sealed class UpdateUserCommandHandler
{
    private readonly IUsersRepository _repository;
    private readonly IAuditLogService _auditLog;

    public UpdateUserCommandHandler(IUsersRepository repository, IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog   = auditLog;
    }

    public async Task<UpdateUserResult?> HandleAsync(UpdateUserCommand command, CancellationToken ct = default)
    {
        var result = await _repository.UpdateAsync(command, ct);
        if (result is null)
            return null;

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "USER_UPDATED",
            EntityType:  "user_account",
            EntityId:    command.UserId,
            ActorUserId: command.ActorUserId,
            IpAddress:   command.IpAddress,
            UserAgent:   command.UserAgent), ct);

        return result;
    }
}
