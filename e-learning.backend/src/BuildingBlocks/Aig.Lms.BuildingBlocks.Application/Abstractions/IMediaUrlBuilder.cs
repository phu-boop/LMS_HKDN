namespace Aig.Lms.BuildingBlocks.Application.Abstractions;

public interface IMediaUrlBuilder
{
    string BuildHlsMasterKey(Guid tenantId, Guid contentId);
    string BuildDocumentKey(Guid tenantId, Guid contentId, string fileName);
    string BuildDownloadKey(Guid tenantId, Guid contentId, string fileName);
}
