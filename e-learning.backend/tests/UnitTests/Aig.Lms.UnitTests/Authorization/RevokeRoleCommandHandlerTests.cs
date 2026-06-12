using Aig.Lms.Modules.Authorization.Application.Roles;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Authorization;

public class RevokeRoleCommandHandlerTests
{
    private readonly IAuthorizationRepository _repository = Substitute.For<IAuthorizationRepository>();
    private readonly RevokeRoleCommandHandler _handler;

    public RevokeRoleCommandHandlerTests()
    {
        _handler = new RevokeRoleCommandHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_ExistingAssignment_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RevokeRoleAsync(userId, roleId, tenantId).Returns(true);

        var result = await _handler.HandleAsync(new RevokeRoleCommand(userId, roleId, tenantId));

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAsync_NoAssignment_ReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RevokeRoleAsync(userId, roleId, tenantId).Returns(false);

        var result = await _handler.HandleAsync(new RevokeRoleCommand(userId, roleId, tenantId));

        result.Should().BeFalse();
    }
}
