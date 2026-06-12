using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record ChangePasswordCommand(
    Guid UserId,
    string CurrentPassword,
    string NewPassword,
    string? CurrentRefreshToken = null,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed class ChangePasswordCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;

    public ChangePasswordCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
    }

    public async Task<ChangePasswordResult> HandleAsync(ChangePasswordCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 6)
            return ChangePasswordResult.Failed("New password must be at least 6 characters.");

        var currentHash = await _userRepository.GetPasswordHashAsync(command.UserId, ct);
        if (currentHash is null)
            return ChangePasswordResult.Failed("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(command.CurrentPassword, currentHash))
            return ChangePasswordResult.Failed("Current password is incorrect.");

        var newHash = BCrypt.Net.BCrypt.HashPassword(command.NewPassword);
        await _userRepository.UpdatePasswordAsync(command.UserId, newHash, ct);

        // Revoke all other sessions — keep current session if a valid refresh token is provided
        Guid? keepSessionId = null;
        if (!string.IsNullOrWhiteSpace(command.CurrentRefreshToken))
        {
            var tokenHash = _tokenService.HashRefreshToken(command.CurrentRefreshToken);
            var currentSession = await _userRepository.FindSessionByRefreshTokenHashAsync(tokenHash, ct);
            if (currentSession is not null && currentSession.UserId == command.UserId)
                keepSessionId = currentSession.Id;
        }

        var revokedCount = await _userRepository.RevokeOtherSessionsAsync(command.UserId, keepSessionId, ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "PASSWORD_CHANGED",
            EntityType: "UserAccount",
            EntityId: command.UserId,
            ActorUserId: command.UserId,
            IpAddress: command.IpAddress,
            UserAgent: command.UserAgent,
            Metadata: $"{{\"revokedSessions\":{revokedCount}}}"));

        return ChangePasswordResult.Success(revokedCount);
    }
}

public sealed record ChangePasswordResult(bool Succeeded, int RevokedSessionCount = 0, string? Error = null)
{
    public static ChangePasswordResult Success(int revokedCount = 0) => new(true, revokedCount);
    public static ChangePasswordResult Failed(string error) => new(false, 0, error);
}
