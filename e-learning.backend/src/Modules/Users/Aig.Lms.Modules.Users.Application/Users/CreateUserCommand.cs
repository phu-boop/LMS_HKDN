namespace Aig.Lms.Modules.Users.Application.Users;

public sealed record CreateUserCommand(
    Guid? SchoolId,
    string Username,
    string Password,
    string FullName,
    string AccountType,  // Required: One of: LMS_ADMIN, TENANT_ADMIN, SCHOOL
    string? Email = null,
    string? AvatarUrl = null,
    /// <summary>Optional role ID to assign immediately after creation.</summary>
    Guid? RoleId = null,
    /// <summary>Optional tenant context used to inherit tenants from school's active contracts.</summary>
    Guid? TenantId = null,
    Guid? ActorUserId = null,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed record CreateUserResult(
    Guid UserId,
    string Username,
    string FullName,
    string? Email,
    string? AvatarUrl,
    string? AccountType = null);
