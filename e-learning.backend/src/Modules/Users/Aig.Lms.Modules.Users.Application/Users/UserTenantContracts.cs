namespace Aig.Lms.Modules.Users.Application.Users;

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

public sealed record UserTenantDto(
    Guid   TenantId,
    string TenantCode,
    string TenantName,
    Guid   RoleId,
    string RoleCode,
    bool   IsInherited);

// ---------------------------------------------------------------------------
// Query — list tenant assignments for a user
// ---------------------------------------------------------------------------

public sealed record GetUserTenantsQuery(Guid UserId);

// ---------------------------------------------------------------------------
// Command — manually assign a tenant+role to a user
// ---------------------------------------------------------------------------

public sealed record AssignUserTenantCommand(
    Guid    UserId,
    Guid    TenantId,
    string  RoleCode,
    Guid?   ActorUserId = null,
    string? IpAddress   = null,
    string? UserAgent   = null);

// ---------------------------------------------------------------------------
// DTO — member of a tenant (user + role info in one row)
// ---------------------------------------------------------------------------

public sealed record TenantMemberDto(
    Guid     UserId,
    string   Username,
    string   FullName,
    string?  AvatarUrl,
    string?  Email,
    Guid     RoleId,
    string   RoleCode,
    string   RoleName,
    bool     IsInherited,
    DateTime AssignedAt);

// ---------------------------------------------------------------------------
// Query — list members (users + roles) of a tenant
// ---------------------------------------------------------------------------

public sealed record GetTenantMembersQuery(
    Guid    TenantId,
    string? Search   = null,
    int     Page     = 1,
    int     PageSize = 20);

// ---------------------------------------------------------------------------
// Command — revoke a tenant assignment from a user
// ---------------------------------------------------------------------------

public sealed record RemoveUserTenantCommand(
    Guid    UserId,
    Guid    TenantId,
    Guid?   ActorUserId = null,
    string? IpAddress   = null,
    string? UserAgent   = null);
