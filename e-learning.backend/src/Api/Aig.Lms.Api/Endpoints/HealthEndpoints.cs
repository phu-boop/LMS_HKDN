using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Aig.Lms.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", async (HealthCheckService healthCheckService) =>
        {
            var report = await healthCheckService.CheckHealthAsync();
            var result = new
            {
                status = report.Status.ToString(),
                timestamp = DateTime.UtcNow,
                checks = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description
                })
            };
            return report.Status == HealthStatus.Healthy
                ? Results.Ok(result)
                : Results.Json(result, statusCode: 503);
        })
        .WithTags("Health")
        .WithSummary("Overall health status")
        .AllowAnonymous();

        app.MapGet("/health/live", () => Results.Ok(new { status = "Alive", timestamp = DateTime.UtcNow }))
           .WithTags("Health")
           .WithSummary("Liveness — app is running")
           .AllowAnonymous();

        app.MapGet("/health/ready", async (HealthCheckService healthCheckService) =>
        {
            var report = await healthCheckService.CheckHealthAsync();
            return report.Status == HealthStatus.Healthy
                ? Results.Ok(new { status = "Ready", timestamp = DateTime.UtcNow })
                : Results.Json(new { status = "Not Ready", timestamp = DateTime.UtcNow }, statusCode: 503);
        })
        .WithTags("Health")
        .WithSummary("Readiness — app is ready to serve traffic")
        .AllowAnonymous();

        return app;
    }
}
