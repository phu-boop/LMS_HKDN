using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class RevokeAllOtherSessionsCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly IAuditLogService _auditLogService = Substitute.For<IAuditLogService>();
    private readonly RevokeAllOtherSessionsCommandHandler _handler;

    public RevokeAllOtherSessionsCommandHandlerTests()
    {
        _handler = new RevokeAllOtherSessionsCommandHandler(_userRepository, _tokenService, _auditLogService);
    }

    private static UserSession ActiveSession(Guid userId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        TenantId = Guid.NewGuid(),
        Status = "ACTIVE"
    };

    [Fact]
    public async Task HandleAsync_ValidToken_RevokesOtherSessionsKeepsCurrent()
    {
        var userId = Guid.NewGuid();
        var session = ActiveSession(userId);

        _tokenService.HashRefreshToken("my-token").Returns("my-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("my-hash").Returns(session);
        _userRepository.RevokeOtherSessionsAsync(userId, session.Id).Returns(3);

        var result = await _handler.HandleAsync(new RevokeAllOtherSessionsCommand(userId, "my-token"));

        result.Succeeded.Should().BeTrue();
        result.RevokedCount.Should().Be(3);
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, session.Id);
    }

    [Fact]
    public async Task HandleAsync_InvalidRefreshToken_RevokesAllSessions()
    {
        var userId = Guid.NewGuid();

        _tokenService.HashRefreshToken("bad-token").Returns("bad-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("bad-hash").Returns((UserSession?)null);
        _userRepository.RevokeOtherSessionsAsync(userId, null).Returns(2);

        var result = await _handler.HandleAsync(new RevokeAllOtherSessionsCommand(userId, "bad-token"));

        result.Succeeded.Should().BeTrue();
        // When token invalid, exceptSessionId = null → revoke ALL
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, null);
    }

    [Fact]
    public async Task HandleAsync_TokenBelongsToDifferentUser_RevokesAllWithNoExcept()
    {
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var session = ActiveSession(differentUserId); // belongs to another user

        _tokenService.HashRefreshToken("cross-token").Returns("cross-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("cross-hash").Returns(session);
        _userRepository.RevokeOtherSessionsAsync(userId, null).Returns(1);

        var result = await _handler.HandleAsync(new RevokeAllOtherSessionsCommand(userId, "cross-token"));

        result.Succeeded.Should().BeTrue();
        // Cross-user token → no kept session
        await _userRepository.Received(1).RevokeOtherSessionsAsync(userId, null);
    }

    [Fact]
    public async Task HandleAsync_LogsAuditEntry()
    {
        var userId = Guid.NewGuid();
        var session = ActiveSession(userId);

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.RevokeOtherSessionsAsync(Arg.Any<Guid>(), Arg.Any<Guid?>()).Returns(1);

        await _handler.HandleAsync(new RevokeAllOtherSessionsCommand(userId, "token"));

        await _auditLogService.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e => e.Action == "SESSION_REVOKED_ALL" && e.ActorUserId == userId));
    }

    [Fact]
    public async Task HandleAsync_ZeroOtherSessions_StillSucceeds()
    {
        var userId = Guid.NewGuid();
        var session = ActiveSession(userId);

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.RevokeOtherSessionsAsync(userId, session.Id).Returns(0);

        var result = await _handler.HandleAsync(new RevokeAllOtherSessionsCommand(userId, "token"));

        result.Succeeded.Should().BeTrue();
        result.RevokedCount.Should().Be(0);
    }
}

public class AdminRevokeAllUserSessionsCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IAuditLogService _auditLogService = Substitute.For<IAuditLogService>();
    private readonly AdminRevokeAllUserSessionsCommandHandler _handler;

    public AdminRevokeAllUserSessionsCommandHandlerTests()
    {
        _handler = new AdminRevokeAllUserSessionsCommandHandler(_userRepository, _auditLogService);
    }

    private static UserAccount ActiveUser() => new()
    {
        Id = Guid.NewGuid(),
        Username = "teacher01",
        Email = "teacher01@demo.edu.vn",
        PasswordHash = "hash",
        FullName = "Teacher 01",
        Status = "ACTIVE"
    };

    [Fact]
    public async Task HandleAsync_ExistingUser_RevokesAllSessions()
    {
        var adminId = Guid.NewGuid();
        var user = ActiveUser();

        _userRepository.FindByIdAsync(user.Id).Returns(user);

        var result = await _handler.HandleAsync(new AdminRevokeAllUserSessionsCommand(user.Id, adminId));

        result.Succeeded.Should().BeTrue();
        result.Error.Should().BeNull();
        await _userRepository.Received(1).RevokeAllUserSessionsAsync(user.Id);
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsError()
    {
        var adminId = Guid.NewGuid();
        var unknownUserId = Guid.NewGuid();

        _userRepository.FindByIdAsync(unknownUserId).Returns((UserAccount?)null);

        var result = await _handler.HandleAsync(new AdminRevokeAllUserSessionsCommand(unknownUserId, adminId));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().NotBeNullOrEmpty();
        await _userRepository.DidNotReceive().RevokeAllUserSessionsAsync(Arg.Any<Guid>());
    }

    [Fact]
    public async Task HandleAsync_LogsAuditWithAdminContext()
    {
        var adminId = Guid.NewGuid();
        var user = ActiveUser();

        _userRepository.FindByIdAsync(user.Id).Returns(user);

        await _handler.HandleAsync(new AdminRevokeAllUserSessionsCommand(user.Id, adminId));

        await _auditLogService.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action == "SESSION_REVOKED_ALL" &&
                e.EntityId == user.Id &&
                e.ActorUserId == adminId));
    }

    [Fact]
    public async Task HandleAsync_RevokeIsCalledWithCorrectUserId()
    {
        var adminId = Guid.NewGuid();
        var user = ActiveUser();

        _userRepository.FindByIdAsync(user.Id).Returns(user);

        await _handler.HandleAsync(new AdminRevokeAllUserSessionsCommand(user.Id, adminId));

        // Must revoke target user's sessions, NOT admin's sessions
        await _userRepository.Received(1).RevokeAllUserSessionsAsync(user.Id);
        await _userRepository.DidNotReceive().RevokeAllUserSessionsAsync(adminId);
    }
}
