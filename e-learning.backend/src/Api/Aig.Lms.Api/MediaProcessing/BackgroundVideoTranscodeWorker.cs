using System.Diagnostics;
using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.BuildingBlocks.Infrastructure.Storage;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Microsoft.Extensions.Options;

namespace Aig.Lms.Api.MediaProcessing;

public sealed class BackgroundVideoTranscodeWorker(
    IVideoTranscodeJobQueue queue,
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    IOptions<MediaProcessingOptions> options,
    ILogger<BackgroundVideoTranscodeWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            VideoTranscodeJob job;

            try
            {
                job = await queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await ProcessJobAsync(job, stoppingToken);
        }
    }

    private async Task ProcessJobAsync(VideoTranscodeJob job, CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IContentManagementRepository>();
        var objectStorage = scope.ServiceProvider.GetRequiredService<IObjectStorage>();
        var objectStorageOptions = scope.ServiceProvider.GetRequiredService<ObjectStorageOptions>();
        var mediaUrlBuilder = scope.ServiceProvider.GetRequiredService<IMediaUrlBuilder>();

        await repository.MarkMediaProcessingStartedAsync(job.TenantId, job.ContentId, ct);

        var workDir = Path.Combine(
            Path.GetTempPath(),
            "aig-lms-media",
            job.ContentId.ToString("N"),
            Guid.NewGuid().ToString("N"));

        var inputPath = Path.Combine(workDir, "input.bin");
        var outputDir = Path.Combine(workDir, "hls");

        Directory.CreateDirectory(workDir);
        Directory.CreateDirectory(outputDir);

        try
        {
            var content = await repository.GetContentAsync(job.TenantId, job.ContentId, ct);
            if (content is null)
                throw new InvalidOperationException("Content not found for transcoding.");

            if (!content.Type.Equals("VIDEO", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogInformation(
                    "Skip media processing for non-video content {ContentId} ({Type}).",
                    job.ContentId,
                    content.Type);

                return;
            }

            if (string.IsNullOrWhiteSpace(job.SourceObjectKey))
                throw new InvalidOperationException("Source object key is empty.");

            await DownloadSourceAsync(
                objectStorage,
                objectStorageOptions,
                job.SourceObjectKey,
                inputPath,
                ct);

            var ffmpegError = await RunFfmpegAsync(inputPath, outputDir, ct);

            await UploadHlsOutputAsync(
                objectStorage,
                objectStorageOptions,
                outputDir,
                job.TenantId,
                job.ContentId,
                ct);

            var hlsMasterKey = mediaUrlBuilder.BuildHlsMasterKey(job.TenantId, job.ContentId);
            await repository.MarkMediaProcessingReadyAsync(job.TenantId, job.ContentId, hlsMasterKey, ct);

            logger.LogInformation(
                "Video transcoding completed for content {ContentId}. HLS key: {HlsMasterKey}. Ffmpeg stderr: {FfmpegError}",
                job.ContentId,
                hlsMasterKey,
                string.IsNullOrWhiteSpace(ffmpegError) ? "<empty>" : ffmpegError);
        }
        catch (Exception ex)
        {
            var error = TruncateError(ex.Message);
            var maxRetryAttempts = Math.Max(0, options.Value.MaxRetryAttempts);

            if (job.Attempt < maxRetryAttempts)
            {
                var nextAttempt = job.Attempt + 1;
                var retryDelaySeconds = Math.Max(0, options.Value.RetryDelaySeconds);

                await repository.MarkMediaProcessingQueuedAsync(job.TenantId, job.ContentId, ct);

                if (retryDelaySeconds > 0)
                    await Task.Delay(TimeSpan.FromSeconds(retryDelaySeconds), ct);

                await queue.EnqueueAsync(job with { Attempt = nextAttempt }, ct);

                logger.LogWarning(
                    ex,
                    "Video transcoding failed for content {ContentId}. Requeued attempt {Attempt}/{MaxAttempts}.",
                    job.ContentId,
                    nextAttempt,
                    maxRetryAttempts);
            }
            else
            {
                await repository.MarkMediaProcessingFailedAsync(job.TenantId, job.ContentId, error, ct);

                logger.LogError(
                    ex,
                    "Video transcoding failed for content {ContentId} after {Attempt} attempts.",
                    job.ContentId,
                    job.Attempt + 1);
            }
        }
        finally
        {
            try
            {
                if (Directory.Exists(workDir))
                    Directory.Delete(workDir, recursive: true);
            }
            catch (Exception cleanupEx)
            {
                logger.LogWarning(cleanupEx, "Failed to cleanup media temp directory {WorkDir}", workDir);
            }
        }
    }

    private async Task DownloadSourceAsync(
        IObjectStorage objectStorage,
        ObjectStorageOptions storageOptions,
        string sourceObjectKey,
        string targetPath,
        CancellationToken ct)
    {
        var getTtl = TimeSpan.FromSeconds(Math.Max(60, options.Value.PresignedGetTtlSeconds));
        var sourceUrl = await objectStorage.GetPresignedGetUrlAsync(
            storageOptions.ContentBucket,
            sourceObjectKey,
            getTtl,
            responseQueryParams: null,
            ct);

        var client = httpClientFactory.CreateClient("MediaProcessing");
        using var response = await client.GetAsync(sourceUrl, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();

        await using var sourceStream = await response.Content.ReadAsStreamAsync(ct);
        await using var targetStream = File.Create(targetPath);
        await sourceStream.CopyToAsync(targetStream, ct);
    }

    private async Task<string> RunFfmpegAsync(string inputPath, string outputDir, CancellationToken ct)
    {
        var outputPlaylistPath = Path.Combine(outputDir, "master.m3u8");
        var segmentPathPattern = Path.Combine(outputDir, "segment_%05d.ts");

        var psi = new ProcessStartInfo
        {
            FileName = options.Value.FfmpegBinaryPath,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        psi.ArgumentList.Add("-y");
        psi.ArgumentList.Add("-i");
        psi.ArgumentList.Add(inputPath);
        psi.ArgumentList.Add("-c:v");
        psi.ArgumentList.Add("libx264");
        psi.ArgumentList.Add("-preset");
        psi.ArgumentList.Add("veryfast");
        psi.ArgumentList.Add("-crf");
        psi.ArgumentList.Add("23");
        psi.ArgumentList.Add("-c:a");
        psi.ArgumentList.Add("aac");
        psi.ArgumentList.Add("-ar");
        psi.ArgumentList.Add("48000");
        psi.ArgumentList.Add("-b:a");
        psi.ArgumentList.Add("128k");
        psi.ArgumentList.Add("-hls_time");
        psi.ArgumentList.Add(Math.Max(1, options.Value.HlsSegmentDurationSeconds).ToString());
        psi.ArgumentList.Add("-hls_playlist_type");
        psi.ArgumentList.Add("vod");
        psi.ArgumentList.Add("-hls_segment_filename");
        psi.ArgumentList.Add(segmentPathPattern);
        psi.ArgumentList.Add(outputPlaylistPath);

        using var process = new Process { StartInfo = psi };
        process.Start();

        var stdOutTask = process.StandardOutput.ReadToEndAsync(ct);
        var stdErrTask = process.StandardError.ReadToEndAsync(ct);

        await process.WaitForExitAsync(ct);

        var stdOut = await stdOutTask;
        var stdErr = await stdErrTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"ffmpeg exited with code {process.ExitCode}. stdout: {stdOut}. stderr: {stdErr}");
        }

        if (!File.Exists(outputPlaylistPath))
        {
            throw new InvalidOperationException("ffmpeg completed but master.m3u8 was not generated.");
        }

        return stdErr;
    }

    private async Task UploadHlsOutputAsync(
        IObjectStorage objectStorage,
        ObjectStorageOptions storageOptions,
        string outputDir,
        Guid tenantId,
        Guid contentId,
        CancellationToken ct)
    {
        var files = Directory.GetFiles(outputDir, "*", SearchOption.AllDirectories);
        if (files.Length == 0)
            throw new InvalidOperationException("No HLS output files were generated.");

        var putTtl = TimeSpan.FromSeconds(Math.Max(60, options.Value.PresignedPutTtlSeconds));
        var client = httpClientFactory.CreateClient("MediaProcessing");

        foreach (var file in files)
        {
            var relativePath = Path.GetRelativePath(outputDir, file).Replace('\\', '/');
            var objectKey = $"tenants/{tenantId}/contents/{contentId}/hls/{relativePath}";
            var putUrl = await objectStorage.GetPresignedPutUrlAsync(storageOptions.HlsBucket, objectKey, putTtl, ct);

            await using var fs = File.OpenRead(file);
            using var fileContent = new StreamContent(fs);
            using var request = new HttpRequestMessage(HttpMethod.Put, putUrl)
            {
                Content = fileContent
            };

            using var response = await client.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();
        }
    }

    private static string TruncateError(string error)
    {
        const int maxLength = 2000;
        if (error.Length <= maxLength)
            return error;

        return error[..maxLength];
    }
}
