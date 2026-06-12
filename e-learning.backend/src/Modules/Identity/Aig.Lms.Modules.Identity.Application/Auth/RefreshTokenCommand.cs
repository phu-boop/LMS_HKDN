using Aig.Lms.Modules.Tenancy.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record RefreshTokenCommand(string RefreshToken);

public sealed class RefreshTokenCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ITenantResolutionService _tenantResolutionService;

    public RefreshTokenCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        ITenantResolutionService tenantResolutionService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _tenantResolutionService = tenantResolutionService;
    }

    public async Task<(LoginResult? Result, LoginError? Error)> HandleAsync(RefreshTokenCommand command, CancellationToken ct = default)
    {
        var tokenHash = _tokenService.HashRefreshToken(command.RefreshToken);
        var session = await _userRepository.FindSessionByRefreshTokenHashAsync(tokenHash, ct);

        if (session is null)
            return (null, new LoginError("INVALID_TOKEN", "Refresh token is invalid or expired."));

        var user = await _userRepository.FindByIdAsync(session.UserId, ct);
        if (user is null || user.Status != "ACTIVE")
        {
            await _userRepository.RevokeSessionAsync(session.Id, ct);
            return (null, new LoginError("USER_INACTIVE", "User account is no longer active."));
        }

        var roles = await _userRepository.GetRoleCodesAsync(user.Id, ct);

        // Rotate refresh token (sliding expiry)
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var newRefreshTokenHash = _tokenService.HashRefreshToken(newRefreshToken);
        var newExpiresAt = DateTime.UtcNow.AddDays(_tokenService.RefreshTokenExpiryDays);
        await _userRepository.UpdateSessionLastSeenAsync(session.Id, newRefreshTokenHash, newExpiresAt, ct);

        // Generate new access token using tenant from session
        var tenantId = session.TenantId == Guid.Empty ? (Guid?)null : session.TenantId;
        var tenant = tenantId.HasValue
            ? await _tenantResolutionService.GetByTenantIdAsync(tenantId.Value, ct)
            : null;
        var accessToken = _tokenService.GenerateAccessToken(user, roles, tenantId, tenant?.Subdomain);

        return (new LoginResult(accessToken, newRefreshToken, _tokenService.ExpiresInSeconds, TenantBranding: null), null);
    }
}
