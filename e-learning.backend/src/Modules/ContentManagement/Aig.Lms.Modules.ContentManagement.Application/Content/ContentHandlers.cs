using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Domain;

namespace Aig.Lms.Modules.ContentManagement.Application.Content;

public sealed class ListContentsQueryHandler(IContentManagementRepository repository)
{
    public Task<PagedResult<ContentListItem>> HandleAsync(ListContentsQuery query, CancellationToken ct = default)
        => repository.ListContentsAsync(query, ct);
}

public sealed class GetContentQueryHandler(IContentManagementRepository repository)
{
    public Task<ContentItemDto?> HandleAsync(GetContentQuery query, CancellationToken ct = default)
        => repository.GetContentAsync(query.TenantId, query.ContentId, ct);
}

public sealed class CreateContentCommandHandler(
    IContentManagementRepository repository,
    IUploadSessionService uploadSessionService,
    IAuditLogService auditLog)
{
    private readonly IAuditLogService _auditLog = auditLog;
    private static readonly IReadOnlySet<string> ValidTypes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "VIDEO", "PDF", "SLIDE", "WORD", "URL" };

    public async Task<CreateContentResult> HandleAsync(CreateContentCommand command, CancellationToken ct = default)
    {
        if (!ValidTypes.Contains(command.Type))
            throw new InvalidOperationException($"Invalid content type '{command.Type}'. Must be one of: VIDEO, PDF, SLIDE, WORD, URL.");

        if (command.Type.Equals("URL", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(command.SourceUrl))
                throw new InvalidOperationException("Source URL is required for content type URL.");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(command.FileName))
                throw new InvalidOperationException("File name is required for non-URL content types.");
        }

        // Validate node belongs to tenant
        var node = await repository.GetNodeAsync(command.TenantId, command.CurriculumNodeId, ct);
        if (node is null)
            throw new InvalidOperationException("Curriculum node not found.");

        var item = ContentItem.Create(
            tenantId: command.TenantId,
            curriculumNodeId: command.CurriculumNodeId,
            type: command.Type.ToUpperInvariant(),
            title: command.Title.Trim(),
            description: command.Description?.Trim(),
            fileName: command.FileName,
            filePath: null,
            sourceUrl: command.SourceUrl,
            watermarkEnabled: command.WatermarkEnabled,
            isDownloadable: command.IsDownloadable,
            visibilityFrom: command.VisibilityFrom,
            visibilityTo: command.VisibilityTo,
            createdBy: command.CreatedBy);

        await repository.CreateContentAsync(item, ct);

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CONTENT_CREATED",
            EntityType:  "ContentItem",
            EntityId:    item.Id,
            TenantId:    item.TenantId,
            ActorUserId: command.CreatedBy,
            Metadata:    $"{{\"curriculumNodeId\":\"{item.CurriculumNodeId}\",\"type\":\"{item.Type}\"}}"),
            ct);

        // For URL type no upload needed
        if (command.Type.Equals("URL", StringComparison.OrdinalIgnoreCase))
            return new CreateContentResult(item.Id, null, null, null);

        var session = await uploadSessionService.CreateUploadSessionAsync(
            command.TenantId, item.Id, command.FileName!, ct);

        return new CreateContentResult(
            item.Id,
            session.UploadUrl,
            session.ObjectKey,
            session.ExpiresAtUtc);
    }
}

public sealed class UpdateContentCommandHandler(
    IContentManagementRepository repository,
    IUploadSessionService uploadSessionService,
    IAuditLogService auditLog)
{
    private readonly IContentManagementRepository _repository = repository;
    private readonly IUploadSessionService _uploadSessionService = uploadSessionService;
    private readonly IAuditLogService _auditLog = auditLog;

    public async Task<UpdateContentResult> HandleAsync(UpdateContentCommand command, CancellationToken ct = default)
    {
        // Validate node belongs to tenant
        var node = await _repository.GetNodeAsync(command.TenantId, command.CurriculumNodeId, ct);
        if (node is null)
            throw new InvalidOperationException("Curriculum node not found.");

        var startUpload = !string.IsNullOrWhiteSpace(command.FileName);
        if (startUpload)
        {
            var existingContent = await _repository.GetContentAsync(command.TenantId, command.ContentId, ct);
            if (existingContent is null)
                throw new InvalidOperationException("Content not found.");

            if (existingContent.Type.Equals("URL", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Cannot upload a file for URL content type.");
        }

        var result = await _repository.UpdateContentAsync(command, ct);
        if (result is null)
            throw new InvalidOperationException("Content not found.");

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CONTENT_UPDATED",
            EntityType:  "ContentItem",
            EntityId:    command.ContentId,
            TenantId:    command.TenantId,
            ActorUserId: command.UpdatedBy),
            ct);

        if (!startUpload)
            return new UpdateContentResult(result, null, null, null);

        var session = await _uploadSessionService.CreateUploadSessionAsync(
            command.TenantId,
            command.ContentId,
            command.FileName!.Trim(),
            ct);

        return new UpdateContentResult(
            result,
            session.UploadUrl,
            session.ObjectKey,
            session.ExpiresAtUtc);
    }
}

