using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.IO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace Aig.Lms.Api.Endpoints;

public static class MediaSignedUrlEndpoints
{
    public static IEndpointRouteBuilder MapMediaSignedUrlEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/contents")
            .WithTags("ContentDelivery")
            .RequireAuthorization("Permission:CURRICULUM_VIEW");

        group.MapGet("/{contentId:guid}/stream-url", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            IMediaUrlBuilder keyBuilder,
            IMediaSigner signer,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            if (!string.Equals(content.Type, "VIDEO", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { error = "stream-url only supports VIDEO content." });

            if (string.Equals(content.MediaProcessingStatus, MediaProcessingStatuses.Queued, StringComparison.OrdinalIgnoreCase)
                || string.Equals(content.MediaProcessingStatus, MediaProcessingStatuses.Processing, StringComparison.OrdinalIgnoreCase))
            {
                return Results.Json(new
                {
                    error = "Video is still processing.",
                    status = content.MediaProcessingStatus
                }, statusCode: StatusCodes.Status409Conflict);
            }

            if (string.Equals(content.MediaProcessingStatus, MediaProcessingStatuses.Failed, StringComparison.OrdinalIgnoreCase))
            {
                return Results.Json(new
                {
                    error = content.MediaProcessingError ?? "Video processing failed.",
                    status = content.MediaProcessingStatus
                }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }

            if (!string.Equals(content.MediaProcessingStatus, MediaProcessingStatuses.Ready, StringComparison.OrdinalIgnoreCase))
            {
                return Results.Json(new
                {
                    error = "Video is not ready for streaming.",
                    status = content.MediaProcessingStatus
                }, statusCode: StatusCodes.Status422UnprocessableEntity);
            }

            var objectKey = string.IsNullOrWhiteSpace(content.HlsUrl)
                ? keyBuilder.BuildHlsMasterKey(currentTenant.TenantId!.Value, contentId)
                : content.HlsUrl!;
            var url = await TrySignAsync(() => signer.SignStreamUrlAsync(contentId, objectKey, ct));
            if (url is null)
                return Results.Problem("Object storage is not configured.", statusCode: 503);

            return Results.Ok(new SignedUrlResponse(url, "stream"));
        })
        .WithName("GetContentStreamUrl")
        .WithSummary("Generate signed HLS stream URL for viewable VIDEO content")
        .Produces<SignedUrlResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapGet("/{contentId:guid}/view-url", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            IMediaSigner signer,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            if (!IsDocumentType(content.Type))
                return Results.BadRequest(new { error = "view-url only supports PDF, SLIDE, or WORD content." });

            if (string.IsNullOrWhiteSpace(content.FilePath))
                return Results.BadRequest(new { error = "Content file has not been uploaded yet." });

            var fileName = ResolveDisplayFileName(content);
            var responseContentType = ResolveResponseContentType(content);
            var responseContentDisposition = BuildInlineContentDisposition(fileName);

            var url = await TrySignAsync(() => signer.SignViewUrlAsync(
                contentId,
                content.FilePath!,
                responseContentType,
                responseContentDisposition,
                ct));
            if (url is null)
                return Results.Problem("Object storage is not configured.", statusCode: 503);

            return Results.Ok(new SignedUrlResponse(url, "view"));
        })
        .WithName("GetContentViewUrl")
        .WithSummary("Generate signed document view URL for permitted PDF/SLIDE/WORD content")
        .Produces<SignedUrlResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapGet("/{contentId:guid}/download-url", async (
            Guid contentId,
            ClaimsPrincipal user,
            HttpContext httpContext,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            ITenantResolutionService tenantResolutionService,
            IMediaSigner signer,
            IAuditLogService auditLogService,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            var permission = access.Permission!;

            if (!content.IsDownloadable || !permission.CanDownload)
                return Results.Forbid();

            if (string.IsNullOrWhiteSpace(content.FilePath))
                return Results.BadRequest(new { error = "Content file has not been uploaded yet." });

            var tenant = await tenantResolutionService.GetByTenantIdAsync(currentTenant.TenantId!.Value, ct);
            if (tenant is null)
                return Results.NotFound();

            var settings = ParseWatermarkSettings(tenant.Branding.WatermarkSettings);
            var accountName = GetUserDisplayName(user);
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var currentTimeUtc = DateTimeOffset.UtcNow;
            var renderedText = RenderWatermarkText(
                settings.Template,
                tenant.Name,
                accountName,
                ipAddress,
                currentTimeUtc);

            var watermarkEnabled = content.WatermarkEnabled && settings.Enabled;
            var downloadId = Guid.NewGuid();

            var baseFileName = ResolveDisplayFileName(content);
            var watermarkedFileName = BuildWatermarkedDownloadFileName(baseFileName, downloadId);
            var responseContentDisposition = BuildAttachmentContentDisposition(watermarkedFileName);

            var url = await TrySignAsync(() => signer.SignDownloadUrlAsync(
                contentId,
                content.FilePath!,
                responseContentDisposition,
                ct));
            if (url is null)
                return Results.Problem("Object storage is not configured.", statusCode: 503);

            var actorUserId = GetUserId(user);
            var auditMetadata = JsonSerializer.Serialize(new
            {
                contentId,
                downloadId,
                watermarkEnabled,
                fileName = watermarkedFileName,
                renderedText,
                template = settings.Template
            });

            await auditLogService.LogAsync(new AuditLogEntry(
                Action: "CONTENT_DOWNLOAD_URL_ISSUED",
                EntityType: "ContentItem",
                EntityId: contentId,
                TenantId: currentTenant.TenantId,
                ActorUserId: actorUserId,
                IpAddress: ipAddress,
                UserAgent: httpContext.Request.Headers.UserAgent.ToString(),
                Metadata: auditMetadata), ct);

            return Results.Ok(new DownloadSignedUrlResponse(
                Url: url,
                Type: "download",
                DownloadId: downloadId,
                WatermarkEnabled: watermarkEnabled,
                CompanyName: tenant.Name,
                AccountName: accountName,
                IpAddress: ipAddress,
                CurrentTimeUtc: currentTimeUtc,
                Template: settings.Template,
                RenderedText: renderedText,
                FileName: watermarkedFileName));
        })
        .WithName("GetContentDownloadUrl")
        .WithSummary("Generate signed download URL with forensic watermark metadata for downloadable content")
        .Produces<DownloadSignedUrlResponse>(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapGet("/{contentId:guid}/watermark-config", async (
            Guid contentId,
            ClaimsPrincipal user,
            HttpContext httpContext,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            ITenantResolutionService tenantResolutionService,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            var tenant = await tenantResolutionService.GetByTenantIdAsync(currentTenant.TenantId!.Value, ct);
            if (tenant is null)
                return Results.NotFound();

            var settings = ParseWatermarkSettings(tenant.Branding.WatermarkSettings);
            var accountName = GetUserDisplayName(user);
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var currentTimeUtc = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7));
            var renderedText = RenderWatermarkText(
                settings.Template,
                tenant.Name,
                accountName,
                ipAddress,
                currentTimeUtc);

            return Results.Ok(new WatermarkConfigResponse(
                content.Id,
                content.WatermarkEnabled && settings.Enabled,
                tenant.Name,
                accountName,
                ipAddress,
                currentTimeUtc,
                settings.Template,
                settings.Opacity,
                settings.FontSize,
                settings.Color,
                settings.Position,
                settings.RefreshIntervalSeconds,
                renderedText));
        })
        .WithName("GetContentWatermarkConfig")
        .WithSummary("Generate dynamic watermark config for permitted content")
        .Produces<WatermarkConfigResponse>(200)
        .ProducesProblem(401)
        .ProducesProblem(403)
        .ProducesProblem(404);

        group.MapGet("/{contentId:guid}/direct-url", async (
            Guid contentId,
            ClaimsPrincipal user,
            ICurrentTenant currentTenant,
            IContentManagementRepository repository,
            CancellationToken ct) =>
        {
            var access = await ResolveContentAccessAsync(contentId, user, currentTenant, repository, ct);
            if (access.Result is not null)
                return access.Result;

            var content = access.Content!;
            if (string.IsNullOrWhiteSpace(content.SourceUrl))
                return Results.BadRequest(new { error = "Content does not have a source URL." });

            // Currently defaulting type to "youtube"; will be extended later
            return Results.Ok(new SignedUrlResponse(content.SourceUrl!, "youtube"));
        })
        .WithName("GetContentDirectUrl")
        .WithSummary("Return the direct source URL for content (e.g., YouTube)")
        .Produces<SignedUrlResponse>(200)
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

    private static bool IsDocumentType(string type)
    {
        return type.Equals("PDF", StringComparison.OrdinalIgnoreCase)
               || type.Equals("SLIDE", StringComparison.OrdinalIgnoreCase)
               || type.Equals("WORD", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveDisplayFileName(ContentItemDto content)
    {
        if (!string.IsNullOrWhiteSpace(content.FileName))
            return content.FileName!;

        if (!string.IsNullOrWhiteSpace(content.FilePath))
            return Path.GetFileName(content.FilePath!);

        return content.Id.ToString("N");
    }

    private static string ResolveResponseContentType(ContentItemDto content)
    {
        var fileName = ResolveDisplayFileName(content);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        // Try extension-based mapping first (more reliable than database mime_type)
        var mimeFromExtension = extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            _ => null
        };

        // If extension mapping worked, use it
        if (mimeFromExtension is not null)
            return mimeFromExtension;

        // Otherwise fall back to database mime type
        if (!string.IsNullOrWhiteSpace(content.MimeType))
            return content.MimeType!;

        // Default for unknown types
        return "application/octet-stream";
    }

    private static string BuildInlineContentDisposition(string fileName)
    {
        var safeFileName = fileName.Replace("\"", "'");
        return $"inline; filename=\"{safeFileName}\"";
    }

    private static string BuildAttachmentContentDisposition(string fileName)
    {
        var safeFileName = fileName.Replace("\"", "'");
        return $"attachment; filename=\"{safeFileName}\"";
    }

    private static string BuildWatermarkedDownloadFileName(string fileName, Guid watermarkId)
    {
        var baseName = Path.GetFileNameWithoutExtension(fileName);
        var extension = Path.GetExtension(fileName);
        var suffix = watermarkId.ToString("N")[..8];
        return string.IsNullOrEmpty(extension)
            ? $"{baseName}__wm_{suffix}"
            : $"{baseName}__wm_{suffix}{extension}";
    }

    private static string GetUserDisplayName(ClaimsPrincipal user)
    {
        return user.FindFirst("full_name")?.Value
               ?? user.FindFirst(ClaimTypes.Name)?.Value
               ?? user.FindFirst(ClaimTypes.GivenName)?.Value
               ?? user.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
               ?? user.Identity?.Name
               ?? "Unknown user";
    }

    private static string RenderWatermarkText(
        string template,
        string companyName,
        string accountName,
        string? ipAddress,
        DateTimeOffset currentTimeUtc)
    {
        var value = string.IsNullOrWhiteSpace(template)
            ? "{company} - {username} - {time}"
            : template;

        return value
            .Replace("{company}", companyName, StringComparison.OrdinalIgnoreCase)
            .Replace("{tenant}", companyName, StringComparison.OrdinalIgnoreCase)
            .Replace("{username}", accountName, StringComparison.OrdinalIgnoreCase)
            .Replace("{account}", accountName, StringComparison.OrdinalIgnoreCase)
            .Replace("{ip_address}", ipAddress ?? string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("{ip}", ipAddress ?? string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("{time}", currentTimeUtc.ToString("yyyy-MM-dd HH:mm:ss UTC"), StringComparison.OrdinalIgnoreCase);
    }

    private static WatermarkSettingsOptions ParseWatermarkSettings(string? rawSettings)
    {
        var defaults = WatermarkSettingsOptions.Default;
        if (string.IsNullOrWhiteSpace(rawSettings))
            return defaults;

        try
        {
            using var document = JsonDocument.Parse(rawSettings);
            var root = document.RootElement;
            if (TryGetPropertyIgnoreCase(root, "watermark", out var watermark) && watermark.ValueKind == JsonValueKind.Object)
            {
                root = watermark;
            }

            return new WatermarkSettingsOptions(
                ReadBoolean(root, "enabled", defaults.Enabled),
                ReadString(root, "template", defaults.Template),
                ReadDouble(root, "opacity", defaults.Opacity),
                ReadInt(root, "fontSize", defaults.FontSize),
                ReadString(root, "color", defaults.Color),
                ReadString(root, "position", defaults.Position),
                ReadInt(root, "refreshIntervalSeconds", defaults.RefreshIntervalSeconds));
        }
        catch (JsonException)
        {
            return defaults;
        }
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static string ReadString(JsonElement element, string propertyName, string fallback)
    {
        return TryReadProperty(element, propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? fallback
            : fallback;
    }

    private static bool ReadBoolean(JsonElement element, string propertyName, bool fallback)
    {
        return TryReadProperty(element, propertyName, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : fallback;
    }

    private static double ReadDouble(JsonElement element, string propertyName, double fallback)
    {
        return TryReadProperty(element, propertyName, out var value) && value.TryGetDouble(out var parsed)
            ? parsed
            : fallback;
    }

    private static int ReadInt(JsonElement element, string propertyName, int fallback)
    {
        if (TryReadProperty(element, propertyName, out var value))
        {
            if (value.TryGetInt32(out var parsed))
                return parsed;

            if (value.TryGetDouble(out var floating))
                return (int)floating;
        }

        return fallback;
    }

    private static bool TryReadProperty(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind == JsonValueKind.Object && TryGetPropertyIgnoreCase(element, propertyName, out value))
            return true;

        value = default;
        return false;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private static bool IsTenantAdmin(ClaimsPrincipal user)
    {
        return user.FindAll(ClaimTypes.Role)
                   .Any(c => string.Equals(c.Value, "TENANT_ADMIN", StringComparison.OrdinalIgnoreCase));
    }

    private sealed record WatermarkSettingsOptions(
        bool Enabled,
        string Template,
        double Opacity,
        int FontSize,
        string Color,
        string Position,
        int RefreshIntervalSeconds)
    {
        public static WatermarkSettingsOptions Default { get; } = new(
            true,
            "{company} - {username} - {time}",
            0.35,
            14,
            "#FFFFFF",
            "random",
            5);
    }

    private sealed record WatermarkConfigResponse(
        Guid ContentId,
        bool Enabled,
        string CompanyName,
        string AccountName,
        string? IpAddress,
        DateTimeOffset CurrentTimeUtc,
        string Template,
        double Opacity,
        int FontSize,
        string Color,
        string Position,
        int RefreshIntervalSeconds,
        string RenderedText);

    private sealed record ContentAccessResult(
        ContentItemDto? Content,
        UserEffectiveNodePermissionDto? Permission,
        IResult? Result)
    {
        public static ContentAccessResult Fail(IResult result) => new(null, null, result);
    }

    private sealed record SignedUrlResponse(string Url, string Type);

    private sealed record DownloadSignedUrlResponse(
        string Url,
        string Type,
        Guid DownloadId,
        bool WatermarkEnabled,
        string CompanyName,
        string AccountName,
        string? IpAddress,
        DateTimeOffset CurrentTimeUtc,
        string Template,
        string RenderedText,
        string FileName);

    private static async Task<string?> TrySignAsync(Func<Task<string>> signAction)
    {
        try
        {
            return await signAction();
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }
}
