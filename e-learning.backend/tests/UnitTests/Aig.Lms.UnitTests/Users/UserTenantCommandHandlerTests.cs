using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Application.Users;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

// ─────────────────────────────────────────────────────────────────────────────
// GetUserTenantsQueryHandler
// ─────────────────────────────────────────────────────────────────────────────

public class GetUserTenantsQueryHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly GetUserTenantsQueryHandler _handler;

    public GetUserTenantsQueryHandlerTests()
    {
        _handler = new GetUserTenantsQueryHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_UserHasTenants_ReturnsAll()
    {
        var userId = Guid.NewGuid();
        var expected = new List<UserTenantDto>
        {
            new(Guid.NewGuid(), "STEM",    "STEM Education", Guid.NewGuid(), "TEACHER", IsInherited: true),
            new(Guid.NewGuid(), "ENGLISH", "English Program", Guid.NewGuid(), "TEACHER", IsInherited: false)
        };
        _repository.GetUserTenantsAsync(userId).Returns(expected);

        var result = await _handler.HandleAsync(new GetUserTenantsQuery(userId));

        result.Should().HaveCount(2);
        result.Should().BeEquivalentTo(expected);
        await _repository.Received(1).GetUserTenantsAsync(userId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_UserHasNoTenants_ReturnsEmptyList()
    {
        var userId = Guid.NewGuid();
        _repository.GetUserTenantsAsync(userId).Returns(new List<UserTenantDto>());

        var result = await _handler.HandleAsync(new GetUserTenantsQuery(userId));

        result.Should().BeEmpty();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AssignUserTenantCommandHandler
// ─────────────────────────────────────────────────────────────────────────────

public class AssignUserTenantCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IAuditLogService  _auditLog   = Substitute.For<IAuditLogService>();
    private readonly AssignUserTenantCommandHandler _handler;

    public AssignUserTenantCommandHandlerTests()
    {
        _handler = new AssignUserTenantCommandHandler(_repository, _auditLog);
    }

    [Fact]
    public async Task HandleAsync_NewAssignment_ReturnsTrueAndWritesAuditLog()
    {
        var userId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.AssignUserTenantAsync(userId, tenantId, "TEACHER").Returns(true);

        var result = await _handler.HandleAsync(
            new AssignUserTenantCommand(userId, tenantId, "TEACHER", ActorUserId: Guid.NewGuid()));

        result.Should().BeTrue();
        await _auditLog.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action     == "USER_TENANT_ASSIGNED" &&
                e.EntityId   == userId &&
                e.TenantId   == tenantId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_DuplicateAssignment_ReturnsFalseAndNoAuditLog()
    {
        var userId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.AssignUserTenantAsync(userId, tenantId, "TEACHER").Returns(false);

        var result = await _handler.HandleAsync(
            new AssignUserTenantCommand(userId, tenantId, "TEACHER"));

        result.Should().BeFalse();
        await _auditLog.DidNotReceive().LogAsync(Arg.Any<AuditLogEntry>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_AssignmentPersistsCorrectRoleCode()
    {
        var userId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.AssignUserTenantAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>()).Returns(true);

        await _handler.HandleAsync(new AssignUserTenantCommand(userId, tenantId, "SCHOOL_ADMIN"));

        await _repository.Received(1).AssignUserTenantAsync(userId, tenantId, "SCHOOL_ADMIN", Arg.Any<CancellationToken>());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RemoveUserTenantCommandHandler
// ─────────────────────────────────────────────────────────────────────────────

public class RemoveUserTenantCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IAuditLogService  _auditLog   = Substitute.For<IAuditLogService>();
    private readonly RemoveUserTenantCommandHandler _handler;

    public RemoveUserTenantCommandHandlerTests()
    {
        _handler = new RemoveUserTenantCommandHandler(_repository, _auditLog);
    }

    [Fact]
    public async Task HandleAsync_ExistingAssignment_ReturnsTrueAndWritesAuditLog()
    {
        var userId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RemoveUserTenantAsync(userId, tenantId).Returns(true);

        var result = await _handler.HandleAsync(
            new RemoveUserTenantCommand(userId, tenantId, ActorUserId: Guid.NewGuid()));

        result.Should().BeTrue();
        await _auditLog.Received(1).LogAsync(
            Arg.Is<AuditLogEntry>(e =>
                e.Action     == "USER_TENANT_REMOVED" &&
                e.EntityId   == userId &&
                e.TenantId   == tenantId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_AssignmentNotFound_ReturnsFalseAndNoAuditLog()
    {
        _repository.RemoveUserTenantAsync(Arg.Any<Guid>(), Arg.Any<Guid>()).Returns(false);

        var result = await _handler.HandleAsync(
            new RemoveUserTenantCommand(Guid.NewGuid(), Guid.NewGuid()));

        result.Should().BeFalse();
        await _auditLog.DidNotReceive().LogAsync(Arg.Any<AuditLogEntry>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_SoftDeletesCorrectUserAndTenant()
    {
        var userId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        _repository.RemoveUserTenantAsync(Arg.Any<Guid>(), Arg.Any<Guid>()).Returns(true);

        await _handler.HandleAsync(new RemoveUserTenantCommand(userId, tenantId));

        await _repository.Received(1).RemoveUserTenantAsync(userId, tenantId, Arg.Any<CancellationToken>());
    }
}
