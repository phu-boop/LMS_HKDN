namespace Aig.Lms.Modules.Authorization.Application.Roles;

public sealed record AssignRoleCommand(
    Guid UserId,
    Guid RoleId,
    Guid TenantId);

public sealed class AssignRoleCommandHandler
{
    private readonly IAuthorizationRepository _repository;

    public AssignRoleCommandHandler(IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public async Task HandleAsync(AssignRoleCommand command, CancellationToken ct = default)
    {
        var roleExists = await _repository.RoleExistsAsync(command.RoleId, ct);
        if (!roleExists)
            throw new InvalidOperationException($"Role '{command.RoleId}' does not exist.");

        await _repository.AssignRoleAsync(
            command.UserId,
            command.RoleId,
            command.TenantId,
            ct);
    }
}
