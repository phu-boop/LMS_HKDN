namespace Aig.Lms.Modules.ContentManagement.Application.Permissions;

public sealed record ContentPermissionDto(
    Guid Id,
    Guid TenantId,
    Guid CurriculumNodeId,
    Guid? SchoolId,
    Guid? UserId,
    bool CanView,
    bool CanDownload,
    bool CanComment,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ListContentPermissionsQuery(
    Guid TenantId,
    Guid? CurriculumNodeId,
    Guid? SchoolId,
    Guid? UserId);

public sealed record GrantContentPermissionCommand(
    Guid TenantId,
    Guid CurriculumNodeId,
    Guid? SchoolId,
    Guid? UserId,
    bool CanView,
    bool CanDownload,
    bool CanComment,
    Guid? CreatedBy);

public sealed record GrantContentPermissionResult(
    Guid PermissionId,
    Guid CurriculumNodeId,
    Guid? SchoolId,
    Guid? UserId,
    bool CanView,
    bool CanDownload,
    bool CanComment,
    DateTime UpdatedAt);

public sealed record DeleteContentPermissionCommand(
    Guid TenantId,
    Guid PermissionId,
    Guid? UpdatedBy);

public sealed record NodePermissionViewQuery(
    Guid TenantId,
    Guid NodeId);

public sealed record NodePermissionViewDto(
    Guid Id,
    Guid SourceNodeId,
    bool IsInherited,
    Guid? SchoolId,
    bool CanView,
    bool CanDownload,
    bool CanComment,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record NodePermissionDetailDto(
    Guid Id,
    Guid SourceNodeId,
    bool IsInherited,
    Guid? SchoolId,
    bool CanView,
    bool CanDownload,
    bool CanComment,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record NodePermissionsViewQuery(
    Guid TenantId,
    Guid[] NodeIds);

public sealed record NodePermissionsViewDto(
    Guid NodeId,
    IReadOnlyList<NodePermissionDetailDto> Permissions);

public sealed record UserEffectivePermissionsQuery(
    Guid TenantId,
    Guid UserId);

public sealed record UserEffectiveNodePermissionDto(
    Guid CurriculumNodeId,
    bool CanView,
    bool CanDownload,
    bool CanComment);
