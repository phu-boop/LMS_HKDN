using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class MinioMediaSigner : IMediaSigner
{
    private readonly IObjectStorage _objectStorage;
    private readonly ObjectStorageOptions _options;

    public MinioMediaSigner(IObjectStorage objectStorage, ObjectStorageOptions options)
    {
        _objectStorage = objectStorage;
        _options = options;
    }

    public Task<string> SignStreamUrlAsync(Guid contentId, string objectKey, CancellationToken ct = default)
        => _objectStorage.GetPresignedGetUrlAsync(
            _options.HlsBucket,
            objectKey,
            TimeSpan.FromSeconds(_options.StreamUrlTtlSeconds),
            ct: ct);

    public Task<string> SignViewUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentType = null,
        string? responseContentDisposition = null,
        CancellationToken ct = default)
    {
        Dictionary<string, string>? responseQueryParams = null;

        if (!string.IsNullOrWhiteSpace(responseContentType)
            || !string.IsNullOrWhiteSpace(responseContentDisposition))
        {
            responseQueryParams = new Dictionary<string, string>(StringComparer.Ordinal);

            if (!string.IsNullOrWhiteSpace(responseContentType))
                responseQueryParams["response-content-type"] = responseContentType;

            if (!string.IsNullOrWhiteSpace(responseContentDisposition))
                responseQueryParams["response-content-disposition"] = responseContentDisposition;
        }

        return _objectStorage.GetPresignedGetUrlAsync(
            _options.ContentBucket,
            objectKey,
            TimeSpan.FromSeconds(_options.ViewUrlTtlSeconds),
            responseQueryParams,
            ct);
    }

    public Task<string> SignDownloadUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentDisposition = null,
        CancellationToken ct = default)
    {
        Dictionary<string, string>? responseQueryParams = null;

        if (!string.IsNullOrWhiteSpace(responseContentDisposition))
        {
            responseQueryParams = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["response-content-disposition"] = responseContentDisposition
            };
        }

        return _objectStorage.GetPresignedGetUrlAsync(
            _options.ContentBucket,
            objectKey,
            TimeSpan.FromSeconds(_options.DownloadUrlTtlSeconds),
            responseQueryParams,
            ct);
    }
}
