using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Roles;

public sealed record GetRolesWithPermissionsQuery;

public sealed class GetRolesWithPermissionsQueryHandler
{
    private readonly IAuthorizationRepository _repository;

    public GetRolesWithPermissionsQueryHandler(IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<RoleWithPermissions>> HandleAsync(CancellationToken ct = default)
    {
        var roles = await _repository.GetAllRolesAsync(null, ct);

        var results = new List<RoleWithPermissions>(roles.Count);
        foreach (var role in roles)
        {
            var permissions = await _repository.GetPermissionsByRoleIdAsync(role.Id, ct);
            results.Add(new RoleWithPermissions(
                role.Id,
                role.Code,
                role.Name,
                permissions.Select(p => p.Code).Order().ToArray()));
        }

        return results;
    }
}

public sealed record RoleWithPermissions(
    Guid Id,
    string Code,
    string Name,
    IReadOnlyList<string> PermissionCodes);
