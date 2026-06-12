using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Application.Users;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

public class ChangeUserStatusCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IAuditLogService _auditLog = Substitute.For<IAuditLogService>();
    private readonly ChangeUserStatusCommandHandler _handler;

    public ChangeUserStatusCommandHandlerTests()
    {
        _handler = new ChangeUserStatusCommandHandler(_repository, _auditLog);
    }

    [Theory]
    [InlineData("ACTIVE")]
    [InlineData("INACTIVE")]
    [InlineData("LOCKED")]
    public async Task HandleAsync_UserExists_UpdatesStatusAndReturnsTrue(string status)
    {
        var userId = Guid.NewGuid();
        _repository.ChangeStatusAsync(userId, status).Returns(true);

        var result = await _handler.HandleAsync(new ChangeUserStatusCommand(userId, status));

        result.Should().BeTrue();
        await _repository.Received(1).ChangeStatusAsync(userId, status);
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsFalse()
    {
        _repository.ChangeStatusAsync(Arg.Any<Guid>(), Arg.Any<string>()).Returns(false);

        var result = await _handler.HandleAsync(new ChangeUserStatusCommand(Guid.NewGuid(), "LOCKED"));

        result.Should().BeFalse();
        await _auditLog.DidNotReceive().LogAsync(Arg.Any<AuditLogEntry>());
    }

    [Fact]
    public async Task HandleAsync_Success_WritesAuditLogWithNewStatus()
    {
        var userId = Guid.NewGuid();
        _repository.ChangeStatusAsync(userId, "LOCKED").Returns(true);

        await _handler.HandleAsync(new ChangeUserStatusCommand(userId, "LOCKED",
            ActorUserId: Guid.NewGuid(), IpAddress: "10.0.0.1"));

        await _auditLog.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action == "USER_STATUS_CHANGED" &&
                e.EntityType == "user_account" &&
                e.EntityId == userId &&
                e.Metadata != null && e.Metadata.Contains("LOCKED")));
    }
}
