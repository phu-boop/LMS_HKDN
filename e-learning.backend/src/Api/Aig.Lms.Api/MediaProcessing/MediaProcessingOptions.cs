namespace Aig.Lms.Api.MediaProcessing;

public sealed class MediaProcessingOptions
{
    public string FfmpegBinaryPath { get; init; } = "ffmpeg";
    public int HlsSegmentDurationSeconds { get; init; } = 6;
    public int PresignedGetTtlSeconds { get; init; } = 1800;
    public int PresignedPutTtlSeconds { get; init; } = 1800;
    public string RedisConnection { get; init; } = "localhost:6379";
    public string RedisQueueKey { get; init; } = "lms:media:video:transcode";
    public int RedisPollDelayMilliseconds { get; init; } = 500;
    public int MaxRetryAttempts { get; init; } = 3;
    public int RetryDelaySeconds { get; init; } = 5;
}
