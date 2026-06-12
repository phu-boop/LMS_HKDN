using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Linq;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class ClientContentCommentEndpoints
{
    public static IEndpointRouteBuilder MapClientContentCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/contents")
            .WithTags("ContentDelivery")
            .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapGet("/{contentId:guid}/comments", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var userSchoolId = GetUserSchoolId(user);
            var comments = await repository.ListContentCommentsAsync(currentTenant.TenantId!.Value, contentId, userSchoolId, ct);
            return Results.Ok(comments.Select(c => new ContentCommentResponse(
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
                c.SchoolId)));
        })
        .WithName("GetClientContentComments")
        .WithSummary("List approved comments for an accessible content item")
        .Produces<IReadOnlyList<ContentCommentResponse>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPost("/{contentId:guid}/comments", async (
            Guid contentId,
            CreateContentCommentRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Results.BadRequest(new { error = "Comment body is required." });

            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            if (!access.Permission!.CanComment)
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            if (request.ParentId.HasValue)
            {
                var parent = await repository.GetContentCommentAsync(currentTenant.TenantId!.Value, request.ParentId.Value, ct);
                if (parent is null || parent.ContentItemId != contentId)
                    return Results.BadRequest(new { error = "Invalid parent comment." });
            }

            var userSchoolId = GetUserSchoolId(user);
            var commentId = await repository.CreateContentCommentAsync(new CreateContentCommentCommand(
                currentTenant.TenantId!.Value,
                contentId,
                userId.Value,
                request.ParentId,
                request.Body.Trim(),
                false,
                false,
                false,
                false,
                userSchoolId,
                userId.Value),
                ct);

            var created = await repository.GetContentCommentAsync(currentTenant.TenantId.Value, commentId, ct);
            if (created is null)
                return Results.Problem("Failed to load created comment.");

            return Results.Created($"/api/client/contents/{contentId}/comments/{commentId}", new ContentCommentResponse(
                created.Id,
                created.ContentItemId,
                created.UserId,
                created.AuthorName,
                created.AvatarUrl,
                created.ParentId,
                created.Body,
                created.IsDeletedByAdmin,
                created.CreatedAt,
                created.UpdatedAt,
                created.IsPublic,
                created.IsAdmin,
                created.IsEdited,
                created.IsPinned,
                created.SchoolId));
        })
        .WithName("CreateClientContentComment")
        .WithSummary("Create a comment for an accessible content item when the user has comment permission")
        .Produces<ContentCommentResponse>(201)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapPut("/{contentId:guid}/comments/{commentId:guid}", async (
            Guid contentId,
            Guid commentId,
            UpdateContentCommentRequest request,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Body))
                return Results.BadRequest(new { error = "Comment body is required." });

            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            if (!access.Permission!.CanComment)
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var existing = await repository.GetContentCommentAsync(currentTenant.TenantId!.Value, commentId, ct);
            if (existing is null || existing.ContentItemId != contentId)
                return Results.NotFound();

            if (existing.UserId != userId.Value)
                return Results.Forbid();

            var updated = await repository.UpdateContentCommentAsync(new UpdateContentCommentCommand(
                currentTenant.TenantId.Value,
                commentId,
                request.Body.Trim(),
                userId.Value),
                ct);

            if (!updated)
                return Results.NotFound();

            var refreshed = await repository.GetContentCommentAsync(currentTenant.TenantId.Value, commentId, ct);
            if (refreshed is null)
                return Results.NotFound();

            return Results.Ok(new ContentCommentResponse(
                refreshed.Id,
                refreshed.ContentItemId,
                refreshed.UserId,
                refreshed.AuthorName,
                refreshed.AvatarUrl,
                refreshed.ParentId,
                refreshed.Body,
                refreshed.IsDeletedByAdmin,
                refreshed.CreatedAt,
                refreshed.UpdatedAt,
                refreshed.IsPublic,
                refreshed.IsAdmin,
                refreshed.IsEdited,
                refreshed.IsPinned,
                refreshed.SchoolId));
        })
        .WithName("UpdateClientContentComment")
        .WithSummary("Update a comment created by the current user or by a tenant admin")
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapDelete("/{contentId:guid}/comments/{commentId:guid}", async (
            Guid contentId,
            Guid commentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            if (!access.Permission!.CanComment)
                return Results.Forbid();

            var userId = GetUserId(user);
            if (!userId.HasValue)
                return Results.Unauthorized();

            var existing = await repository.GetContentCommentAsync(currentTenant.TenantId!.Value, commentId, ct);
            if (existing is null || existing.ContentItemId != contentId)
                return Results.NotFound();

            if (existing.UserId != userId.Value)
                return Results.Forbid();

            var deleted = await repository.DeleteContentCommentAsync(currentTenant.TenantId.Value, commentId, userId.Value, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteClientContentComment")
        .WithSummary("Delete a comment created by the current user or by a tenant admin")
        .Produces(204)
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

        if (IsTenantAdmin(user))
        {
            var adminPermission = new UserEffectiveNodePermissionDto(
                content.CurriculumNodeId,
                CanView: true,
                CanDownload: true,
                CanComment: true);
            return new ContentAccessResult(content, adminPermission, null);
        }

        if (!IsContentVisibleNow(content))
            return ContentAccessResult.Fail(Results.NotFound());

        var permissions = await repository.ListEffectivePermissionsForUserAsync(
            new UserEffectivePermissionsQuery(currentTenant.TenantId.Value, userId.Value),
            ct);

        var permission = permissions.FirstOrDefault(p => p.CurriculumNodeId == content.CurriculumNodeId);
        if (permission is null || !permission.CanView)
            return ContentAccessResult.Fail(Results.Forbid());

        return new ContentAccessResult(content, permission, null);
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

    private static Guid? GetUserSchoolId(ClaimsPrincipal user)
    {
        var schoolIdValue = user.FindFirst("school_id")?.Value;
        return Guid.TryParse(schoolIdValue, out var schoolId) ? schoolId : null;
    }

    private static bool IsTenantAdmin(ClaimsPrincipal user)
    {
        return user.FindAll(ClaimTypes.Role)
                   .Any(c => string.Equals(c.Value, "TENANT_ADMIN", StringComparison.OrdinalIgnoreCase));
    }

    private sealed record ContentAccessResult(ContentItemDto? Content, UserEffectiveNodePermissionDto? Permission, IResult? Result)
    {
        public static ContentAccessResult Fail(IResult result) => new(null, null, result);
    }

    private sealed record CreateContentCommentRequest(string Body, Guid? ParentId);
    private sealed record UpdateContentCommentRequest(string Body);
}
