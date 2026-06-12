using System.Security.Claims;
using Aig.Lms.Modules.Authorization.Application.Permissions;
using Microsoft.AspNetCore.Authorization;

namespace Aig.Lms.Api.Authorization;

public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string PermissionCode { get; }

    public PermissionRequirement(string permissionCode)
    {
        PermissionCode = permissionCode;
    }
}

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IPermissionService _permissionService;

    public PermissionAuthorizationHandler(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var roleClaims = context.User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        if (roleClaims.Count == 0)
            return;

        // LMS_ADMIN bypasses all permission checks
        if (roleClaims.Contains("LMS_ADMIN"))
        {
            context.Succeed(requirement);
            return;
        }

        var permissions = await _permissionService.GetPermissionsForRolesAsync(roleClaims);

        if (permissions.Contains(requirement.PermissionCode))
            context.Succeed(requirement);
    }
}
