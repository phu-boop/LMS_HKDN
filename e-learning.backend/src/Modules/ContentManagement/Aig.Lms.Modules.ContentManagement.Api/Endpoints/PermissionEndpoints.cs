using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.ContentManagement.Api.Endpoints;

public static class PermissionEndpoints
{
    public static IEndpointRouteBuilder MapContentPermissionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tenants/{tenantId:guid}")
            .WithTags("Content Permissions")
            .RequireAuthorization();

        group.MapGet("/permissions", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromQuery] string? curriculumNodeId,
            [FromQuery] string? schoolId,
            [FromQuery] string? userId,
            [FromServices] ListContentPermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            Guid? nodeIdFilter = Guid.TryParse(curriculumNodeId, out var nid) ? nid : null;
            Guid? schoolIdFilter = Guid.TryParse(schoolId, out var sid) ? sid : null;
            Guid? userIdFilter = Guid.TryParse(userId, out var uid) ? uid : null;

            var result = await handler.HandleAsync(
                new ListContentPermissionsQuery(tenantId, nodeIdFilter, schoolIdFilter, userIdFilter),
                ct);

            return Results.Ok(result);
        })
        .WithName("ListContentPermissions")
        .WithSummary("List content permissions by tenant with optional filters")
        .Produces<IReadOnlyList<ContentPermissionDto>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_GRANT");

        group.MapPost("/permissions", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] GrantContentPermissionRequest body,
            [FromServices] GrantContentPermissionCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var actorId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new GrantContentPermissionCommand(
                    tenantId,
                    body.CurriculumNodeId,
                    body.SchoolId,
                    body.UserId,
                    body.CanView,
                    body.CanDownload,
                    body.CanComment,
                    actorId), ct);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("GrantContentPermission")
        .WithSummary("Grant content permissions on a curriculum node to a school or user")
        .Produces<GrantContentPermissionResult>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_GRANT");

        group.MapDelete("/permissions/{permissionId:guid}", async (
            Guid tenantId,
            Guid permissionId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] DeleteContentPermissionCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var actorId = GetUserId(user);

            var deleted = await handler.HandleAsync(
                new DeleteContentPermissionCommand(tenantId, permissionId, actorId),
                ct);

            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteContentPermission")
        .WithSummary("Revoke a content permission")
        .Produces(204)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_REVOKE");

        group.MapPost("/curriculum/permissions", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] NodePermissionsViewRequest body,
            [FromServices] NodePermissionsViewQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            if (body.NodeIds is null || body.NodeIds.Length == 0)
                return Results.BadRequest(new { error = "Request body must include at least one nodeId." });

            try
            {
                var result = await handler.HandleAsync(new NodePermissionsViewQuery(tenantId, body.NodeIds), ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ListNodesPermissions")
        .WithSummary("List direct and inherited permissions effective on one or multiple curriculum nodes")
        .Produces<IReadOnlyList<NodePermissionsViewDto>>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_GRANT");

        group.MapGet("/curriculum/{nodeId:guid}/permissions", async (
            Guid tenantId,
            Guid nodeId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] NodePermissionViewQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            try
            {
                var result = await handler.HandleAsync(new NodePermissionViewQuery(tenantId, nodeId), ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ListNodePermissions")
        .WithSummary("List direct and inherited permissions effective on a curriculum node")
        .Produces<IReadOnlyList<NodePermissionViewDto>>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_GRANT");

        group.MapGet("/users/{userId:guid}/permissions", async (
            Guid tenantId,
            Guid userId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] UserEffectivePermissionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            try
            {
                var result = await handler.HandleAsync(new UserEffectivePermissionsQuery(tenantId, userId), ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ListUserEffectivePermissions")
        .WithSummary("List effective curriculum permissions for a user in tenant context")
        .Produces<IReadOnlyList<UserEffectiveNodePermissionDto>>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CONTENT_PERMISSION_GRANT");

        return app;
    }

    private static IResult? EnsureTenantScope(ICurrentTenant currentTenant, ClaimsPrincipal user, Guid tenantId)
    {
        var effectiveTenantId = currentTenant.TenantId;

        if (!effectiveTenantId.HasValue)
        {
            var tenantClaim = user.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(tenantClaim, out var tenantIdFromClaim))
                effectiveTenantId = tenantIdFromClaim;
        }

        if (!effectiveTenantId.HasValue)
            return Results.Unauthorized();

        return effectiveTenantId.Value != tenantId ? Results.Forbid() : null;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}

public sealed record GrantContentPermissionRequest(
    Guid CurriculumNodeId,
    Guid? SchoolId,
    Guid? UserId,
    bool CanView = true,
    bool CanDownload = false,
    bool CanComment = true);

public sealed record NodePermissionsViewRequest(
    Guid[] NodeIds);
