namespace Aig.Lms.BuildingBlocks.Application.Abstractions;

public sealed record StoredObjectMetadata(
    long SizeBytes,
    string? ContentType);

public interface IObjectStorage
{
    Task<string> GetPresignedGetUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        IDictionary<string, string>? responseQueryParams = null,
        CancellationToken ct = default);

    Task<string> GetPresignedPutUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        CancellationToken ct = default);

    Task<StoredObjectMetadata> GetObjectMetadataAsync(
        string bucket,
        string objectKey,
        CancellationToken ct = default);
}
