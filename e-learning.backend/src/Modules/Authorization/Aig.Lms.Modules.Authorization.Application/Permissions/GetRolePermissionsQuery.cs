using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Permissions;

public sealed record GetRolePermissionsQuery(Guid RoleId);

public sealed class GetRolePermissionsQueryHandler
{
    private readonly Roles.IAuthorizationRepository _repository;

    public GetRolePermissionsQueryHandler(Roles.IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<Permission>> HandleAsync(GetRolePermissionsQuery query, CancellationToken ct = default)
    {
        return _repository.GetPermissionsByRoleIdAsync(query.RoleId, ct);
    }
}
