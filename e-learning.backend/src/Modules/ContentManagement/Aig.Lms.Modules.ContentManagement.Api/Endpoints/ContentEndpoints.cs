using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.ContentManagement.Api.Endpoints;

public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContentItemEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tenants/{tenantId:guid}/contents")
            .WithTags("Contents")
            .RequireAuthorization();

        // GET /api/tenants/{tenantId}/contents
        group.MapGet("/", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromQuery] Guid? nodeId,
            [FromQuery] string? type,
            [FromQuery] string? status,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromServices] ListContentsQueryHandler handler = default!,
            CancellationToken ct = default) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var result = await handler.HandleAsync(new ListContentsQuery(
                tenantId, nodeId, type, status, search, page, pageSize), ct);

            return Results.Ok(result);
        })
        .WithName("ListContents")
        .WithSummary("List content items with optional filters")
        .Produces<PagedResult<ContentListItem>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_VIEW");

        // GET /api/tenants/{tenantId}/contents/{contentId}
        group.MapGet("/{contentId:guid}", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] GetContentQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var result = await handler.HandleAsync(new GetContentQuery(tenantId, contentId), ct);
            return result is null ? Results.NotFound() : Results.Ok(result);
        })
        .WithName("GetContent")
        .WithSummary("Get a single content item")
        .Produces<ContentItemDto>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:CURRICULUM_VIEW");

        // POST /api/tenants/{tenantId}/contents
        group.MapPost("/", async (
            Guid tenantId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] CreateContentRequest body,
            [FromServices] CreateContentCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new CreateContentCommand(
                    tenantId,
                    body.CurriculumNodeId,
                    body.Type,
                    body.Title,
                    body.Description,
                    body.FileName,
                    body.SourceUrl,
                    body.WatermarkEnabled,
                    body.IsDownloadable,
                    body.VisibilityFrom,
                    body.VisibilityTo,
                    userId), ct);

                return Results.Created(
                    $"/api/tenants/{tenantId}/contents/{result.ContentId}",
                    result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("CreateContent")
        .WithSummary("Create a content item and get a presigned upload URL")
        .Produces<CreateContentResult>(201)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        // PUT /api/tenants/{tenantId}/contents/{contentId}
        group.MapPut("/{contentId:guid}", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] UpdateContentRequest body,
            [FromServices] UpdateContentCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new UpdateContentCommand(
                    tenantId,
                    contentId,
                    body.CurriculumNodeId,
                    body.Title,
                    body.Description,
                    body.FileName,
                    body.SourceUrl,
                    body.WatermarkEnabled,
                    body.IsDownloadable,
                    body.VisibilityFrom,
                    body.VisibilityTo,
                    userId), ct);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateContent")
        .WithSummary("Update content metadata or request a new file upload session")
        .Produces<UpdateContentResult>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        // PATCH /api/tenants/{tenantId}/contents/{contentId}/status
        group.MapPatch("/{contentId:guid}/status", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] UpdateContentStatusRequest body,
            [FromServices] UpdateContentStatusCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new UpdateContentStatusCommand(
                    tenantId, contentId, body.PublishStatus, userId), ct);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateContentStatus")
        .WithSummary("Publish, unpublish, or archive a content item")
        .Produces<UpdateContentStatusResult>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        // GET /api/tenants/{tenantId}/contents/{contentId}/processing-status
        group.MapGet("/{contentId:guid}/processing-status", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] GetContentQueryHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var content = await handler.HandleAsync(new GetContentQuery(tenantId, contentId), ct);
            if (content is null)
                return Results.NotFound();

            return Results.Ok(new ContentProcessingStatusDto(
                ContentId: content.Id,
                Type: content.Type,
                Status: content.MediaProcessingStatus,
                Error: content.MediaProcessingError,
                StartedAt: content.MediaProcessingStartedAt,
                CompletedAt: content.MediaProcessingCompletedAt,
                HlsUrl: content.HlsUrl));
        })
        .WithName("GetContentProcessingStatus")
        .WithSummary("Get video processing status for a content item")
        .Produces<ContentProcessingStatusDto>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:CURRICULUM_VIEW");

        // POST /api/tenants/{tenantId}/contents/{contentId}/reprocess
        group.MapPost("/{contentId:guid}/reprocess", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] GetContentQueryHandler getContentHandler,
            [FromServices] IContentManagementRepository repository,
            [FromServices] IMediaProcessingDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var content = await getContentHandler.HandleAsync(new GetContentQuery(tenantId, contentId), ct);
            if (content is null)
                return Results.NotFound();

            if (!content.Type.Equals("VIDEO", StringComparison.OrdinalIgnoreCase))
                return Results.UnprocessableEntity(new { error = "Only VIDEO content can be reprocessed." });

            if (string.IsNullOrWhiteSpace(content.FilePath))
                return Results.UnprocessableEntity(new { error = "Source file path is missing. Confirm upload before reprocessing." });

            await repository.MarkMediaProcessingQueuedAsync(tenantId, contentId, ct);
            await dispatcher.EnqueueVideoAsync(tenantId, contentId, content.FilePath, ct);

            return Results.Accepted(
                $"/api/tenants/{tenantId}/contents/{contentId}/processing-status",
                new
                {
                    contentId,
                    status = MediaProcessingStatuses.Queued
                });
        })
        .WithName("ReprocessContentVideo")
        .WithSummary("Manually requeue video processing for a content item")
        .Produces(202)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404)
        .ProducesProblem(422)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        // POST /api/tenants/{tenantId}/contents/{contentId}/upload
        group.MapPost("/{contentId:guid}/upload", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromBody] ConfirmUploadRequest body,
            [FromServices] ConfirmUploadCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var userId = GetUserId(user);

            try
            {
                var result = await handler.HandleAsync(new ConfirmUploadCommand(
                    tenantId,
                    contentId,
                    body.FileName,
                    body.MimeType,
                    body.FileSizeBytes,
                    body.ObjectKey,
                    userId), ct);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ConfirmUpload")
        .WithSummary("Confirm upload and persist verified metadata from object storage")
        .Produces<ConfirmUploadResult>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .RequireAuthorization("Permission:CURRICULUM_MANAGE");

        // DELETE /api/tenants/{tenantId}/contents/{contentId}
        group.MapDelete("/{contentId:guid}", async (
            Guid tenantId,
            Guid contentId,
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            [FromServices] DeleteContentCommandHandler handler,
            CancellationToken ct) =>
        {
            var scopeError = EnsureTenantScope(currentTenant, user, tenantId);
            if (scopeError is not null) return scopeError;

            var userId = GetUserId(user);

            try
            {
                await handler.HandleAsync(new DeleteContentCommand(tenantId, contentId, userId), ct);
                return Results.NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("DeleteContent")
        .WithSummary("Soft-delete a content item")
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

// ── Request models ────────────────────────────────────────────────────────────

public sealed record CreateContentRequest(
    Guid CurriculumNodeId,
    string Type,
    string Title,
    string? Description,
    string? FileName,
    string? SourceUrl,
    bool WatermarkEnabled = true,
    bool IsDownloadable = false,
    DateTimeOffset? VisibilityFrom = null,
    DateTimeOffset? VisibilityTo = null);

public sealed record UpdateContentRequest(
    Guid CurriculumNodeId,
    string Title,
    string? Description,
    string? FileName,
    string? SourceUrl,
    bool WatermarkEnabled,
    bool IsDownloadable,
    DateTimeOffset? VisibilityFrom,
    DateTimeOffset? VisibilityTo);

public sealed record UpdateContentStatusRequest(string PublishStatus);

public sealed record ConfirmUploadRequest(
    string FileName,
    string ObjectKey,
    string? MimeType,
    long? FileSizeBytes);
