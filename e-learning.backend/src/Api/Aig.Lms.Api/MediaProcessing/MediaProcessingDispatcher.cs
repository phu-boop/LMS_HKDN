using Aig.Lms.Modules.ContentManagement.Application.Content;

namespace Aig.Lms.Api.MediaProcessing;

public sealed class MediaProcessingDispatcher(IVideoTranscodeJobQueue queue) : IMediaProcessingDispatcher
{
    public async Task EnqueueVideoAsync(Guid tenantId, Guid contentId, string sourceObjectKey, CancellationToken ct = default)
    {
        await queue.EnqueueAsync(new VideoTranscodeJob(tenantId, contentId, sourceObjectKey, Attempt: 0), ct);
    }
}
