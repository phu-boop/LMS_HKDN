using Aig.Lms.Modules.Authorization.Application.Permissions;

namespace Aig.Lms.IntegrationTests.Authorization;

/// <summary>
/// In-memory implementation of IPermissionService for integration tests.
/// Returns predefined permission sets per role code.
/// </summary>
internal sealed class InMemoryPermissionService : IPermissionService
{
    private static readonly IReadOnlySet<string> TeacherPermissions =
        new HashSet<string> { "CONTENT_VIEW", "CURRICULUM_VIEW" };

    private static readonly IReadOnlySet<string> TenantAdminPermissions =
        new HashSet<string>
        {
            "ROLES_VIEW", "ROLES_ASSIGN", "ROLES_REVOKE",
            "USERS_VIEW", "USERS_CREATE", "USERS_UPDATE", "USERS_CHANGE_STATUS",
            "SCHOOLS_VIEW",
            "CURRICULUM_VIEW", "CURRICULUM_MANAGE",
            "CONTENT_VIEW", "CONTENT_CREATE", "CONTENT_UPDATE", "CONTENT_DELETE", "CONTENT_PUBLISH",
            "CONTENT_PERMISSION_GRANT", "CONTENT_PERMISSION_REVOKE",
            "AUDIT_LOGS_VIEW", "REPORTS_VIEW",
        };

    public Task<IReadOnlySet<string>> GetPermissionsForRolesAsync(
        IEnumerable<string> roleCodes,
        CancellationToken ct = default)
    {
        var result = new HashSet<string>();
        foreach (var code in roleCodes)
        {
            if (code == "TENANT_ADMIN") result.UnionWith(TenantAdminPermissions);
            else if (code == "TEACHER") result.UnionWith(TeacherPermissions);
            // LMS_ADMIN bypasses the handler entirely — this method is not called for them
        }
        return Task.FromResult<IReadOnlySet<string>>(result);
    }
}
