using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class StubUploadSessionService : IUploadSessionService
{
    public Task<UploadSessionResult> CreateUploadSessionAsync(
        Guid tenantId,
        Guid contentId,
        string fileName,
        CancellationToken ct = default)
    {
        // Phase 3 Step 3.2 will replace this with multipart upload/session orchestration.
        throw new NotImplementedException("Upload session service is not implemented yet.");
    }

    public Task<UploadedObjectMetadata> GetUploadedObjectMetadataAsync(
        string objectKey,
        CancellationToken ct = default)
    {
        throw new NotImplementedException("Upload session service is not implemented yet.");
    }
}
