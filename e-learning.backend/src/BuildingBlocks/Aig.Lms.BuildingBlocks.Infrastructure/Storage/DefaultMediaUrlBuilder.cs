using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public sealed class DefaultMediaUrlBuilder : IMediaUrlBuilder
{
    public string BuildHlsMasterKey(Guid tenantId, Guid contentId)
        => $"tenants/{tenantId}/contents/{contentId}/hls/master.m3u8";

    public string BuildDocumentKey(Guid tenantId, Guid contentId, string fileName)
        => $"tenants/{tenantId}/contents/{contentId}/source/{fileName}";

    public string BuildDownloadKey(Guid tenantId, Guid contentId, string fileName)
        => $"tenants/{tenantId}/contents/{contentId}/download/{fileName}";
}
