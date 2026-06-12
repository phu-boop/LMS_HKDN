namespace Aig.Lms.Modules.ContentManagement.Domain;

public sealed class ContentItem
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid CurriculumNodeId { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? FileName { get; private set; }
    public string? FilePath { get; private set; }
    public string? SourceUrl { get; private set; }
    public string? MimeType { get; private set; }
    public long? FileSizeBytes { get; private set; }
    public string PublishStatus { get; private set; } = "DRAFT";
    public DateTimeOffset? VisibilityFrom { get; private set; }
    public DateTimeOffset? VisibilityTo { get; private set; }
    public bool IsDownloadable { get; private set; }
    public bool WatermarkEnabled { get; private set; }
    public int SignedUrlTtl { get; private set; } = 3600;
    public bool IsDeleted { get; private set; }
    public Guid? CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? UpdatedBy { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public static ContentItem Create(
        Guid tenantId,
        Guid curriculumNodeId,
        string type,
        string title,
        string? description,
        string? fileName,
        string? filePath,
        string? sourceUrl,
        bool watermarkEnabled,
        bool isDownloadable,
        DateTimeOffset? visibilityFrom,
        DateTimeOffset? visibilityTo,
        Guid? createdBy)
    {
        return new ContentItem
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CurriculumNodeId = curriculumNodeId,
            Type = type,
            Title = title,
            Description = description,
            FileName = fileName,
            FilePath = filePath,
            SourceUrl = sourceUrl,
            WatermarkEnabled = watermarkEnabled,
            IsDownloadable = isDownloadable,
            PublishStatus = "DRAFT",
            VisibilityFrom = visibilityFrom,
            VisibilityTo = visibilityTo,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };
    }
}
