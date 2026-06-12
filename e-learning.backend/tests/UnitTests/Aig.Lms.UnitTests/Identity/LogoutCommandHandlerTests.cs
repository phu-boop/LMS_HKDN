using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class LogoutCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly LogoutCommandHandler _handler;

    public LogoutCommandHandlerTests()
    {
        _handler = new LogoutCommandHandler(_userRepository, _tokenService);
    }

    [Fact]
    public async Task HandleAsync_ValidSession_RevokesAndReturnsTrue()
    {
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            SchoolId = Guid.NewGuid(),
            RefreshTokenHash = "hash",
            Status = "ACTIVE"
        };

        _tokenService.HashRefreshToken("refresh-token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);

        var result = await _handler.HandleAsync(new LogoutCommand("refresh-token"));

        result.Should().BeTrue();
        await _userRepository.Received(1).RevokeSessionAsync(session.Id);
    }

    [Fact]
    public async Task HandleAsync_InvalidToken_ReturnsFalse()
    {
        _tokenService.HashRefreshToken("invalid").Returns("invalid-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("invalid-hash").Returns((UserSession?)null);

        var result = await _handler.HandleAsync(new LogoutCommand("invalid"));

        result.Should().BeFalse();
        await _userRepository.DidNotReceive().RevokeSessionAsync(Arg.Any<Guid>());
    }
}
