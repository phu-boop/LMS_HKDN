namespace Aig.Lms.Modules.AuditLogs.Domain;

public sealed class AuditLog
{
    public long Id { get; init; }
    public DateTime OccurredAt { get; init; }
    public Guid? TenantId { get; init; }
    public Guid? SchoolId { get; init; }
    public Guid? UserId { get; init; }
    public string Action { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public Guid? EntityId { get; init; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public string? Metadata { get; init; }
}
