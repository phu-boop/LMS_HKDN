using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class TenantCommentEndpoints
{
    public static IEndpointRouteBuilder MapTenantCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tenants/comments")
            .WithTags("Tenant Comments")
            .RequireAuthorization();

        group.MapGet("", async (
            Guid? userId,
            Guid? schoolId,
            Guid? contentId,
            string? search,
            bool? isAdmin,
            bool? isPublic,
            bool? isPinned,
            string? sortOrder,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct = default,
            int page = 1,
            int pageSize = 20) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var result = await repository.ListTenantCommentsAsync(
                tenantId.Value,
                userId,
                schoolId,
                contentId,
                string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
                isAdmin,
                isPublic,
                isPinned,
                sortOrder,
                page,
                pageSize,
                ct);

            var items = result.Items.Select(c => new TenantContentCommentResponse(
                c.Id,
                c.ContentItemId,
                c.UserId,
                c.AuthorName,
                c.AvatarUrl,
                c.ParentId,
                c.Body,
                c.IsDeleted,
                c.IsDeletedByAdmin,
                c.CreatedAt,
                c.UpdatedAt,
                c.IsPublic,
                c.IsAdmin,
                c.IsEdited,
                c.IsPinned,
                c.SchoolId,
                c.ContentTitle,
                c.SchoolName)).ToList();

            return Results.Ok(new PagedResult<TenantContentCommentResponse>(items, result.TotalCount, result.Page, result.PageSize));
        })
        .WithName("GetTenantContentComments")
        .WithSummary("List tenant comments with optional user, school, content and search filters")
        .Produces<PagedResult<TenantContentCommentResponse>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/contents", async (
            string? search,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct,
            int page = 1,
            int pageSize = 100) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var result = await repository.ListContentsAsync(
                new ListContentsQuery(
                    tenantId.Value,
                    null,
                    null,
                    null,
                    string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
                    page,
                    pageSize),
                ct);

            var items = result.Items.Select(c => new TenantContentFilterItem(c.Id, c.Title)).ToList();
            return Results.Ok(new PagedResult<TenantContentFilterItem>(items, result.TotalCount, result.Page, result.PageSize));
        })
        .WithName("GetTenantContentsForCommentFilter")
        .WithSummary("List tenant contents for tenant admin comment filtering")
        .Produces<PagedResult<TenantContentFilterItem>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/{commentId:guid}", async (
            Guid commentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var details = await repository.GetContentCommentDetailsAsync(tenantId.Value, commentId, ct);
            if (details is null)
                return Results.NotFound();

            var comments = details.Comments
                .Select(ToContentCommentResponse)
                .ToList();

            return Results.Ok(new TenantContentCommentDetailResponse(
                details.Comment.Id,
                details.Comment.ContentItemId,
                details.Comment.ContentTitle,
                details.Comment.SchoolId,
                details.Comment.SchoolName,
                comments));
        })
        .WithName("GetTenantCommentDetails")
        .WithSummary("Get detailed tenant comment information including parent chain and child replies")
        .Produces<TenantContentCommentDetailResponse>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPut("/{commentId:guid}/pin", async (
            Guid commentId,
            UpdateTenantCommentPinRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var updated = await repository.SetContentCommentPinnedAsync(
                tenantId.Value,
                commentId,
                request.IsPinned,
                userId.Value,
                ct);

            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("SetTenantCommentPinned")
        .WithSummary("Pin or unpin a top-level tenant comment")
        .Produces(204)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPut("/{commentId:guid}/visibility", async (
            Guid commentId,
            UpdateTenantCommentVisibilityRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var updated = await repository.SetContentCommentVisibilityAsync(
                tenantId.Value,
                commentId,
                request.IsPublic,
                userId.Value,
                ct);

            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("SetTenantCommentVisibility")
        .WithSummary("Change tenant comment visibility between private and public")
        .Produces(204)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPut("/{commentId:guid}", async (
            Guid commentId,
            UpdateTenantCommentRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Results.BadRequest(new { error = "Comment body is required." });

            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var existing = await repository.GetContentCommentAsync(tenantId.Value, commentId, ct);
            if (existing is null)
                return Results.NotFound();

            if (existing.UserId != userId.Value)
                return Results.Forbid();

            var updated = await repository.UpdateContentCommentAsync(new UpdateContentCommentCommand(
                tenantId.Value,
                commentId,
                request.Body.Trim(),
                userId.Value),
                ct);

            if (!updated)
                return Results.NotFound();

            var refreshed = await repository.GetContentCommentAsync(tenantId.Value, commentId, ct);
            if (refreshed is null)
                return Results.NotFound();

            return Results.Ok(ToTenantContentCommentResponse(refreshed));
        })
        .WithName("UpdateTenantContentComment")
        .WithSummary("Update a tenant comment authored by the current tenant admin")
        .Produces<TenantContentCommentResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPost("/{parentCommentId:guid}/reply", async (
            Guid parentCommentId,
            CreateTenantCommentReplyRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Results.BadRequest(new { error = "Comment body is required." });

            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var parent = await repository.GetContentCommentAsync(tenantId.Value, parentCommentId, ct);
            if (parent is null)
                return Results.BadRequest(new { error = "Parent comment not found." });

            var replyId = await repository.CreateContentCommentAsync(new CreateContentCommentCommand(
                tenantId.Value,
                parent.ContentItemId,
                userId.Value,
                parentCommentId,
                request.Body.Trim(),
                false,
                true,
                false,
                false,
                parent.SchoolId,
                userId.Value),
                ct);

            var created = await repository.GetContentCommentAsync(tenantId.Value, replyId, ct);
            if (created is null)
                return Results.Problem("Failed to load created comment.");

            return Results.Created($"/api/tenants/comments/{replyId}", new TenantContentCommentResponse(
                created.Id,
                created.ContentItemId,
                created.UserId,
                created.AuthorName,
                created.AvatarUrl,
                created.ParentId,
                created.Body,
                created.IsDeleted,
                created.IsDeletedByAdmin,
                created.CreatedAt,
                created.UpdatedAt,
                created.IsPublic,
                created.IsAdmin,
                created.IsEdited,
                created.IsPinned,
                created.SchoolId,
                created.ContentTitle,
                created.SchoolName));
        })
        .WithName("CreateTenantCommentReply")
        .WithSummary("Create a reply comment as a tenant admin")
        .Produces<TenantContentCommentResponse>(201)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapDelete("/{commentId:guid}", async (
            Guid commentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            if (!IsTenantAdmin(user))
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var deleted = await repository.DeleteContentCommentAsTenantAdminAsync(
                tenantId.Value,
                commentId,
                userId.Value,
                ct);

            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteTenantContentComment")
        .WithSummary("Delete a tenant comment as a tenant admin")
        .Produces(204)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        return app;
    }

    private static Guid? ResolveTenantId(ICurrentTenant currentTenant, ClaimsPrincipal user)
    {
        if (currentTenant.TenantId.HasValue)
            return currentTenant.TenantId.Value;

        var tenantClaim = user.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantIdFromClaim))
            return tenantIdFromClaim;

        return null;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var userId) ? userId : null;
    }

    private static bool IsTenantAdmin(ClaimsPrincipal user)
    {
        return user.FindAll(ClaimTypes.Role)
                   .Any(c => string.Equals(c.Value, "TENANT_ADMIN", StringComparison.OrdinalIgnoreCase));
    }

    private static ContentCommentResponse ToContentCommentResponse(ContentCommentDto c)
        => new(
            c.Id,
            c.ContentItemId,
            c.UserId,
            c.AuthorName,
            c.AvatarUrl,
            c.ParentId,
            c.Body,
            c.IsDeletedByAdmin,
            c.CreatedAt,
            c.UpdatedAt,
            c.IsPublic,
            c.IsAdmin,
            c.IsEdited,
            c.IsPinned,
            c.SchoolId);

    private static TenantContentCommentResponse ToTenantContentCommentResponse(ContentCommentDto c)
        => new(
            c.Id,
            c.ContentItemId,
            c.UserId,
            c.AuthorName,
            c.AvatarUrl,
            c.ParentId,
            c.Body,
            c.IsDeleted,
            c.IsDeletedByAdmin,
            c.CreatedAt,
            c.UpdatedAt,
            c.IsPublic,
            c.IsAdmin,
            c.IsEdited,
            c.IsPinned,
            c.SchoolId,
            c.ContentTitle,
            c.SchoolName);

    private sealed record TenantContentFilterItem(Guid Id, string Title);
    private sealed record CreateTenantCommentReplyRequest(string Body);
    private sealed record UpdateTenantCommentPinRequest(bool IsPinned);
    private sealed record UpdateTenantCommentVisibilityRequest(bool IsPublic);
    private sealed record UpdateTenantCommentRequest(string Body);
}
