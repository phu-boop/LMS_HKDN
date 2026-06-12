using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.ContentManagement.Api.Endpoints;

public static class CurriculumEndpoints
{
    public static IEndpointRouteBuilder MapContentManagementEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapContentPermissionEndpoints();
        app.MapContentItemEndpoints();

        var group = app.MapGroup("/api/tenants/{tenantId:guid}/curriculum")
            .WithTags("Curriculum")
            .RequireAuthorization();

        group.MapGet("/", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] GetCurriculumTreeQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var result = await handler.HandleAsync(tenantId, ct);
            return Results.Ok(result);
        })
        .WithName("GetCurriculumTree")
        .WithSummary("Get full curriculum tree for a tenant")
        .Produces<IReadOnlyList<CurriculumTreeNode>>()
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapGet("/{nodeId:guid}/children", async (
            Guid tenantId,
            Guid nodeId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] GetCurriculumChildrenQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var result = await handler.HandleAsync(tenantId, nodeId, ct);
            return Results.Ok(result);
        })
        .WithName("GetCurriculumChildren")
        .WithSummary("Get direct child nodes for a curriculum node")
        .Produces<IReadOnlyList<CurriculumNodeDto>>()
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapPost("/", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] CreateCurriculumNodeRequest body,
            [FromServices] CreateCurriculumNodeCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new CreateCurriculumNodeCommand(
                    tenantId,
                    body.ParentId,
                    body.NodeType,
                    body.Code,
                    body.Title,
                    body.SortOrder,
                    userId), ct);

                return Results.Created($"/api/tenants/{tenantId}/curriculum/{result.NodeId}", result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("CreateCurriculumNode")
        .WithSummary("Create a curriculum node")
        .Produces<CreateCurriculumNodeResult>(201)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        group.MapPut("/{nodeId:guid}", async (
            Guid tenantId,
            Guid nodeId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] UpdateCurriculumNodeRequest body,
            [FromServices] UpdateCurriculumNodeCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new UpdateCurriculumNodeCommand(
                    tenantId,
                    nodeId,
                    body.Code,
                    body.Title,
                    body.SortOrder,
                    body.Status,
                    userId), ct);

                return result is null ? Results.NotFound() : Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateCurriculumNode")
        .WithSummary("Update curriculum node metadata")
        .Produces<CurriculumNodeDto>()
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        group.MapDelete("/{nodeId:guid}", async (
            Guid tenantId,
            Guid nodeId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] DeleteCurriculumNodeCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var userId = GetUserId(user);

            try
            {
                var deleted = await handler.HandleAsync(new DeleteCurriculumNodeCommand(tenantId, nodeId, userId), ct);
                return deleted ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("DeleteCurriculumNode")
        .WithSummary("Delete curriculum node (validated)")
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        group.MapPatch("/reorder", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] ReorderCurriculumRequest body,
            [FromServices] ReorderCurriculumCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null)
                return scopeError;

            var userId = GetUserId(user);

            try
            {
                await handler.HandleAsync(new ReorderCurriculumCommand(tenantId, body.ParentId, body.OrderedNodeIds, userId), ct);
                return Results.NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ReorderCurriculum")
        .WithSummary("Reorder sibling curriculum nodes")
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

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
        var sub = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}

public sealed record CreateCurriculumNodeRequest(
    Guid? ParentId,
    string NodeType,
    string? Code,
    string Title,
    int SortOrder = 0);

public sealed record UpdateCurriculumNodeRequest(
    string? Code,
    string Title,
    int SortOrder,
    string Status = "ACTIVE");

public sealed record ReorderCurriculumRequest(
    Guid? ParentId,
    IReadOnlyList<Guid> OrderedNodeIds);
