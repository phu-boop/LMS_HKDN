namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record ResetPasswordCommand(Guid TargetUserId, string NewPassword);

public sealed class ResetPasswordCommandHandler
{
    private readonly IUserRepository _userRepository;

    public ResetPasswordCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<ResetPasswordResult> HandleAsync(ResetPasswordCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 6)
            return ResetPasswordResult.Failed("New password must be at least 6 characters.");

        var user = await _userRepository.FindByIdAsync(command.TargetUserId, ct);
        if (user is null)
            return ResetPasswordResult.Failed("User not found.");

        var newHash = BCrypt.Net.BCrypt.HashPassword(command.NewPassword);
        await _userRepository.UpdatePasswordAsync(command.TargetUserId, newHash, ct);

        // Reset failed login counter and unlock
        await _userRepository.ResetFailedLoginAsync(command.TargetUserId, ct);

        // Revoke all active sessions (force re-login with new password)
        await _userRepository.RevokeAllUserSessionsAsync(command.TargetUserId, ct);

        return ResetPasswordResult.Success();
    }
}

public sealed record ResetPasswordResult(bool Succeeded, string? Error = null)
{
    public static ResetPasswordResult Success() => new(true);
    public static ResetPasswordResult Failed(string error) => new(false, error);
}
