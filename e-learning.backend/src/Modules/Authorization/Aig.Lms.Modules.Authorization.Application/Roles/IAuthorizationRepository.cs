using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Roles;

public interface IAuthorizationRepository
{
    Task<IReadOnlyList<Role>> GetAllRolesAsync(string? roleType = null, CancellationToken ct = default);
    Task<IReadOnlyList<UserTenantRoleAssignment>> GetUserRolesAsync(Guid userId, CancellationToken ct = default);
    Task<bool> RoleExistsAsync(Guid roleId, CancellationToken ct = default);
    Task AssignRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default);
    Task<bool> RevokeRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetPermissionCodesByRoleCodesAsync(IEnumerable<string> roleCodes, CancellationToken ct = default);
    Task<IReadOnlyList<Permission>> GetAllPermissionsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Permission>> GetPermissionsByRoleIdAsync(Guid roleId, CancellationToken ct = default);
}
