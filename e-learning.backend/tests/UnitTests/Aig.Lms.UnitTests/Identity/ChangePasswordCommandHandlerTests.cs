using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class ChangePasswordCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly IAuditLogService _auditLogService = Substitute.For<IAuditLogService>();
    private readonly ChangePasswordCommandHandler _handler;

    public ChangePasswordCommandHandlerTests()
    {
        _handler = new ChangePasswordCommandHandler(_userRepository, _tokenService, _auditLogService);
    }

    private static UserSession ActiveSession(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        TenantId = Guid.NewGuid(),
        Status = "ACTIVE"
    };

    [Fact]
    public async Task HandleAsync_ValidChange_ReturnsSuccess()
    {
        var userId = Guid.NewGuid();
        var currentHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");
        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);
        _userRepository.RevokeOtherSessionsAsync(userId, Arg.Any<Guid?>()).Returns(0);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(userId, "OldPass@123", "NewPass@123"));

        result.Succeeded.Should().BeTrue();
        result.Error.Should().BeNull();
        await _userRepository.Received(1).UpdatePasswordAsync(userId, Arg.Any<string>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("12345")]
    public async Task HandleAsync_ShortPassword_ReturnsFailed(string newPassword)
    {
        var result = await _handler.HandleAsync(new ChangePasswordCommand(Guid.NewGuid(), "any", newPassword));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("at least 6 characters");
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsFailed()
    {
        _userRepository.GetPasswordHashAsync(Arg.Any<Guid>()).Returns((string?)null);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(Guid.NewGuid(), "old", "NewPass@123"));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Be("User not found.");
    }

    [Fact]
    public async Task HandleAsync_WrongCurrentPassword_ReturnsFailed()
    {
        var userId = Guid.NewGuid();
        var currentHash = BCrypt.Net.BCrypt.HashPassword("RealPass@123");
        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(userId, "WrongPass", "NewPass@123"));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Be("Current password is incorrect.");
        await _userRepository.DidNotReceive().UpdatePasswordAsync(Arg.Any<Guid>(), Arg.Any<string>());
    }

    // --- Session revocation tests ---

    [Fact]
    public async Task HandleAsync_WithValidRefreshToken_RevokesOtherSessionsKeepsCurrent()
    {
        var userId = Guid.NewGuid();
        var session = ActiveSession(userId);
        var currentHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");

        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);
        _tokenService.HashRefreshToken("my-token").Returns("my-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("my-hash").Returns(session);
        _userRepository.RevokeOtherSessionsAsync(userId, session.Id).Returns(2);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(
            userId, "OldPass@123", "NewPass@123", "my-token"));

        result.Succeeded.Should().BeTrue();
        result.RevokedSessionCount.Should().Be(2);
        // Current session is excluded from revocation
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, session.Id);
    }

    [Fact]
    public async Task HandleAsync_WithNoRefreshToken_RevokesAllSessions()
    {
        var userId = Guid.NewGuid();
        var currentHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");

        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);
        _userRepository.RevokeOtherSessionsAsync(userId, null).Returns(3);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(
            userId, "OldPass@123", "NewPass@123")); // no refresh token

        result.Succeeded.Should().BeTrue();
        result.RevokedSessionCount.Should().Be(3);
        // No session to keep → revoke ALL
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, null);
    }

    [Fact]
    public async Task HandleAsync_RefreshTokenBelongsToAnotherUser_RevokesAllOwnSessions()
    {
        var userId = Guid.NewGuid();
        var anotherUserId = Guid.NewGuid();
        var foreignSession = ActiveSession(anotherUserId); // belongs to another user
        var currentHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");

        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);
        _tokenService.HashRefreshToken("foreign-token").Returns("foreign-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("foreign-hash").Returns(foreignSession);
        _userRepository.RevokeOtherSessionsAsync(userId, null).Returns(1);

        var result = await _handler.HandleAsync(new ChangePasswordCommand(
            userId, "OldPass@123", "NewPass@123", "foreign-token"));

        result.Succeeded.Should().BeTrue();
        // Cross-user token → no session kept, all own sessions revoked
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, null);
    }

    [Fact]
    public async Task HandleAsync_SessionsNotRevokedWhenPasswordInvalid()
    {
        var userId = Guid.NewGuid();
        var currentHash = BCrypt.Net.BCrypt.HashPassword("RealPass@123");
        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);

        await _handler.HandleAsync(new ChangePasswordCommand(userId, "WrongPass", "NewPass@123"));

        // Should not touch sessions when password validation fails
        await _userRepository.DidNotReceive().RevokeOtherSessionsAsync(Arg.Any<Guid>(), Arg.Any<Guid?>());
    }

    [Fact]
    public async Task HandleAsync_LogsAuditEntryWithPasswordChangedAction()
    {
        var userId = Guid.NewGuid();
        var currentHash = BCrypt.Net.BCrypt.HashPassword("OldPass@123");

        _userRepository.GetPasswordHashAsync(userId).Returns(currentHash);
        _userRepository.RevokeOtherSessionsAsync(userId, Arg.Any<Guid?>()).Returns(0);

        await _handler.HandleAsync(new ChangePasswordCommand(userId, "OldPass@123", "NewPass@123"));

        await _auditLogService.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action == "PASSWORD_CHANGED" &&
                e.ActorUserId == userId));
    }

    [Fact]
    public async Task HandleAsync_NoAuditLogWhenFailed()
    {
        _userRepository.GetPasswordHashAsync(Arg.Any<Guid>()).Returns((string?)null);

        await _handler.HandleAsync(new ChangePasswordCommand(Guid.NewGuid(), "old", "NewPass@123"));

        await _auditLogService.DidNotReceive().LogAsync(Arg.Any<AuditLogEntry>());
    }
}
