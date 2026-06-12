using Microsoft.AspNetCore.Builder;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public static class TenantResolutionApplicationBuilderExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder app) =>
        app.UseMiddleware<TenantResolutionMiddleware>();
}