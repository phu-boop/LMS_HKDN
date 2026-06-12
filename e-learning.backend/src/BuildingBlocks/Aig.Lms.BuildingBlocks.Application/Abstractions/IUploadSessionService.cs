namespace Aig.Lms.BuildingBlocks.Application.Abstractions;

public sealed record UploadSessionResult(
    string UploadUrl,
    DateTimeOffset ExpiresAtUtc,
    string ObjectKey,
    string Bucket);

public sealed record UploadedObjectMetadata(
    long SizeBytes,
    string? MimeType);

public interface IUploadSessionService
{
    Task<UploadSessionResult> CreateUploadSessionAsync(
        Guid tenantId,
        Guid contentId,
        string fileName,
        CancellationToken ct = default);

    Task<UploadedObjectMetadata> GetUploadedObjectMetadataAsync(
        string objectKey,
        CancellationToken ct = default);
}
