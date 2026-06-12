namespace Aig.Lms.BuildingBlocks.Application.Abstractions;

public interface IMediaSigner
{
    Task<string> SignStreamUrlAsync(Guid contentId, string objectKey, CancellationToken ct = default);
    Task<string> SignViewUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentType = null,
        string? responseContentDisposition = null,
        CancellationToken ct = default);
    Task<string> SignDownloadUrlAsync(
        Guid contentId,
        string objectKey,
        string? responseContentDisposition = null,
        CancellationToken ct = default);
}
