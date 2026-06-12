using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class ClientDashboardEndpoints
{
    public static IEndpointRouteBuilder MapClientDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/dashboard")
            .WithTags("ContentDelivery")
            .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapGet("/summary", async (
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            CancellationToken ct = default) =>
        {
            if (!currentTenant.TenantId.HasValue)
                return Results.Unauthorized();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var allowedNodeIds = await GetViewableNodeIdsAsync(repository, currentTenant.TenantId.Value, userId.Value, ct);
            if (allowedNodeIds.Count == 0)
                return Results.Ok(new DashboardSummaryDto(0, 0, 0, null));

            var now = DateTime.UtcNow;
            var weekStart = now.Date.AddDays(-6);

            var summary = await repository.GetDashboardSummaryAsync(
                new GetDashboardSummaryQuery(
                    currentTenant.TenantId.Value,
                    userId.Value,
                    allowedNodeIds,
                    weekStart,
                    now),
                ct);

            return Results.Ok(summary);
        })
        .WithName("GetClientDashboardSummary")
        .WithSummary("Get dashboard summary metrics for current user")
        .Produces<DashboardSummaryDto>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/quick-access", async (
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default) =>
        {
            if (!currentTenant.TenantId.HasValue)
                return Results.Unauthorized();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var allowedNodeIds = await GetViewableNodeIdsAsync(repository, currentTenant.TenantId.Value, userId.Value, ct);
            if (allowedNodeIds.Count == 0)
                return Results.Ok(new PagedResult<QuickAccessItem>([], 0, page, pageSize));

            var now = DateTime.UtcNow;
            var weekStart = now.Date.AddDays(-6);

            var result = await repository.ListQuickAccessAsync(
                new ListQuickAccessQuery(
                    currentTenant.TenantId.Value,
                    userId.Value,
                    allowedNodeIds,
                    weekStart,
                    now,
                    page,
                    pageSize),
                ct);

            return Results.Ok(result);
        })
        .WithName("GetClientQuickAccess")
        .WithSummary("Get quick-access contents: viewed this week (non-favorite) first, then favorites")
        .Produces<PagedResult<QuickAccessItem>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        return app;
    }

    private static async Task<HashSet<Guid>> GetViewableNodeIdsAsync(
        IContentManagementRepository repository,
        Guid tenantId,
        Guid userId,
        CancellationToken ct)
    {
        var effectivePermissions = await repository.ListEffectivePermissionsForUserAsync(
            new UserEffectivePermissionsQuery(tenantId, userId),
            ct);

        return effectivePermissions
            .Where(p => p.CanView)
            .Select(p => p.CurriculumNodeId)
            .ToHashSet();
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
