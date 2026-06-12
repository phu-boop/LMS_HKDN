using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class ClientFavoritesEndpoints
{
    public static IEndpointRouteBuilder MapClientFavoritesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/favorites")
            .WithTags("ContentDelivery")
            .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapGet("/", async (
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (!currentTenant.TenantId.HasValue)
                return Results.Unauthorized();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var allowedNodeIds = await GetViewableNodeIdsAsync(repository, currentTenant.TenantId.Value, userId.Value, ct);
            if (allowedNodeIds.Count == 0)
                return Results.Ok(Array.Empty<FavoriteContentItem>());

            var favorites = await repository.ListFavoriteContentsAsync(currentTenant.TenantId.Value, userId.Value, ct);
            var accessibleFavorites = favorites
                .Where(item => allowedNodeIds.Contains(item.CurriculumNodeId))
                .ToList();

            return Results.Ok(accessibleFavorites);
        })
        .WithName("GetClientFavorites")
        .WithSummary("Get favorite contents accessible to current user")
        .Produces<IReadOnlyList<FavoriteContentItem>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapPost("/{contentId:guid}", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            await repository.AddFavoriteContentAsync(userId.Value, contentId, ct);
            return Results.NoContent();
        })
        .WithName("AddClientFavorite")
        .WithSummary("Add content to current user's favorites")
        .Produces(204)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapDelete("/{contentId:guid}", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (!currentTenant.TenantId.HasValue)
                return Results.Unauthorized();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var deleted = await repository.RemoveFavoriteContentAsync(userId.Value, contentId, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteClientFavorite")
        .WithSummary("Remove content from current user's favorites")
        .Produces(204)
        .ProducesProblem(401);

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

    private static async Task<ContentAccessResult> ResolveContentAccessAsync(
        Guid contentId,
        ClaimsPrincipal user,
        ICurrentTenant currentTenant,
        IContentManagementRepository repository,
        CancellationToken ct)
    {
        if (!currentTenant.TenantId.HasValue)
            return ContentAccessResult.Fail(Results.Unauthorized());

        var userId = GetUserId(user);
        if (!userId.HasValue)
            return ContentAccessResult.Fail(Results.Unauthorized());

        var content = await repository.GetContentAsync(currentTenant.TenantId.Value, contentId, ct);
        if (content is null)
            return ContentAccessResult.Fail(Results.NotFound());

        if (!IsContentVisibleNow(content))
            return ContentAccessResult.Fail(Results.NotFound());

        var allowedNodeIds = await GetViewableNodeIdsAsync(repository, currentTenant.TenantId.Value, userId.Value, ct);
        if (!allowedNodeIds.Contains(content.CurriculumNodeId))
            return ContentAccessResult.Fail(Results.Forbid());

        return new ContentAccessResult(content, null);
    }

    private static bool IsContentVisibleNow(ContentItemDto content)
    {
        if (!string.Equals(content.PublishStatus, "PUBLISHED", StringComparison.OrdinalIgnoreCase))
            return false;

        var now = DateTime.UtcNow;
        if (content.VisibilityFrom.HasValue && now < content.VisibilityFrom.Value)
            return false;
        if (content.VisibilityTo.HasValue && now.Date > content.VisibilityTo.Value.Date)
            return false;

        return true;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private sealed record ContentAccessResult(ContentItemDto? Content, IResult? Result)
    {
        public static ContentAccessResult Fail(IResult result) => new(null, result);
    }
}
