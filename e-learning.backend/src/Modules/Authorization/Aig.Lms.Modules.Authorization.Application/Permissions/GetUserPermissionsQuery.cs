using Aig.Lms.Modules.Authorization.Application.Roles;

namespace Aig.Lms.Modules.Authorization.Application.Permissions;

public sealed record GetUserPermissionsQuery(Guid UserId);

public sealed class GetUserPermissionsQueryHandler
{
    private readonly IAuthorizationRepository _repository;
    private readonly IPermissionService _permissionService;

    public GetUserPermissionsQueryHandler(
        IAuthorizationRepository repository,
        IPermissionService permissionService)
    {
        _repository = repository;
        _permissionService = permissionService;
    }

    public async Task<UserPermissionsResult> HandleAsync(GetUserPermissionsQuery query, CancellationToken ct = default)
    {
        var assignments = await _repository.GetUserRolesAsync(query.UserId, ct);
        if (assignments.Count == 0)
            return new UserPermissionsResult(query.UserId, [], []);

        var roleCodes = assignments.Select(a => a.RoleCode).Distinct().ToArray();
        var permissions = await _permissionService.GetPermissionsForRolesAsync(roleCodes, ct);

        return new UserPermissionsResult(query.UserId, roleCodes, permissions.Order().ToArray());
    }
}

public sealed record UserPermissionsResult(
    Guid UserId,
    IReadOnlyList<string> RoleCodes,
    IReadOnlyList<string> PermissionCodes);
