using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Authorization;

public class QueryHandlerTests
{
    private readonly IAuthorizationRepository _repository = Substitute.For<IAuthorizationRepository>();

    [Fact]
    public async Task ListRolesQueryHandler_ReturnsAllRoles()
    {
        var roles = new List<Role>
        {
            new() { Id = Guid.NewGuid(), Code = "SUPER_ADMIN", Name = "Super Admin" },
            new() { Id = Guid.NewGuid(), Code = "TEACHER", Name = "Teacher" }
        };
        _repository.GetAllRolesAsync(null, Arg.Any<CancellationToken>()).Returns(Task.FromResult<IReadOnlyList<Role>>(roles));

        var handler = new ListRolesQueryHandler(_repository);
        var result = await handler.HandleAsync(new ListRolesQuery());

        result.Should().HaveCount(2);
        result.Should().Contain(r => r.Code == "SUPER_ADMIN");
    }

    [Fact]
    public async Task GetUserRolesQueryHandler_ReturnsUserAssignments()
    {
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var assignments = new List<UserTenantRoleAssignment>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, RoleId = Guid.NewGuid(), RoleCode = "TEACHER", RoleName = "Teacher", TenantId = tenantId, IsActive = true }
        };
        _repository.GetUserRolesAsync(userId).Returns(assignments);

        var handler = new GetUserRolesQueryHandler(_repository);
        var result = await handler.HandleAsync(new GetUserRolesQuery(userId));

        result.Should().HaveCount(1);
        result[0].RoleCode.Should().Be("TEACHER");
    }

    [Fact]
    public async Task ListPermissionsQueryHandler_ReturnsAllPermissions()
    {
        var permissions = new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Code = "USERS_VIEW", Name = "View Users", Module = "Users", Action = "VIEW" },
            new() { Id = Guid.NewGuid(), Code = "USERS_CREATE", Name = "Create Users", Module = "Users", Action = "CREATE" }
        };
        _repository.GetAllPermissionsAsync().Returns(permissions);

        var handler = new ListPermissionsQueryHandler(_repository);
        var result = await handler.HandleAsync();

        result.Should().HaveCount(2);
        result.Should().Contain(p => p.Code == "USERS_VIEW");
    }

    [Fact]
    public async Task GetRolePermissionsQueryHandler_ReturnsPermissionsForRole()
    {
        var roleId = Guid.NewGuid();
        var permissions = new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Code = "CONTENT_VIEW", Name = "View Content", Module = "Content", Action = "VIEW" }
        };
        _repository.GetPermissionsByRoleIdAsync(roleId).Returns(permissions);

        var handler = new GetRolePermissionsQueryHandler(_repository);
        var result = await handler.HandleAsync(new GetRolePermissionsQuery(roleId));

        result.Should().HaveCount(1);
        result[0].Code.Should().Be("CONTENT_VIEW");
    }

    [Fact]
    public async Task GetUserRolesQueryHandler_NoAssignments_ReturnsEmpty()
    {
        var userId = Guid.NewGuid();
        _repository.GetUserRolesAsync(userId).Returns(new List<UserTenantRoleAssignment>());

        var handler = new GetUserRolesQueryHandler(_repository);
        var result = await handler.HandleAsync(new GetUserRolesQuery(userId));

        result.Should().BeEmpty();
    }

    // ── GetUserPermissionsQueryHandler (task 2.8) ──────────────────────────────

    [Fact]
    public async Task GetUserPermissionsQueryHandler_WithRoles_ReturnsEffectivePermissions()
    {
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var permissionService = Substitute.For<IPermissionService>();

        _repository.GetUserRolesAsync(userId).Returns(new List<UserTenantRoleAssignment>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, RoleId = Guid.NewGuid(), RoleCode = "TEACHER", RoleName = "Teacher", TenantId = tenantId, IsActive = true }
        });
        permissionService.GetPermissionsForRolesAsync(Arg.Is<IEnumerable<string>>(r => r.Contains("TEACHER")))
            .Returns(new HashSet<string> { "CONTENT_VIEW", "CURRICULUM_VIEW" }.AsReadOnly());

        var handler = new GetUserPermissionsQueryHandler(_repository, permissionService);
        var result = await handler.HandleAsync(new GetUserPermissionsQuery(userId));

        result.UserId.Should().Be(userId);
        result.RoleCodes.Should().Contain("TEACHER");
        result.PermissionCodes.Should().Contain("CONTENT_VIEW");
        result.PermissionCodes.Should().Contain("CURRICULUM_VIEW");
    }

    [Fact]
    public async Task GetUserPermissionsQueryHandler_NoAssignments_ReturnsEmpty()
    {
        var userId = Guid.NewGuid();
        var permissionService = Substitute.For<IPermissionService>();

        _repository.GetUserRolesAsync(userId).Returns(new List<UserTenantRoleAssignment>());

        var handler = new GetUserPermissionsQueryHandler(_repository, permissionService);
        var result = await handler.HandleAsync(new GetUserPermissionsQuery(userId));

        result.RoleCodes.Should().BeEmpty();
        result.PermissionCodes.Should().BeEmpty();
        await permissionService.DidNotReceive().GetPermissionsForRolesAsync(Arg.Any<IEnumerable<string>>());
    }

    [Fact]
    public async Task GetUserPermissionsQueryHandler_MultipleRolesSameTenant_DeduplicatesRoles()
    {
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var permissionService = Substitute.For<IPermissionService>();

        _repository.GetUserRolesAsync(userId).Returns(new List<UserTenantRoleAssignment>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, RoleId = Guid.NewGuid(), RoleCode = "TEACHER", TenantId = tenantId, IsActive = true },
            new() { Id = Guid.NewGuid(), UserId = userId, RoleId = Guid.NewGuid(), RoleCode = "TEACHER", TenantId = Guid.NewGuid(), IsActive = true }
        });
        permissionService.GetPermissionsForRolesAsync(
            Arg.Is<IEnumerable<string>>(r => r.Count() == 1 && r.First() == "TEACHER"))
            .Returns(new HashSet<string> { "CONTENT_VIEW" }.AsReadOnly());

        var handler = new GetUserPermissionsQueryHandler(_repository, permissionService);
        var result = await handler.HandleAsync(new GetUserPermissionsQuery(userId));

        result.RoleCodes.Should().HaveCount(1).And.Contain("TEACHER");
    }

    // ── GetRolesWithPermissionsQueryHandler (task 2.8) ─────────────────────────

    [Fact]
    public async Task GetRolesWithPermissionsQueryHandler_ReturnsRolesWithPermissionCodes()
    {
        var roleId = Guid.NewGuid();
        _repository.GetAllRolesAsync(null, Arg.Any<CancellationToken>()).Returns(Task.FromResult<IReadOnlyList<Role>>(new List<Role>
        {
            new() { Id = roleId, Code = "TEACHER", Name = "Teacher" }
        }));
        _repository.GetPermissionsByRoleIdAsync(roleId).Returns(new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Code = "CONTENT_VIEW", Name = "View Content", Module = "content", Action = "VIEW" },
            new() { Id = Guid.NewGuid(), Code = "CURRICULUM_VIEW", Name = "View Curriculum", Module = "curriculum", Action = "VIEW" }
        });

        var handler = new GetRolesWithPermissionsQueryHandler(_repository);
        var result = await handler.HandleAsync();

        result.Should().HaveCount(1);
        result[0].Code.Should().Be("TEACHER");
        result[0].PermissionCodes.Should().BeEquivalentTo(new[] { "CONTENT_VIEW", "CURRICULUM_VIEW" });
    }

    [Fact]
    public async Task GetRolesWithPermissionsQueryHandler_RoleWithNoPermissions_ReturnsEmptyList()
    {
        var roleId = Guid.NewGuid();
        _repository.GetAllRolesAsync(null, Arg.Any<CancellationToken>()).Returns(Task.FromResult<IReadOnlyList<Role>>(new List<Role>
        {
            new() { Id = roleId, Code = "EMPTY_ROLE", Name = "Empty Role" }
        }));
        _repository.GetPermissionsByRoleIdAsync(roleId).Returns(new List<Permission>());

        var handler = new GetRolesWithPermissionsQueryHandler(_repository);
        var result = await handler.HandleAsync();

        result.Should().HaveCount(1);
        result[0].PermissionCodes.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRolesWithPermissionsQueryHandler_PermissionCodesAreSorted()
    {
        var roleId = Guid.NewGuid();
        _repository.GetAllRolesAsync(null, Arg.Any<CancellationToken>()).Returns(Task.FromResult<IReadOnlyList<Role>>(new List<Role>
        {
            new() { Id = roleId, Code = "LMS_ADMIN", Name = "LMS Admin" }
        }));
        _repository.GetPermissionsByRoleIdAsync(roleId).Returns(new List<Permission>
        {
            new() { Id = Guid.NewGuid(), Code = "USERS_VIEW",   Module = "users" },
            new() { Id = Guid.NewGuid(), Code = "AUDIT_LOGS_VIEW", Module = "audit" },
            new() { Id = Guid.NewGuid(), Code = "TENANTS_VIEW", Module = "tenants" }
        });

        var handler = new GetRolesWithPermissionsQueryHandler(_repository);
        var result = await handler.HandleAsync();

        result[0].PermissionCodes.Should().BeInAscendingOrder();
    }
}
