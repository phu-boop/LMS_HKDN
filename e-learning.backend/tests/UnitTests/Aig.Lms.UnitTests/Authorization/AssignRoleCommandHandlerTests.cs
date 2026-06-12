using Aig.Lms.Modules.Authorization.Application.Roles;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Authorization;

public class AssignRoleCommandHandlerTests
{
    private readonly IAuthorizationRepository _repository = Substitute.For<IAuthorizationRepository>();
    private readonly AssignRoleCommandHandler _handler;

    public AssignRoleCommandHandlerTests()
    {
        _handler = new AssignRoleCommandHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_RoleExists_AssignsRole()
    {
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RoleExistsAsync(roleId).Returns(true);

        await _handler.HandleAsync(new AssignRoleCommand(userId, roleId, tenantId));

        await _repository.Received(1).AssignRoleAsync(userId, roleId, tenantId);
    }

    [Fact]
    public async Task HandleAsync_RoleExists_WithTenant_PassesTenant()
    {
        var roleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RoleExistsAsync(roleId).Returns(true);

        await _handler.HandleAsync(new AssignRoleCommand(userId, roleId, tenantId));

        await _repository.Received(1).AssignRoleAsync(userId, roleId, tenantId);
    }

    [Fact]
    public async Task HandleAsync_RoleNotFound_ThrowsInvalidOperationException()
    {
        var roleId = Guid.NewGuid();
        _repository.RoleExistsAsync(roleId).Returns(false);

        var act = () => _handler.HandleAsync(new AssignRoleCommand(Guid.NewGuid(), roleId, Guid.NewGuid()));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{roleId}*");
    }
}
