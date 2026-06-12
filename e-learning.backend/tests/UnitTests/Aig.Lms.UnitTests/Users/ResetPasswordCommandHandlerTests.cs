using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Application.Users;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

public class ResetPasswordCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IAuditLogService _auditLog = Substitute.For<IAuditLogService>();
    private readonly ResetPasswordCommandHandler _handler;

    public ResetPasswordCommandHandlerTests()
    {
        _handler = new ResetPasswordCommandHandler(_repository, _auditLog);
    }

    [Fact]
    public async Task HandleAsync_UserExists_UpdatesPasswordAndReturnsTrue()
    {
        var userId = Guid.NewGuid();
        _repository.ResetPasswordAsync(userId, Arg.Any<string>()).Returns(true);

        var result = await _handler.HandleAsync(new ResetPasswordCommand(userId, "NewP@ss123"));

        result.Should().BeTrue();
        await _repository.Received(1).ResetPasswordAsync(userId,
            Arg.Is<string>(hash => BCrypt.Net.BCrypt.Verify("NewP@ss123", hash)));
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsFalse()
    {
        _repository.ResetPasswordAsync(Arg.Any<Guid>(), Arg.Any<string>()).Returns(false);

        var result = await _handler.HandleAsync(new ResetPasswordCommand(Guid.NewGuid(), "NewP@ss123"));

        result.Should().BeFalse();
        await _auditLog.DidNotReceive().LogAsync(Arg.Any<AuditLogEntry>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_EmptyPassword_ThrowsArgumentException(string password)
    {
        var act = () => _handler.HandleAsync(new ResetPasswordCommand(Guid.NewGuid(), password));

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*password*");
    }

    [Fact]
    public async Task HandleAsync_Success_WritesAuditLog()
    {
        var userId = Guid.NewGuid();
        _repository.ResetPasswordAsync(userId, Arg.Any<string>()).Returns(true);

        await _handler.HandleAsync(new ResetPasswordCommand(userId, "P@ss1234",
            ActorUserId: Guid.NewGuid(), IpAddress: "127.0.0.1"));

        await _auditLog.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action == "USER_PASSWORD_RESET" &&
                e.EntityType == "user_account" &&
                e.EntityId == userId));
    }

    [Fact]
    public async Task HandleAsync_PasswordIsHashed_NotStoredPlaintext()
    {
        var userId = Guid.NewGuid();
        _repository.ResetPasswordAsync(userId, Arg.Any<string>()).Returns(true);

        await _handler.HandleAsync(new ResetPasswordCommand(userId, "MySecret@123"));

        await _repository.Received(1).ResetPasswordAsync(userId,
            Arg.Is<string>(hash => hash != "MySecret@123" && BCrypt.Net.BCrypt.Verify("MySecret@123", hash)));
    }
}
