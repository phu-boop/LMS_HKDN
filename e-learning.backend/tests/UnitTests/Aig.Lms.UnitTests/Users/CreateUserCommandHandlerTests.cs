using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

public class CreateUserCommandHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly IUserQuotaService _quotaService = Substitute.For<IUserQuotaService>();
    private readonly IUserRoleAssignmentService _roleAssignment = Substitute.For<IUserRoleAssignmentService>();
    private readonly IAuditLogService _auditLog = Substitute.For<IAuditLogService>();
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _handler = new CreateUserCommandHandler(_repository, _quotaService, _roleAssignment, _auditLog);
    }

    [Fact]
    public async Task HandleAsync_ValidCommand_CreatesUserAndReturnsResult()
    {
        var schoolId = Guid.NewGuid();
        var command = new CreateUserCommand(schoolId, "newuser", "Pass@123", "New User", "new@test.com");
        _repository.ExistsAsync(schoolId, "newuser").Returns(false);

        var result = await _handler.HandleAsync(command);

        result.Should().NotBeNull();
        result.Username.Should().Be("newuser");
        result.FullName.Should().Be("New User");
        result.Email.Should().Be("new@test.com");
        result.UserId.Should().NotBeEmpty();
        await _repository.Received(1).CreateAsync(
            Arg.Is<User>(u =>
                u.Username == "newuser" &&
                u.SchoolId == schoolId &&
                u.FullName == "New User" &&
                u.Email == "new@test.com" &&
                u.Status == "ACTIVE"),
            Arg.Any<string>());
    }

    [Fact]
    public async Task HandleAsync_DuplicateUsername_ThrowsInvalidOperationException()
    {
        var schoolId = Guid.NewGuid();
        _repository.ExistsAsync(schoolId, "existing").Returns(true);

        var act = () => _handler.HandleAsync(new CreateUserCommand(schoolId, "existing", "Pass@123", "User"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*existing*already exists*");
    }

    [Fact]
    public async Task HandleAsync_NoEmail_CreatesUserWithNullEmail()
    {
        var schoolId = Guid.NewGuid();
        var command = new CreateUserCommand(schoolId, "noemail", "Pass@123", "No Email");
        _repository.ExistsAsync(schoolId, "noemail").Returns(false);

        var result = await _handler.HandleAsync(command);

        result.Email.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_PasswordIsHashed_NotStoredPlaintext()
    {
        var schoolId = Guid.NewGuid();
        _repository.ExistsAsync(schoolId, "user1").Returns(false);

        await _handler.HandleAsync(new CreateUserCommand(schoolId, "user1", "MySecret@123", "User"));

        await _repository.Received(1).CreateAsync(
            Arg.Any<User>(),
            Arg.Is<string>(hash => hash != "MySecret@123" && BCrypt.Net.BCrypt.Verify("MySecret@123", hash)));
    }

    [Fact]
    public async Task HandleAsync_SchoolUserWithAccountType_CallsInheritSchoolTenants()
    {
        var schoolId = Guid.NewGuid();
        var command = new CreateUserCommand(schoolId, "teacher1", "Pass@123", "Teacher One",
            AccountType: "TEACHER");
        _repository.ExistsAsync(schoolId, "teacher1").Returns(false);

        await _handler.HandleAsync(command);

        await _roleAssignment.Received(1).InheritSchoolTenantsAsync(
            Arg.Any<Guid>(), schoolId, "TEACHER", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_NoSchoolId_DoesNotCallInheritSchoolTenants()
    {
        var command = new CreateUserCommand(null, "lmsadmin", "Pass@123", "LMS Admin",
            AccountType: "LMS_ADMIN");
        _repository.ExistsAsync(null, "lmsadmin").Returns(false);

        await _handler.HandleAsync(command);

        await _roleAssignment.DidNotReceive().InheritSchoolTenantsAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_SchoolUserNoAccountType_DoesNotCallInheritSchoolTenants()
    {
        var schoolId = Guid.NewGuid();
        var command = new CreateUserCommand(schoolId, "user2", "Pass@123", "User Two");
        _repository.ExistsAsync(schoolId, "user2").Returns(false);

        await _handler.HandleAsync(command);

        await _roleAssignment.DidNotReceive().InheritSchoolTenantsAsync(
            Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_ExplicitRoleAndTenant_CallsAssignRole()
    {
        var schoolId = Guid.NewGuid();
        var roleId   = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var command  = new CreateUserCommand(schoolId, "teacher2", "Pass@123", "Teacher Two",
            RoleId: roleId, TenantId: tenantId);
        _repository.ExistsAsync(schoolId, "teacher2").Returns(false);

        await _handler.HandleAsync(command);

        await _roleAssignment.Received(1).AssignRoleAsync(
            Arg.Any<Guid>(), roleId, tenantId, Arg.Any<CancellationToken>());
    }
}
