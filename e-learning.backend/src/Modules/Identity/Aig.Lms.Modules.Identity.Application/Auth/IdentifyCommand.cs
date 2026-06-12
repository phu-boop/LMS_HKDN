namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record IdentifyCommand(string Identifier);

public sealed record IdentifyResult(string NextStep);

public sealed record IdentifyError(string Code, string Message);

public sealed class IdentifyCommandHandler
{
    private readonly IUserRepository _userRepository;

    public IdentifyCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<(IdentifyResult? Result, IdentifyError? Error)> HandleAsync(IdentifyCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Identifier))
            return (null, new IdentifyError("VALIDATION_ERROR", "Identifier is required."));

        // Always return PASSWORD regardless of whether user exists (prevents user enumeration).
        await _userRepository.FindByIdentifierAsync(command.Identifier, ct);
        return (new IdentifyResult("PASSWORD"), null);
    }
}