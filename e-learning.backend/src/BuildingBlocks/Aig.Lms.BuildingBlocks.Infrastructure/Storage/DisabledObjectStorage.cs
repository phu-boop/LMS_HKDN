using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class DisabledObjectStorage : IObjectStorage
{
    public Task<string> GetPresignedGetUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        IDictionary<string, string>? responseQueryParams = null,
        CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage is not configured.");

    public Task<string> GetPresignedPutUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage is not configured.");

    public Task<StoredObjectMetadata> GetObjectMetadataAsync(
        string bucket,
        string objectKey,
        CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage is not configured.");
}
