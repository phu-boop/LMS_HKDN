using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

public class UpdateUserCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IAuditLogService _auditLog = Substitute.For<IAuditLogService>();
    private readonly UpdateUserCommandHandler _handler;

    public UpdateUserCommandHandlerTests()
    {
        _handler = new UpdateUserCommandHandler(_repository, _auditLog);
    }

    [Fact]
    public async Task HandleAsync_UserExists_DelegatesToRepository()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, SchoolId = Guid.NewGuid(), Username = "user1", FullName = "Old Name", Status = "ACTIVE" };
        var command = new UpdateUserCommand(userId, "New Name", "new@test.com", "ACTIVE");
        var expected = new UpdateUserResult(userId, "user1", "New Name", "new@test.com", "ACTIVE");

        _repository.GetByIdAsync(userId).Returns(user);
        _repository.UpdateAsync(command).Returns(expected);

        var result = await _handler.HandleAsync(command);

        result.Should().NotBeNull();
        result!.FullName.Should().Be("New Name");
        result.Email.Should().Be("new@test.com");
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsNull()
    {
        var command = new UpdateUserCommand(Guid.NewGuid(), "Name", null, "ACTIVE");
        _repository.UpdateAsync(Arg.Any<UpdateUserCommand>()).Returns((UpdateUserResult?)null);

        var result = await _handler.HandleAsync(command);

        result.Should().BeNull();
    }

    [Fact]
    public void ChangeUserStatusCommand_StoresProperties()
    {
        var userId = Guid.NewGuid();
        var command = new ChangeUserStatusCommand(userId, "DISABLED");

        command.UserId.Should().Be(userId);
        command.Status.Should().Be("DISABLED");
    }

    [Fact]
    public void UpdateUserResult_AllProperties_Accessible()
    {
        var id = Guid.NewGuid();
        var result = new UpdateUserResult(id, "user1", "Full Name", "test@email.com", "ACTIVE");

        result.UserId.Should().Be(id);
        result.Username.Should().Be("user1");
        result.FullName.Should().Be("Full Name");
        result.Email.Should().Be("test@email.com");
        result.Status.Should().Be("ACTIVE");
    }

    [Fact]
    public void UpdateUserCommand_AllProperties_Accessible()
    {
        var id = Guid.NewGuid();
        var command = new UpdateUserCommand(id, "Name", "email@test.com", "INACTIVE");

        command.UserId.Should().Be(id);
        command.FullName.Should().Be("Name");
        command.Email.Should().Be("email@test.com");
        command.Status.Should().Be("INACTIVE");
    }
}
