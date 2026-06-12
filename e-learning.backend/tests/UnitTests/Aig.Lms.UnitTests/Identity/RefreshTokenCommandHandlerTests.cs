using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class RefreshTokenCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly ITenantResolutionService _tenantResolutionService = Substitute.For<ITenantResolutionService>();
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _tokenService.ExpiresInSeconds.Returns(3600);
        _tokenService.RefreshTokenExpiryDays.Returns(1);
        _handler = new RefreshTokenCommandHandler(_userRepository, _tokenService, _tenantResolutionService);
    }

    [Fact]
    public async Task HandleAsync_ValidRefreshToken_RotatesAndReturnsNewTokens()
    {
        var userId = Guid.NewGuid();
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = Guid.NewGuid(),
            SchoolId = Guid.NewGuid(),
            RefreshTokenHash = "old-hash",
            Status = "ACTIVE"
        };
        var user = new UserAccount
        {
            Id = userId,
            SchoolId = session.SchoolId,
            Username = "testuser",
            PasswordHash = "hash",
            FullName = "Test",
            Status = "ACTIVE"
        };

        _tokenService.HashRefreshToken("old-refresh").Returns("old-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("old-hash").Returns(session);
        _userRepository.FindByIdAsync(userId).Returns(user);
        _userRepository.GetRoleCodesAsync(userId).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateRefreshToken().Returns("new-refresh");
        _tokenService.HashRefreshToken("new-refresh").Returns("new-hash");
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), session.TenantId).Returns("new-access");

        var (result, error) = await _handler.HandleAsync(new RefreshTokenCommand("old-refresh"));

        result.Should().NotBeNull();
        result!.AccessToken.Should().Be("new-access");
        result.RefreshToken.Should().Be("new-refresh");
        error.Should().BeNull();
        await _userRepository.Received(1).UpdateSessionLastSeenAsync(session.Id, "new-hash", Arg.Any<DateTime>());
    }

    [Fact]
    public async Task HandleAsync_InvalidRefreshToken_ReturnsError()
    {
        _tokenService.HashRefreshToken("bad-token").Returns("bad-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("bad-hash").Returns((UserSession?)null);

        var (result, error) = await _handler.HandleAsync(new RefreshTokenCommand("bad-token"));

        result.Should().BeNull();
        error!.Code.Should().Be("INVALID_TOKEN");
    }

    [Fact]
    public async Task HandleAsync_InactiveUser_RevokesSessionAndReturnsError()
    {
        var userId = Guid.NewGuid();
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = Guid.Empty,
            SchoolId = Guid.NewGuid(),
            RefreshTokenHash = "hash",
            Status = "ACTIVE"
        };
        var user = new UserAccount
        {
            Id = userId,
            SchoolId = session.SchoolId,
            Username = "testuser",
            PasswordHash = "hash",
            FullName = "Test",
            Status = "DISABLED"
        };

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.FindByIdAsync(userId).Returns(user);

        var (result, error) = await _handler.HandleAsync(new RefreshTokenCommand("token"));

        result.Should().BeNull();
        error!.Code.Should().Be("USER_INACTIVE");
        await _userRepository.Received(1).RevokeSessionAsync(session.Id);
    }

    [Fact]
    public async Task HandleAsync_EmptyTenantId_PassesNullToTokenService()
    {
        var userId = Guid.NewGuid();
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TenantId = Guid.Empty,
            SchoolId = Guid.NewGuid(),
            RefreshTokenHash = "hash",
            Status = "ACTIVE"
        };
        var user = new UserAccount { Id = userId, SchoolId = session.SchoolId, Username = "testuser", PasswordHash = "h", FullName = "Test", Status = "ACTIVE" };

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.FindByIdAsync(userId).Returns(user);
        _userRepository.GetRoleCodesAsync(userId).Returns(new List<string>());
        _tokenService.GenerateRefreshToken().Returns("new");
        _tokenService.HashRefreshToken("new").Returns("new-hash");
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), null).Returns("access");

        await _handler.HandleAsync(new RefreshTokenCommand("token"));

        _tokenService.Received(1).GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), null);
    }
}
