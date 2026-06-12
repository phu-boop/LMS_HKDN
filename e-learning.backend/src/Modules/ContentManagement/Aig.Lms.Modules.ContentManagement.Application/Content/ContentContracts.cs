namespace Aig.Lms.Modules.ContentManagement.Application.Content;

public static class MediaProcessingStatuses
{
    public const string NotRequired = "NOT_REQUIRED";
    public const string Queued = "QUEUED";
    public const string Processing = "PROCESSING";
    public const string Ready = "READY";
    public const string Failed = "FAILED";
}

// ── DTOs ────────────────────────────────────────────────────────────────────

public sealed record ContentItemDto(
    Guid Id,
    Guid TenantId,
    Guid CurriculumNodeId,
    string Type,
    string Title,
    string? Description,
    string? FileName,
    string? FilePath,
    string? HlsUrl,
    string? SourceUrl,
    string? MimeType,
    long? FileSizeBytes,
    string PublishStatus,
    DateTime? VisibilityFrom,
    DateTime? VisibilityTo,
    bool IsDownloadable,
    bool WatermarkEnabled,
    int SignedUrlTtl,
    string MediaProcessingStatus,
    string? MediaProcessingError,
    DateTime? MediaProcessingStartedAt,
    DateTime? MediaProcessingCompletedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ContentListItem(
    Guid Id,
    string Type,
    string Title,
    string? Description,
    string? FileName,
    long? FileSizeBytes,
    string PublishStatus,
    DateTime? VisibilityFrom,
    DateTime? VisibilityTo,
    bool IsDownloadable,
    bool IsCommentable,
    bool WatermarkEnabled,
    string MediaProcessingStatus,
    long ProgressValue,
    long TotalValue,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record FavoriteContentItem(
    Guid Id,
    Guid ContentItemId,
    Guid CurriculumNodeId,
    string ContentItemTitle,
    string ContentItemDescription,
    string CurriculumNodeTitle,
    string Type,
    DateTime CreatedAt);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize);

public sealed record ContentProgressDto(
    Guid Id,
    Guid TenantId,
    Guid UserId,
    Guid ContentItemId,
    long ProgressValue,
    long TotalValue,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record QuickAccessItem(
    Guid ContentId,
    string Type,
    string Title,
    Guid CurriculumNodeId,
    string CurriculumNodeTitle,
    bool IsFavorite,
    DateTime? LastViewedAt,
    DateTime? FavoritedAt,
    long ProgressValue,
    long TotalValue,
    string Group);

public sealed record TopSoldContentItemDto(
    long Rank,
    Guid ContentId,
    string ContentTitle,
    Guid CurriculumNodeId,
    string CurriculumNodeShortPath,
    string CurriculumNodeFullPath,
    long SoldCount);

public sealed record ViewedThisWeekDetail(
    Guid ContentId,
    string Title,
    DateTime LastViewedAt);

public sealed record FavoriteDetail(
    Guid ContentId,
    string Title,
    DateTime FavoritedAt);

public sealed record DashboardSummaryDto(
    long ViewedThisWeekCount,
    long FavoriteCount,
    long FavoriteAddedThisWeekCount,
    DateTime? LastLearningAt,
    IReadOnlyList<ViewedThisWeekDetail>? ViewedThisWeekDetails = null,
    IReadOnlyList<FavoriteDetail>? FavoriteDetails = null,
    IReadOnlyList<FavoriteDetail>? FavoriteAddedThisWeekDetails = null);

public sealed record ContentCommentDto(
    Guid Id,
    Guid ContentItemId,
    Guid UserId,
    string? AuthorName,
    string? AvatarUrl,
    Guid? ParentId,
    string? Body,
    bool IsDeleted,
    bool IsDeletedByAdmin,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsPublic,
    bool IsAdmin,
    bool IsEdited,
    bool IsPinned,
    Guid? SchoolId,
    string? ContentTitle,
    string? SchoolName);

public sealed record ContentCommentDetailDto(
    ContentCommentDto Comment,
    IReadOnlyList<ContentCommentDto> Comments);

public sealed record CreateContentCommentCommand(
    Guid TenantId,
    Guid ContentItemId,
    Guid UserId,
    Guid? ParentId,
    string Body,
    bool IsPublic,
    bool IsAdmin,
    bool IsEdited,
    bool IsPinned,
    Guid? SchoolId,
    Guid UpdatedBy);

public sealed record UpdateContentCommentCommand(
    Guid TenantId,
    Guid CommentId,
    string Body,
    Guid UpdatedBy);

public sealed record UpdateContentCommentPinCommand(
    Guid TenantId,
    Guid CommentId,
    bool IsPinned,
    Guid UpdatedBy);

public sealed record UpdateContentCommentVisibilityCommand(
    Guid TenantId,
    Guid CommentId,
    bool IsPublic,
    Guid UpdatedBy);

// ── Queries ──────────────────────────────────────────────────────────────────

public sealed record ListContentsQuery(
    Guid TenantId,
    Guid? NodeId,
    string? Type,
    string? Status,
    string? Search,
    int Page = 1,
    int PageSize = 20,
    Guid? UserId = null);

public sealed record GetContentQuery(Guid TenantId, Guid ContentId);

public sealed record GetUserContentProgressQuery(Guid TenantId, Guid UserId, Guid ContentItemId);

public sealed record ListQuickAccessQuery(
    Guid TenantId,
    Guid UserId,
    IReadOnlyCollection<Guid> AllowedNodeIds,
    DateTime WeekStart,
    DateTime CurrentTime,
    int Page = 1,
    int PageSize = 20);

public sealed record GetDashboardSummaryQuery(
    Guid TenantId,
    Guid UserId,
    IReadOnlyCollection<Guid> AllowedNodeIds,
    DateTime WeekStart,
    DateTime CurrentTime);

// ── Commands ─────────────────────────────────────────────────────────────────

public sealed record CreateContentCommand(
    Guid TenantId,
    Guid CurriculumNodeId,
    string Type,
    string Title,
    string? Description,
    string? FileName,
    string? SourceUrl,
    bool WatermarkEnabled,
    bool IsDownloadable,
    DateTimeOffset? VisibilityFrom,
    DateTimeOffset? VisibilityTo,
    Guid? CreatedBy);

public sealed record CreateContentResult(
    Guid ContentId,
    string? UploadUrl,
    string? ObjectKey,
    DateTimeOffset? UploadExpiresAt);

public sealed record UpdateContentCommand(
    Guid TenantId,
    Guid ContentId,
    Guid CurriculumNodeId,
    string Title,
    string? Description,
    string? FileName,
    string? SourceUrl,
    bool WatermarkEnabled,
    bool IsDownloadable,
    DateTimeOffset? VisibilityFrom,
    DateTimeOffset? VisibilityTo,
    Guid? UpdatedBy);

public sealed record UpdateContentResult(
    ContentItemDto Content,
    string? UploadUrl,
    string? ObjectKey,
    DateTimeOffset? UploadExpiresAt);

public sealed record UpdateContentStatusCommand(
    Guid TenantId,
    Guid ContentId,
    string PublishStatus,
    Guid? UpdatedBy);

public sealed record UpdateContentStatusResult(
    Guid ContentId,
    string PublishStatus,
    DateTime UpdatedAt);

public sealed record ConfirmUploadCommand(
    Guid TenantId,
    Guid ContentId,
    string FileName,
    string? MimeType,
    long? FileSizeBytes,
    string ObjectKey,
    Guid? UpdatedBy);

public sealed record ConfirmUploadResult(
    Guid ContentId,
    string Type,
    string FilePath,
    string? MimeType,
    long FileSizeBytes,
    DateTime UpdatedAt);

public sealed record ContentProcessingStatusDto(
    Guid ContentId,
    string Type,
    string Status,
    string? Error,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    string? HlsUrl);

public interface IMediaProcessingDispatcher
{
    Task EnqueueVideoAsync(Guid tenantId, Guid contentId, string sourceObjectKey, CancellationToken ct = default);
}

public sealed record DeleteContentCommand(Guid TenantId, Guid ContentId, Guid? DeletedBy);

public sealed record UpsertContentProgressCommand(
    Guid TenantId,
    Guid UserId,
    Guid ContentItemId,
    long ProgressValue,
    long TotalValue,
    Guid? UpdatedBy);
