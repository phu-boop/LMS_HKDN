namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record LogoutCommand(string RefreshToken);

public sealed class LogoutCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public LogoutCommandHandler(IUserRepository userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<bool> HandleAsync(LogoutCommand command, CancellationToken ct = default)
    {
        var tokenHash = _tokenService.HashRefreshToken(command.RefreshToken);
        var session = await _userRepository.FindSessionByRefreshTokenHashAsync(tokenHash, ct);

        if (session is null)
            return false;

        await _userRepository.RevokeSessionAsync(session.Id, ct);
        return true;
    }
}
