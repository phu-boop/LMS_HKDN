using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class DisabledMediaSigner : IMediaSigner
{
    public Task<string> SignStreamUrlAsync(Guid contentId, string objectKey, CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage signer is not configured.");

    public Task<string> SignViewUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentType = null,
        string? responseContentDisposition = null,
        CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage signer is not configured.");

    public Task<string> SignDownloadUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentDisposition = null,
        CancellationToken ct = default)
        => throw new InvalidOperationException("Object storage signer is not configured.");
}
