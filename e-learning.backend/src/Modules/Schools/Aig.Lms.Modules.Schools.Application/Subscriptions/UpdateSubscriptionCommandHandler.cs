namespace Aig.Lms.Modules.Schools.Application;

public sealed class UpdateSubscriptionCommandHandler
{
    private static readonly HashSet<string> ValidPolicies =
        new(StringComparer.OrdinalIgnoreCase) { "BLOCK_NEW", "KICK_OLDEST" };

    private readonly ISchoolRepository _repository;

    public UpdateSubscriptionCommandHandler(ISchoolRepository repository) => _repository = repository;

    public async Task<UpdateSubscriptionResult?> HandleAsync(
        UpdateSubscriptionCommand command, CancellationToken ct = default)
    {
        if (command.ContractEnd < command.ContractStart)
            throw new InvalidOperationException("Contract end date must not be before start date.");
        if (command.MaxConcurrentSessions < 1)
            throw new InvalidOperationException("Max concurrent sessions must be at least 1.");
        if (!ValidPolicies.Contains(command.LoginPolicy))
            throw new InvalidOperationException("Login policy must be 'BLOCK_NEW' or 'KICK_OLDEST'.");

        return await _repository.UpdateSubscriptionAsync(command, ct);
    }
}
