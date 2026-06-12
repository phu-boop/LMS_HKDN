using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Minio;
using Minio.DataModel.Args;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class MinioObjectStorage : IObjectStorage
{
    private readonly IMinioClient _client;

    public MinioObjectStorage(IMinioClient client)
    {
        _client = client;
    }

    public async Task<string> GetPresignedGetUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        IDictionary<string, string>? responseQueryParams = null,
        CancellationToken ct = default)
    {
        var expirySeconds = Math.Max(1, (int)Math.Ceiling(ttl.TotalSeconds));

        var args = new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithExpiry(expirySeconds);

        if (responseQueryParams is not null && responseQueryParams.Count > 0)
            args = args.WithHeaders(responseQueryParams);

        return await _client.PresignedGetObjectAsync(args).ConfigureAwait(false);
    }

    public async Task<string> GetPresignedPutUrlAsync(
        string bucket,
        string objectKey,
        TimeSpan ttl,
        CancellationToken ct = default)
    {
        var expirySeconds = Math.Max(1, (int)Math.Ceiling(ttl.TotalSeconds));

        var args = new PresignedPutObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithExpiry(expirySeconds);

        return await _client.PresignedPutObjectAsync(args).ConfigureAwait(false);
    }

    public async Task<StoredObjectMetadata> GetObjectMetadataAsync(
        string bucket,
        string objectKey,
        CancellationToken ct = default)
    {
        var args = new StatObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey);

        var stat = await _client.StatObjectAsync(args, ct).ConfigureAwait(false);
        return new StoredObjectMetadata(stat.Size, stat.ContentType);
    }
}
