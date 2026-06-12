using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Aig.Lms.Api.MediaProcessing;

public sealed record VideoTranscodeJob(Guid TenantId, Guid ContentId, string SourceObjectKey, int Attempt = 0);

public interface IVideoTranscodeJobQueue
{
    ValueTask EnqueueAsync(VideoTranscodeJob job, CancellationToken ct = default);
    ValueTask<VideoTranscodeJob> DequeueAsync(CancellationToken ct = default);
}

public sealed class RedisVideoTranscodeJobQueue : IVideoTranscodeJobQueue
{
    private readonly IDatabase _database;
    private readonly string _queueKey;
    private readonly int _pollDelayMilliseconds;

    public RedisVideoTranscodeJobQueue(
        IConnectionMultiplexer redis,
        IOptions<MediaProcessingOptions> options)
    {
        _database = redis.GetDatabase();
        _queueKey = string.IsNullOrWhiteSpace(options.Value.RedisQueueKey)
            ? "lms:media:video:transcode"
            : options.Value.RedisQueueKey;
        _pollDelayMilliseconds = Math.Max(100, options.Value.RedisPollDelayMilliseconds);
    }

    public async ValueTask EnqueueAsync(VideoTranscodeJob job, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(job);
        await _database.ListRightPushAsync(_queueKey, payload);
    }

    public async ValueTask<VideoTranscodeJob> DequeueAsync(CancellationToken ct = default)
    {
        while (!ct.IsCancellationRequested)
        {
            var payload = await _database.ListLeftPopAsync(_queueKey);
            if (!payload.IsNullOrEmpty)
            {
                var job = JsonSerializer.Deserialize<VideoTranscodeJob>(payload.ToString());
                if (job is not null)
                    return job;
            }

            await Task.Delay(_pollDelayMilliseconds, ct);
        }

        throw new OperationCanceledException(ct);
    }
}
