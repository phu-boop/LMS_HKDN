namespace Aig.Lms.Modules.Authorization.Domain;

public sealed class UserTenantRoleAssignment
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public Guid RoleId { get; init; }
    public string RoleCode { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;
    public Guid TenantId { get; init; }
    public Guid? AssignedBy { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
