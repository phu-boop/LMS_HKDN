namespace Aig.Lms.Modules.Users.Domain;

public sealed class User
{
    public Guid Id { get; init; }
    /// <summary>Nullable for LMS_ADMIN and TENANT_ADMIN accounts that are not tied to a specific school.</summary>
    public Guid? SchoolId { get; init; }
    public Guid? TenantId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? AvatarUrl { get; init; }
    public string Status { get; init; } = string.Empty;
    /// <summary>One of: LMS_ADMIN, TENANT_ADMIN, SCHOOL</summary>
    public string? AccountType { get; init; }
}
