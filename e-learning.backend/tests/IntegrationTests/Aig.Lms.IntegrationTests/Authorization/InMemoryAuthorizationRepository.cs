using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.IntegrationTests.Authorization;

/// <summary>
/// In-memory implementation of IAuthorizationRepository for integration tests.
/// Uses fixed GUIDs aligned with V2__seed_dev.sql so tests match real data shapes.
/// </summary>
internal sealed class InMemoryAuthorizationRepository : IAuthorizationRepository
{
    internal static readonly Guid LmsAdminRoleId    = Guid.Parse("00000000-0000-0000-0002-000000000001");
    internal static readonly Guid TenantAdminRoleId = Guid.Parse("00000000-0000-0000-0002-000000000002");
    internal static readonly Guid TeacherRoleId     = Guid.Parse("00000000-0000-0000-0002-000000000004");

    // A test user seeded with TEACHER role in one tenant
    internal static readonly Guid TestUserId        = Guid.Parse("00000000-0000-0000-0004-000000000099");
    private  static readonly Guid TestTenantId      = Guid.Parse("00000000-0000-0000-0000-000000000002");

    private static readonly IReadOnlyList<Role> AllRoles =
    [
        new Role { Id = LmsAdminRoleId,    Code = "LMS_ADMIN",    Name = "LMS Admin" },
        new Role { Id = TenantAdminRoleId, Code = "TENANT_ADMIN", Name = "Tenant Admin" },
        new Role { Id = TeacherRoleId,     Code = "TEACHER",      Name = "Teacher" },
    ];

    private static readonly IReadOnlyDictionary<Guid, IReadOnlyList<Permission>> PermissionsByRole =
        new Dictionary<Guid, IReadOnlyList<Permission>>
        {
            [LmsAdminRoleId] =
            [
                new Permission { Id = Guid.NewGuid(), Code = "TENANTS_VIEW", Module = "tenants", Name = "View Tenants" },
                new Permission { Id = Guid.NewGuid(), Code = "ROLES_VIEW",   Module = "roles",   Name = "View Roles" },
                new Permission { Id = Guid.NewGuid(), Code = "USERS_VIEW",   Module = "users",   Name = "View Users" },
            ],
            [TenantAdminRoleId] =
            [
                new Permission { Id = Guid.NewGuid(), Code = "ROLES_VIEW",   Module = "roles",   Name = "View Roles" },
                new Permission { Id = Guid.NewGuid(), Code = "USERS_VIEW",   Module = "users",   Name = "View Users" },
                new Permission { Id = Guid.NewGuid(), Code = "CONTENT_VIEW", Module = "content", Name = "View Content" },
            ],
            [TeacherRoleId] =
            [
                new Permission { Id = Guid.NewGuid(), Code = "CONTENT_VIEW",    Module = "content",    Name = "View Content" },
                new Permission { Id = Guid.NewGuid(), Code = "CURRICULUM_VIEW", Module = "curriculum", Name = "View Curriculum" },
            ],
        };

    public Task<IReadOnlyList<Role>> GetAllRolesAsync(string? roleType = null, CancellationToken ct = default)
    {
        var roles = AllRoles;

        if (!string.IsNullOrWhiteSpace(roleType) && roleType.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            roles = roles.Where(r => r.Code.EndsWith("_ADMIN")).ToList();
        }

        return Task.FromResult<IReadOnlyList<Role>>(roles);
    }

    public Task<IReadOnlyList<UserTenantRoleAssignment>> GetUserRolesAsync(Guid userId, CancellationToken ct = default)
    {
        if (userId != TestUserId)
            return Task.FromResult<IReadOnlyList<UserTenantRoleAssignment>>([]);

        return Task.FromResult<IReadOnlyList<UserTenantRoleAssignment>>(
        [
            new UserTenantRoleAssignment
            {
                Id       = Guid.NewGuid(),
                UserId   = TestUserId,
                RoleId   = TeacherRoleId,
                RoleCode = "TEACHER",
                RoleName = "Teacher",
                TenantId = TestTenantId,
                IsActive = true,
            }
        ]);
    }

    public Task<bool> RoleExistsAsync(Guid roleId, CancellationToken ct = default)
        => Task.FromResult(AllRoles.Any(r => r.Id == roleId));

    public Task AssignRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default)
        => Task.CompletedTask;

    public Task<bool> RevokeRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default)
        => Task.FromResult(true);

    public Task<IReadOnlyList<string>> GetPermissionCodesByRoleCodesAsync(
        IEnumerable<string> roleCodes,
        CancellationToken ct = default)
    {
        var codeSet = roleCodes.ToHashSet();
        var result = AllRoles
            .Where(r => codeSet.Contains(r.Code))
            .SelectMany(r => PermissionsByRole.TryGetValue(r.Id, out var perms) ? perms : [])
            .Select(p => p.Code)
            .Distinct()
            .ToList();
        return Task.FromResult<IReadOnlyList<string>>(result);
    }

    public Task<IReadOnlyList<Permission>> GetAllPermissionsAsync(CancellationToken ct = default)
    {
        IReadOnlyList<Permission> all = PermissionsByRole.Values.SelectMany(p => p).ToList();
        return Task.FromResult(all);
    }

    public Task<IReadOnlyList<Permission>> GetPermissionsByRoleIdAsync(Guid roleId, CancellationToken ct = default)
    {
        if (PermissionsByRole.TryGetValue(roleId, out var perms))
            return Task.FromResult(perms);
        return Task.FromResult<IReadOnlyList<Permission>>([]);
    }
}
