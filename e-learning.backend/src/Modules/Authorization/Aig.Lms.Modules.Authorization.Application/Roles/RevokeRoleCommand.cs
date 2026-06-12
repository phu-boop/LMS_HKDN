namespace Aig.Lms.Modules.Authorization.Application.Roles;

public sealed record RevokeRoleCommand(
    Guid UserId,
    Guid RoleId,
    Guid TenantId);

public sealed class RevokeRoleCommandHandler
{
    private readonly IAuthorizationRepository _repository;

    public RevokeRoleCommandHandler(IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> HandleAsync(RevokeRoleCommand command, CancellationToken ct = default)
        => await _repository.RevokeRoleAsync(
            command.UserId,
            command.RoleId,
            command.TenantId,
            ct);
}
