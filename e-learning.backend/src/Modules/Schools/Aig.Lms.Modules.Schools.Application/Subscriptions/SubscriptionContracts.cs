namespace Aig.Lms.Modules.Schools.Application;

// ── Read DTO (joined with tenant for list view) ───────────────────────────────

public sealed class SubscriptionDto
{
    public Guid Id { get; init; }
    public Guid SchoolId { get; init; }
    public Guid TenantId { get; init; }
    public string TenantCode { get; init; } = string.Empty;
    public string TenantName { get; init; } = string.Empty;
    public DateOnly ContractStart { get; init; }
    public DateOnly ContractEnd { get; init; }
    public int MaxConcurrentSessions { get; init; }
    public string LoginPolicy { get; init; } = string.Empty;
    public bool EnforceExpiry { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}

// ── Create ────────────────────────────────────────────────────────────────────

public sealed record CreateSubscriptionCommand(
    Guid SchoolId,
    Guid TenantId,
    DateOnly ContractStart,
    DateOnly ContractEnd,
    int MaxConcurrentSessions = 1,
    string LoginPolicy = "BLOCK_NEW",
    bool EnforceExpiry = true);

public sealed record CreateSubscriptionResult(
    Guid Id,
    Guid SchoolId,
    Guid TenantId,
    DateOnly ContractStart,
    DateOnly ContractEnd,
    int MaxConcurrentSessions,
    string LoginPolicy,
    bool EnforceExpiry);

// ── Bulk Create ──────────────────────────────────────────────────────────────

/// <summary>
/// Creates one <c>school_tenant_mapping</c> row per TenantId using the same contract config.
/// Duplicate tenant assignments are skipped and reported in <see cref="CreateSubscriptionsBulkResult.SkippedDuplicates"/>.
/// </summary>
public sealed record CreateSubscriptionsBulkCommand(
    Guid SchoolId,
    IReadOnlyList<Guid> TenantIds,
    DateOnly ContractStart,
    DateOnly ContractEnd,
    int MaxConcurrentSessions = 1,
    string LoginPolicy = "BLOCK_NEW",
    bool EnforceExpiry = true);

public sealed record CreateSubscriptionsBulkResult(
    IReadOnlyList<CreateSubscriptionResult> Created,
    IReadOnlyList<Guid> SkippedDuplicates);

// ── Update ────────────────────────────────────────────────────────────────────

public sealed record UpdateSubscriptionCommand(
    Guid Id,
    Guid SchoolId,
    DateOnly ContractStart,
    DateOnly ContractEnd,
    int MaxConcurrentSessions,
    string LoginPolicy,
    bool EnforceExpiry);

public sealed record UpdateSubscriptionResult(
    Guid Id,
    Guid SchoolId,
    Guid TenantId,
    DateOnly ContractStart,
    DateOnly ContractEnd,
    int MaxConcurrentSessions,
    string LoginPolicy,
    bool EnforceExpiry);
