namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class ObjectStorageOptions
{
    public string Endpoint { get; init; } = string.Empty;
    public bool UseSSL { get; init; } = true;
    public string AccessKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public string ContentBucket { get; init; } = "lms-content";
    public string HlsBucket { get; init; } = "lms-hls";
    public string ThumbBucket { get; init; } = "lms-thumb";
    public int StreamUrlTtlSeconds { get; init; } = 3600;
    public int ViewUrlTtlSeconds { get; init; } = 3600;
    public int DownloadUrlTtlSeconds { get; init; } = 300;
    public int UploadUrlTtlSeconds { get; init; } = 3600;
}
