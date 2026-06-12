using System.Security.Claims;
using Aig.Lms.Api.Authorization;
using Aig.Lms.Modules.Authorization.Application.Permissions;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using NSubstitute;

namespace Aig.Lms.UnitTests.Authorization;

public class PermissionAuthorizationHandlerTests
{
    private readonly IPermissionService _permissionService = Substitute.For<IPermissionService>();
    private readonly PermissionAuthorizationHandler _handler;

    public PermissionAuthorizationHandlerTests()
    {
        _handler = new PermissionAuthorizationHandler(_permissionService);
    }

    private static AuthorizationHandlerContext CreateContext(
        PermissionRequirement requirement,
        params string[] roles)
    {
        var claims = roles.Select(r => new Claim(ClaimTypes.Role, r)).ToList();
        claims.Add(new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()));
        var identity = new ClaimsIdentity(claims, "TestScheme");
        var principal = new ClaimsPrincipal(identity);

        return new AuthorizationHandlerContext(
            new[] { requirement },
            principal,
            new DefaultHttpContext());
    }

    [Fact]
    public async Task HandleRequirementAsync_LmsAdmin_BypassesPermissionCheck()
    {
        var requirement = new PermissionRequirement("USERS_VIEW");
        var context = CreateContext(requirement, "LMS_ADMIN");

        await _handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
        await _permissionService.DidNotReceive().GetPermissionsForRolesAsync(Arg.Any<IEnumerable<string>>());
    }

    [Fact]
    public async Task HandleRequirementAsync_HasPermission_Succeeds()
    {
        var requirement = new PermissionRequirement("USERS_VIEW");
        var context = CreateContext(requirement, "SCHOOL_ADMIN");

        _permissionService.GetPermissionsForRolesAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new HashSet<string> { "USERS_VIEW", "USERS_CREATE" }.AsReadOnly());

        await _handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task HandleRequirementAsync_MissingPermission_DoesNotSucceed()
    {
        var requirement = new PermissionRequirement("USERS_DELETE");
        var context = CreateContext(requirement, "TEACHER");

        _permissionService.GetPermissionsForRolesAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new HashSet<string> { "CONTENT_VIEW" }.AsReadOnly());

        await _handler.HandleAsync(context);

        context.HasSucceeded.Should().BeFalse();
    }

    [Fact]
    public async Task HandleRequirementAsync_NoRoleClaims_DoesNotSucceed()
    {
        var requirement = new PermissionRequirement("USERS_VIEW");
        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()) },
            "TestScheme");
        var principal = new ClaimsPrincipal(identity);
        var context = new AuthorizationHandlerContext(
            new[] { requirement }, principal, new DefaultHttpContext());

        await _handler.HandleAsync(context);

        context.HasSucceeded.Should().BeFalse();
        await _permissionService.DidNotReceive().GetPermissionsForRolesAsync(Arg.Any<IEnumerable<string>>());
    }

    [Fact]
    public async Task HandleRequirementAsync_MultipleRoles_PassesAllToService()
    {
        var requirement = new PermissionRequirement("USERS_VIEW");
        var context = CreateContext(requirement, "TEACHER", "SCHOOL_ADMIN");

        _permissionService.GetPermissionsForRolesAsync(
            Arg.Is<IEnumerable<string>>(r => r.Contains("TEACHER") && r.Contains("SCHOOL_ADMIN")))
            .Returns(new HashSet<string> { "USERS_VIEW" }.AsReadOnly());

        await _handler.HandleAsync(context);

        context.HasSucceeded.Should().BeTrue();
    }
}
