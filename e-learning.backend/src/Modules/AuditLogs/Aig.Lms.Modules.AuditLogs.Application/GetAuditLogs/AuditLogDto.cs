namespace Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;

/// <summary>
/// DTO representing an audit log entry for list responses.
/// </summary>
public sealed record AuditLogDto(
    long Id,
    DateTime OccurredAt,
    Guid? TenantId,
    Guid? SchoolId,
    Guid? UserId,
    string Action,
    string? EntityType,
    Guid? EntityId,
    string? Metadata);
