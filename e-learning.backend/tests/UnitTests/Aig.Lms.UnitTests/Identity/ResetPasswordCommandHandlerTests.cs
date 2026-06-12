using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class ResetPasswordCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ResetPasswordCommandHandler _handler;

    public ResetPasswordCommandHandlerTests()
    {
        _handler = new ResetPasswordCommandHandler(_userRepository);
    }

    [Fact]
    public async Task HandleAsync_ValidReset_UpdatesPasswordAndRevokesAllSessions()
    {
        var userId = Guid.NewGuid();
        var user = new UserAccount
        {
            Id = userId, SchoolId = Guid.NewGuid(), Username = "testuser",
            PasswordHash = "hash", FullName = "Test", Status = "ACTIVE"
        };
        _userRepository.FindByIdAsync(userId).Returns(user);

        var result = await _handler.HandleAsync(new ResetPasswordCommand(userId, "NewPass@123"));

        result.Succeeded.Should().BeTrue();
        await _userRepository.Received(1).UpdatePasswordAsync(userId, Arg.Any<string>());
        await _userRepository.Received(1).ResetFailedLoginAsync(userId);
        await _userRepository.Received(1).RevokeAllUserSessionsAsync(userId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")]
    public async Task HandleAsync_ShortPassword_ReturnsFailed(string newPassword)
    {
        var result = await _handler.HandleAsync(new ResetPasswordCommand(Guid.NewGuid(), newPassword));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("at least 6 characters");
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsFailed()
    {
        _userRepository.FindByIdAsync(Arg.Any<Guid>()).Returns((UserAccount?)null);

        var result = await _handler.HandleAsync(new ResetPasswordCommand(Guid.NewGuid(), "NewPass@123"));

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Be("User not found.");
    }
}
