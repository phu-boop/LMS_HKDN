namespace Aig.Lms.BuildingBlocks.Application.Abstractions;

public interface IAuditLogService
{
    Task LogAsync(AuditLogEntry entry, CancellationToken ct = default);
}

public sealed record AuditLogEntry(
    string Action,
    string EntityType,
    Guid? EntityId = null,
    Guid? TenantId = null,
    Guid? SchoolId = null,
    Guid? ActorUserId = null,
    string? IpAddress = null,
    string? UserAgent = null,
    string? Metadata = null);
