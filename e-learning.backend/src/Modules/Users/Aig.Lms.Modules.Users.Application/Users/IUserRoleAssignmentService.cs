namespace Aig.Lms.Modules.Users.Application.Users;

public interface IUserRoleAssignmentService
{
    /// <summary>Assign a role to a user by role ID.</summary>
    Task AssignRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default);

    /// <summary>Assign a role to a user by role code (e.g. "SCHOOL"). No-op if role code not found.</summary>
    Task AssignRoleByCodeAsync(Guid userId, string roleCode, Guid tenantId, CancellationToken ct = default);

    /// <summary>
    /// Auto-inherit all active tenants from a school's contracts.
    /// For each active school_tenant_mapping row, assigns the role matching <paramref name="accountTypeCode"/>
    /// (now unified as "SCHOOL") within that tenant, marking the assignment as inherited.
    /// No-op if school has no active contracts or accountTypeCode is null/empty.
    /// </summary>
    Task InheritSchoolTenantsAsync(Guid userId, Guid schoolId, string? accountTypeCode, CancellationToken ct = default);
}
