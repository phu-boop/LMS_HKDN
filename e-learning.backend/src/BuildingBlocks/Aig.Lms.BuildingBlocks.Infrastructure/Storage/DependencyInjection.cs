using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;

namespace Aig.Lms.BuildingBlocks.Infrastructure.Storage;

public static class DependencyInjection
{
    public static IServiceCollection AddObjectStorageFoundation(this IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration.GetSection("ObjectStorage").Get<ObjectStorageOptions>() ?? new ObjectStorageOptions();

        services.AddSingleton(options);
        services.AddSingleton<IMediaUrlBuilder, DefaultMediaUrlBuilder>();

        if (IsConfigured(options))
        {
            services.AddSingleton<IMinioClient>(_ => BuildMinioClient(options));
            services.AddSingleton<IObjectStorage, MinioObjectStorage>();
            services.AddSingleton<IMediaSigner, MinioMediaSigner>();
            services.AddSingleton<IUploadSessionService, MinioUploadSessionService>();
        }
        else
        {
            services.AddSingleton<IObjectStorage, DisabledObjectStorage>();
            services.AddSingleton<IMediaSigner, DisabledMediaSigner>();
            services.AddSingleton<IUploadSessionService, StubUploadSessionService>();
        }

        return services;
    }

    private static bool IsConfigured(ObjectStorageOptions options)
        => !string.IsNullOrWhiteSpace(options.Endpoint)
           && !string.IsNullOrWhiteSpace(options.AccessKey)
           && !string.IsNullOrWhiteSpace(options.SecretKey);

    private static IMinioClient BuildMinioClient(ObjectStorageOptions options)
    {
        var uri = new Uri(options.Endpoint);

        IMinioClient builder = new MinioClient();
        builder = uri.IsDefaultPort
            ? builder.WithEndpoint(uri.Host)
            : builder.WithEndpoint(uri.Host, uri.Port);

        builder = builder.WithCredentials(options.AccessKey, options.SecretKey);

        if (options.UseSSL || uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
            builder = builder.WithSSL();

        return builder.Build();
    }
}
