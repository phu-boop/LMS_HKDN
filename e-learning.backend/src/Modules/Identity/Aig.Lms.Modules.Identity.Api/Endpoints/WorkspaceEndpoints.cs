using Aig.Lms.Modules.Identity.Application.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.Identity.Api.Endpoints;

public static class WorkspaceEndpoints
{
    public static IEndpointRouteBuilder MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/identity/workspaces")
            .WithTags("Identity");

        // GET /api/identity/workspaces
        group.MapGet("", async (
            [FromServices] GetWorkspacesQueryHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenantIdStr = user.FindFirstValue("tenant_id");
            Guid? currentTenantId = tenantIdStr is not null ? Guid.Parse(tenantIdStr) : null;

            var workspaces = await handler.HandleAsync(new GetWorkspacesQuery(userId, currentTenantId), ct);
            return Results.Ok(workspaces);
        })
        .WithName("GetWorkspaces")
        .WithSummary("List all accessible workspaces (tenants) for the current user")
        .Produces<IReadOnlyList<WorkspaceDto>>()
        .RequireAuthorization();

        // POST /api/identity/workspaces/{tenantId}/select
        group.MapPost("/{tenantId:guid}/select", async (
            Guid tenantId,
            [FromBody] SelectWorkspaceRequest body,
            [FromServices] SelectWorkspaceCommandHandler handler,
            ClaimsPrincipal user,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var command = new SelectWorkspaceCommand(
                UserId: userId,
                TargetTenantId: tenantId,
                RefreshToken: body.RefreshToken,
                UserAgent: httpContext.Request.Headers.UserAgent.ToString(),
                IpAddress: httpContext.Connection.RemoteIpAddress?.ToString());

            var (result, error) = await handler.HandleAsync(command, ct);

            if (error is not null)
            {
                return error.Code switch
                {
                    "INVALID_TOKEN" => Results.Json(error, statusCode: 401),
                    "USER_INACTIVE" or "TENANT_NOT_ACCESSIBLE" => Results.Json(error, statusCode: 403),
                    _ => Results.Json(error, statusCode: 400)
                };
            }

            return Results.Ok(result);
        })
        .WithName("SelectWorkspace")
        .WithSummary("Switch active workspace — rotates refresh token, returns new access token scoped to selected tenant")
        .Produces<LoginResult>()
        .Produces<LoginError>(401)
        .Produces<LoginError>(403)
        .RequireAuthorization();

        return app;
    }
}

public sealed record SelectWorkspaceRequest(string RefreshToken);
