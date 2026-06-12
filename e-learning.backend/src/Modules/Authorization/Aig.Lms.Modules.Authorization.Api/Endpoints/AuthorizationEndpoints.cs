using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Domain;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Aig.Lms.Modules.Authorization.Api.Endpoints;

public static class AuthorizationEndpoints
{
    public static IEndpointRouteBuilder MapAuthorizationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/authorization")
            .WithTags("Authorization")
            .RequireAuthorization();

        // GET /api/authorization/roles
        group.MapGet("/roles", async (
            [FromQuery] string? roleType,
            [FromServices] ListRolesQueryHandler handler,
            CancellationToken ct) =>
        {
            var query = new ListRolesQuery(roleType);
            var roles = await handler.HandleAsync(query, ct);
            return Results.Ok(roles);
        })
        .WithName("ListRoles")
        .WithSummary("List all available roles (PLATFORM / TENANT / SCHOOL scope). Use ?roleType=admin to get admin-level roles (LMS_ADMIN, TENANT_ADMIN, SCHOOL_ADMIN)")
        .Produces<IReadOnlyList<Role>>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        // GET /api/authorization/users/{userId}/roles
        group.MapGet("/users/{userId:guid}/roles", async (
            Guid userId,
            [FromServices] GetUserRolesQueryHandler handler,
            CancellationToken ct) =>
        {
            var assignments = await handler.HandleAsync(new GetUserRolesQuery(userId), ct);
            return Results.Ok(assignments);
        })
        .WithName("GetUserRoles")
        .WithSummary("Get all active role assignments for a user")
        .Produces<IReadOnlyList<UserTenantRoleAssignment>>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        // POST /api/authorization/users/{userId}/roles
        group.MapPost("/users/{userId:guid}/roles", async (
            Guid userId,
            [FromBody] AssignRoleRequest body,
            [FromServices] AssignRoleCommandHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var command = new AssignRoleCommand(userId, body.RoleId, body.TenantId);
                await handler.HandleAsync(command, ct);
                return Results.NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        })
        .WithName("AssignRole")
        .WithSummary("Assign a role to a user (optionally scoped to a tenant or school)")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:ROLES_ASSIGN");

        // DELETE /api/authorization/users/{userId}/roles/{roleId}
        group.MapDelete("/users/{userId:guid}/roles/{roleId:guid}", async (
            Guid userId,
            Guid roleId,
            [FromQuery] Guid? tenantId,
            [FromServices] RevokeRoleCommandHandler handler,
            CancellationToken ct) =>
        {
            var revoked = await handler.HandleAsync(
                new RevokeRoleCommand(userId, roleId, tenantId ?? Guid.Empty), ct);

            return revoked ? Results.NoContent() : Results.NotFound();
        })
        .WithName("RevokeRole")
        .WithSummary("Revoke a role assignment from a user")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:ROLES_REVOKE");

        // GET /api/authorization/permissions
        group.MapGet("/permissions", async (
            [FromServices] ListPermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var permissions = await handler.HandleAsync(ct);
            return Results.Ok(permissions);
        })
        .WithName("ListPermissions")
        .WithSummary("List all available permissions grouped by module")
        .Produces<IReadOnlyList<Permission>>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        // GET /api/authorization/roles/{roleId}/permissions
        group.MapGet("/roles/{roleId:guid}/permissions", async (
            Guid roleId,
            [FromServices] GetRolePermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var permissions = await handler.HandleAsync(new GetRolePermissionsQuery(roleId), ct);
            return Results.Ok(permissions);
        })
        .WithName("GetRolePermissions")
        .WithSummary("Get all permissions assigned to a specific role")
        .Produces<IReadOnlyList<Permission>>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        // ── Admin-scoped endpoints (task 2.8) ──────────────────────────────────

        var adminGroup = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization();

        // GET /api/admin/roles  — roles with their permission codes
        adminGroup.MapGet("/roles", async (
            [FromServices] GetRolesWithPermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var roles = await handler.HandleAsync(ct);
            return Results.Ok(roles);
        })
        .WithName("AdminListRoles")
        .WithSummary("List all roles with their assigned permission codes")
        .Produces<IReadOnlyList<RoleWithPermissions>>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        // GET /api/admin/users/{userId}/permissions  — effective permissions for a user
        adminGroup.MapGet("/users/{userId:guid}/permissions", async (
            Guid userId,
            [FromServices] GetUserPermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetUserPermissionsQuery(userId), ct);
            return Results.Ok(result);
        })
        .WithName("GetUserEffectivePermissions")
        .WithSummary("Get effective permission codes for a user derived from their active role assignments")
        .Produces<UserPermissionsResult>()
        .RequireAuthorization("Permission:ROLES_VIEW");

        return app;
    }
}

public sealed record AssignRoleRequest(Guid RoleId, Guid TenantId);
