namespace Aig.Lms.Modules.Schools.Domain;

public sealed class SchoolSubscription
{
    public Guid Id { get; init; }
    public Guid TenantId { get; init; }
    public Guid SchoolId { get; init; }
    public DateOnly ContractStart { get; init; }
    public DateOnly ContractEnd { get; init; }
    public int MaxConcurrentSessions { get; init; }
    public string LoginPolicy { get; init; } = string.Empty;
    public bool EnforceExpiry { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
