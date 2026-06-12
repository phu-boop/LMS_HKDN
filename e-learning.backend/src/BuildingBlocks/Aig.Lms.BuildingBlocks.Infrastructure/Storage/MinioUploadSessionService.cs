using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class MinioUploadSessionService : IUploadSessionService
{
    private readonly IObjectStorage _objectStorage;
    private readonly ObjectStorageOptions _options;

    public MinioUploadSessionService(IObjectStorage objectStorage, ObjectStorageOptions options)
    {
        _objectStorage = objectStorage;
        _options = options;
    }

    public async Task<UploadSessionResult> CreateUploadSessionAsync(
        Guid tenantId,
        Guid contentId,
        string fileName,
        CancellationToken ct = default)
    {
        var safeFileName = Path.GetFileName(fileName); // strip any path traversal
        var objectKey = $"tenants/{tenantId}/contents/{contentId}/{safeFileName}";
        var ttl = TimeSpan.FromSeconds(_options.UploadUrlTtlSeconds);

        var uploadUrl = await _objectStorage.GetPresignedPutUrlAsync(
            _options.ContentBucket, objectKey, ttl, ct);

        return new UploadSessionResult(
            UploadUrl: uploadUrl,
            ExpiresAtUtc: DateTimeOffset.UtcNow.Add(ttl),
            ObjectKey: objectKey,
            Bucket: _options.ContentBucket);
    }

    public async Task<UploadedObjectMetadata> GetUploadedObjectMetadataAsync(
        string objectKey,
        CancellationToken ct = default)
    {
        var metadata = await _objectStorage.GetObjectMetadataAsync(_options.ContentBucket, objectKey, ct);
        return new UploadedObjectMetadata(metadata.SizeBytes, metadata.ContentType);
    }
}
