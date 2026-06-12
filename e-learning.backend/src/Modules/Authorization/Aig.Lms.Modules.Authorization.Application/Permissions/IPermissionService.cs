namespace Aig.Lms.Modules.Authorization.Application.Permissions;

public interface IPermissionService
{
    Task<IReadOnlySet<string>> GetPermissionsForRolesAsync(IEnumerable<string> roleCodes, CancellationToken ct = default);
}
