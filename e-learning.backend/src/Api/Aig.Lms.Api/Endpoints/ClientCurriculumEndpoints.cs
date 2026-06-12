using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class ClientCurriculumEndpoints
{
    public static IEndpointRouteBuilder MapClientCurriculumEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/curriculum")
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
                return Results.Ok(Array.Empty<CurriculumTreeNode>());

            var flatNodes = await repository.ListFlatByTenantAsync(currentTenant.TenantId.Value, ct);
            var roots = BuildFilteredTree(flatNodes, allowedNodeIds);
            return Results.Ok(roots);
        })
        .WithName("GetClientCurriculumTree")
        .WithSummary("Get curriculum tree filtered by current user's effective view permissions")
        .Produces<IReadOnlyList<CurriculumTreeNode>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/{nodeId:guid}/contents", async (
            Guid nodeId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            int page = 1,
            int pageSize = 20,
            string? search = null,
            CancellationToken ct = default) =>
        {
            if (!currentTenant.TenantId.HasValue)
                return Results.Unauthorized();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var allowedNodeIds = await GetViewableNodeIdsAsync(repository, currentTenant.TenantId.Value, userId.Value, ct);
            if (!allowedNodeIds.Contains(nodeId))
                return Results.Forbid();

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var result = await repository.ListContentsAsync(
                new ListContentsQuery(
                    currentTenant.TenantId.Value,
                    nodeId,
                    null,
                    "PUBLISHED",
                    search,
                    page,
                    pageSize,
                    userId.Value),
                ct);

            // Get user's permissions for this node
            var permissions = await repository.ListEffectivePermissionsForUserAsync(
                new UserEffectivePermissionsQuery(currentTenant.TenantId.Value, userId.Value),
                ct);

            var nodePermission = permissions.FirstOrDefault(p => p.CurriculumNodeId == nodeId);
            var userCanDownload = nodePermission?.CanDownload ?? false;
            var userCanComment = nodePermission?.CanComment ?? false;

            // Apply permissions to each content item
            var items = result.Items
                .Select(item => new ContentListItem(
                    item.Id,
                    item.Type,
                    item.Title,
                    item.Description,
                    item.FileName,
                    item.FileSizeBytes,
                    item.PublishStatus,
                    item.VisibilityFrom,
                    item.VisibilityTo,
                    item.IsDownloadable && userCanDownload,
                    true && userCanComment, // Combine with user permission
                    item.WatermarkEnabled,
                    item.MediaProcessingStatus,
                    item.ProgressValue,
                    item.TotalValue,
                    item.CreatedAt,
                    item.UpdatedAt))
                .ToList();

            var updatedResult = new PagedResult<ContentListItem>(items, result.TotalCount, result.Page, result.PageSize);
            return Results.Ok(updatedResult);
        })
        .WithName("GetClientNodeContents")
        .WithSummary("Get published contents in a curriculum node for current user")
        .Produces<PagedResult<ContentListItem>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/contents/{contentId:guid}/progress", async (
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var progress = await repository.GetUserContentProgressAsync(
                currentTenant.TenantId!.Value,
                userId.Value,
                contentId,
                ct);

            if (progress is null)
                return Results.Ok(new ContentProgressResponse(contentId, 0, 0, null));

            return Results.Ok(new ContentProgressResponse(progress.ContentItemId, progress.ProgressValue, progress.TotalValue, progress.UpdatedAt));
        })
        .WithName("GetClientContentProgress")
        .WithSummary("Get current user's progress for a content item")
        .Produces<ContentProgressResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPut("/contents/{contentId:guid}/progress", async (
            Guid contentId,
            UpdateContentProgressRequest request,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (request.ProgressValue < 0)
                return Results.BadRequest(new { error = "progressValue must be greater than or equal to 0." });

            if (request.TotalValue < 0)
                return Results.BadRequest(new { error = "totalValue must be greater than or equal to 0." });

            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            if (string.Equals(content.Type, "URL", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { error = "Progress tracking is not supported for URL content." });

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var updated = await repository.UpsertUserContentProgressAsync(
                new UpsertContentProgressCommand(
                    currentTenant.TenantId!.Value,
                    userId.Value,
                    contentId,
                    request.ProgressValue,
                    request.TotalValue,
                    userId),
                ct);

            return Results.Ok(new ContentProgressResponse(updated.ContentItemId, updated.ProgressValue, updated.TotalValue, updated.UpdatedAt));
        })
        .WithName("UpsertClientContentProgress")
        .WithSummary("Create or update current user's progress for a content item")
        .Produces<ContentProgressResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        return app;
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

    private static IReadOnlyList<CurriculumTreeNode> BuildFilteredTree(
        IReadOnlyList<CurriculumNodeDto> flatNodes,
        HashSet<Guid> allowedNodeIds)
    {
        var flatById = flatNodes.ToDictionary(n => n.Id);
        var includedNodeIds = new HashSet<Guid>(allowedNodeIds);

        foreach (var allowedNodeId in allowedNodeIds)
        {
            var cursor = allowedNodeId;
            while (flatById.TryGetValue(cursor, out var node) && node.ParentId.HasValue)
            {
                var parentId = node.ParentId.Value;
                if (!includedNodeIds.Add(parentId))
                    break;

                cursor = parentId;
            }
        }

        var mapped = flatNodes
            .Where(n => includedNodeIds.Contains(n.Id))
            .ToDictionary(
                n => n.Id,
                n => new CurriculumTreeNode
                {
                    Id = n.Id,
                    TenantId = n.TenantId,
                    ParentId = n.ParentId,
                    NodeType = n.NodeType,
                    Code = n.Code,
                    Title = n.Title,
                    SortOrder = n.SortOrder,
                    Status = n.Status,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt
                });

        var roots = new List<CurriculumTreeNode>();
        foreach (var node in mapped.Values.OrderBy(x => x.SortOrder).ThenBy(x => x.Title))
        {
            if (!node.ParentId.HasValue)
            {
                roots.Add(node);
                continue;
            }

            if (mapped.TryGetValue(node.ParentId.Value, out var parent))
            {
                parent.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        return roots;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
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

    private sealed record UpdateContentProgressRequest(long ProgressValue, long TotalValue);

    private sealed record ContentProgressResponse(Guid ContentId, long ProgressValue, long TotalValue, DateTime? UpdatedAt);

    private sealed record ContentAccessResult(ContentItemDto? Content, IResult? Result)
    {
        public static ContentAccessResult Fail(IResult result) => new(null, result);
    }
}
