using Aig.Lms.Modules.Schools.Domain;

namespace Aig.Lms.Modules.Schools.Application;

// ── Single-tenant (used by update flow internally + kept for backward compat) ──

public sealed class CreateSubscriptionCommandHandler
{
    private static readonly HashSet<string> ValidPolicies =
        new(StringComparer.OrdinalIgnoreCase) { "BLOCK_NEW", "KICK_OLDEST" };

    private readonly ISchoolRepository _repository;

    public CreateSubscriptionCommandHandler(ISchoolRepository repository) => _repository = repository;

    public async Task<CreateSubscriptionResult> HandleAsync(
        CreateSubscriptionCommand command, CancellationToken ct = default)
    {
        if (command.SchoolId == Guid.Empty)
            throw new InvalidOperationException("School ID is required.");
        if (command.TenantId == Guid.Empty)
            throw new InvalidOperationException("Tenant ID is required.");
        if (command.ContractEnd < command.ContractStart)
            throw new InvalidOperationException("Contract end date must not be before start date.");
        if (command.MaxConcurrentSessions < 1)
            throw new InvalidOperationException("Max concurrent sessions must be at least 1.");
        if (!ValidPolicies.Contains(command.LoginPolicy))
            throw new InvalidOperationException("Login policy must be 'BLOCK_NEW' or 'KICK_OLDEST'.");

        var schoolExists = await _repository.SchoolExistsAsync(command.SchoolId, ct);
        if (!schoolExists)
            throw new InvalidOperationException($"School '{command.SchoolId}' not found.");

        var duplicate = await _repository.SubscriptionExistsAsync(command.SchoolId, command.TenantId, null, ct);
        if (duplicate)
            throw new InvalidOperationException(
                $"School already has an active subscription for tenant '{command.TenantId}'.");

        var subscription = new SchoolSubscription
        {
            Id = Guid.NewGuid(),
            SchoolId = command.SchoolId,
            TenantId = command.TenantId,
            ContractStart = command.ContractStart,
            ContractEnd = command.ContractEnd,
            MaxConcurrentSessions = command.MaxConcurrentSessions,
            LoginPolicy = command.LoginPolicy.ToUpperInvariant(),
            EnforceExpiry = command.EnforceExpiry,
            Status = "ACTIVE"
        };

        await _repository.CreateSubscriptionAsync(subscription, ct);

        return new CreateSubscriptionResult(
            subscription.Id, subscription.SchoolId, subscription.TenantId,
            subscription.ContractStart, subscription.ContractEnd,
            subscription.MaxConcurrentSessions, subscription.LoginPolicy, subscription.EnforceExpiry);
    }
}

// ── Multi-tenant bulk create (POST from mockup form) ─────────────────────────

public sealed class CreateSubscriptionsBulkCommandHandler
{
    private static readonly HashSet<string> ValidPolicies =
        new(StringComparer.OrdinalIgnoreCase) { "BLOCK_NEW", "KICK_OLDEST" };

    private readonly ISchoolRepository _repository;

    public CreateSubscriptionsBulkCommandHandler(ISchoolRepository repository) => _repository = repository;

    public async Task<CreateSubscriptionsBulkResult> HandleAsync(
        CreateSubscriptionsBulkCommand command, CancellationToken ct = default)
    {
        if (command.SchoolId == Guid.Empty)
            throw new InvalidOperationException("School ID is required.");
        if (command.TenantIds is null || command.TenantIds.Count == 0)
            throw new InvalidOperationException("At least one Tenant ID is required.");
        if (command.ContractEnd < command.ContractStart)
            throw new InvalidOperationException("Contract end date must not be before start date.");
        if (command.MaxConcurrentSessions < 1)
            throw new InvalidOperationException("Max concurrent sessions must be at least 1.");
        if (!ValidPolicies.Contains(command.LoginPolicy))
            throw new InvalidOperationException("Login policy must be 'BLOCK_NEW' or 'KICK_OLDEST'.");

        var schoolExists = await _repository.SchoolExistsAsync(command.SchoolId, ct);
        if (!schoolExists)
            throw new InvalidOperationException($"School '{command.SchoolId}' not found.");

        var created  = new List<CreateSubscriptionResult>();
        var skipped  = new List<Guid>();
        var policy   = command.LoginPolicy.ToUpperInvariant();

        foreach (var tenantId in command.TenantIds.Distinct())
        {
            if (tenantId == Guid.Empty) continue;

            var isDuplicate = await _repository.SubscriptionExistsAsync(command.SchoolId, tenantId, null, ct);
            if (isDuplicate) { skipped.Add(tenantId); continue; }

            var subscription = new SchoolSubscription
            {
                Id                    = Guid.NewGuid(),
                SchoolId              = command.SchoolId,
                TenantId              = tenantId,
                ContractStart         = command.ContractStart,
                ContractEnd           = command.ContractEnd,
                MaxConcurrentSessions = command.MaxConcurrentSessions,
                LoginPolicy           = policy,
                EnforceExpiry         = command.EnforceExpiry,
                Status                = "ACTIVE"
            };

            await _repository.CreateSubscriptionAsync(subscription, ct);

            created.Add(new CreateSubscriptionResult(
                subscription.Id, subscription.SchoolId, subscription.TenantId,
                subscription.ContractStart, subscription.ContractEnd,
                subscription.MaxConcurrentSessions, subscription.LoginPolicy, subscription.EnforceExpiry));
        }

        return new CreateSubscriptionsBulkResult(created, skipped);
    }
}