public sealed class UpdateContentStatusCommandHandler(
    IContentManagementRepository repository,
    IAuditLogService auditLog)
{
    private readonly IAuditLogService _auditLog = auditLog;
    private static readonly IReadOnlySet<string> ValidStatuses =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "DRAFT", "PUBLISHED", "ARCHIVED" };

    public async Task<UpdateContentStatusResult> HandleAsync(UpdateContentStatusCommand command, CancellationToken ct = default)
    {
        if (!ValidStatuses.Contains(command.PublishStatus))
            throw new InvalidOperationException($"Invalid status '{command.PublishStatus}'. Must be DRAFT, PUBLISHED, or ARCHIVED.");

        var result = await repository.UpdateContentStatusAsync(command, ct);
        if (result is null)
            throw new InvalidOperationException("Content not found.");

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CONTENT_STATUS_UPDATED",
            EntityType:  "ContentItem",
            EntityId:    command.ContentId,
            TenantId:    command.TenantId,
            ActorUserId: command.UpdatedBy,
            Metadata:    $"{{\"publishStatus\":\"{command.PublishStatus}\"}}"),
            ct);

        return result;
    }
}

public sealed class ConfirmUploadCommandHandler(
    IContentManagementRepository repository,
    IUploadSessionService uploadSessionService,
    IMediaProcessingDispatcher mediaProcessingDispatcher,
    IAuditLogService auditLog)
{
    private readonly IAuditLogService _auditLog = auditLog;

    public async Task<ConfirmUploadResult> HandleAsync(ConfirmUploadCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.FileName))
            throw new InvalidOperationException("fileName is required.");

        if (string.IsNullOrWhiteSpace(command.ObjectKey))
            throw new InvalidOperationException("objectKey is required.");

        var expectedPrefix = $"tenants/{command.TenantId}/contents/{command.ContentId}/";
        if (!command.ObjectKey.StartsWith(expectedPrefix, StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid objectKey for tenant/content scope.");

        var objectMetadata = await uploadSessionService.GetUploadedObjectMetadataAsync(command.ObjectKey, ct);
        if (objectMetadata is null)
            throw new InvalidOperationException("Uploaded object metadata not found.");

        var verifiedCommand = command with
        {
            FileSizeBytes = objectMetadata.SizeBytes,
            MimeType = string.IsNullOrWhiteSpace(objectMetadata.MimeType)
                ? command.MimeType
                : objectMetadata.MimeType
        };

        var result = await repository.ConfirmUploadAsync(verifiedCommand, ct);
        if (result is null)
            throw new InvalidOperationException("Content not found.");

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CONTENT_UPLOAD_CONFIRMED",
            EntityType:  "ContentItem",
            EntityId:    command.ContentId,
            TenantId:    command.TenantId,
            ActorUserId: command.UpdatedBy,
            Metadata:    $"{{\"fileName\":\"{command.FileName}\"}}"),
            ct);

        if (result.Type.Equals("VIDEO", StringComparison.OrdinalIgnoreCase))
        {
            await repository.MarkMediaProcessingQueuedAsync(command.TenantId, command.ContentId, ct);

            try
            {
                await mediaProcessingDispatcher.EnqueueVideoAsync(
                    command.TenantId,
                    command.ContentId,
                    result.FilePath,
                    ct);
            }
            catch (Exception ex)
            {
                await repository.MarkMediaProcessingFailedAsync(
                    command.TenantId,
                    command.ContentId,
                    $"Failed to enqueue processing job: {ex.Message}",
                    ct);
            }
        }

        return result;
    }
}

public sealed class DeleteContentCommandHandler(
    IContentManagementRepository repository,
    IAuditLogService auditLog)
{
    private readonly IAuditLogService _auditLog = auditLog;

    public async Task HandleAsync(DeleteContentCommand command, CancellationToken ct = default)
    {
        var deleted = await repository.DeleteContentAsync(command.TenantId, command.ContentId, ct);
        if (!deleted)
            throw new InvalidOperationException("Content not found.");

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CONTENT_DELETED",
            EntityType:  "ContentItem",
            EntityId:    command.ContentId,
            TenantId:    command.TenantId,
            ActorUserId: command.DeletedBy),
            ct);
    }
}
