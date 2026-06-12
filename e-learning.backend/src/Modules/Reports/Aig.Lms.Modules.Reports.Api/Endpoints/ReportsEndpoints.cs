using Aig.Lms.Modules.Reports.Application.Interfaces;
using Aig.Lms.Modules.Reports.Domain;
using Microsoft.AspNetCore.Mvc;

namespace Aig.Lms.Modules.Reports.Api.Endpoints;

public static class ReportsEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/reports")
            .WithTags("Reports")
            .RequireAuthorization("Permission:REPORTS_VIEW");

        group.MapGet("/overview", async (
            [FromServices] IReportRepository repository,
            CancellationToken ct) =>
        {
            var report = await repository.GetOverviewAsync(ct);
            return Results.Ok(report);
        })
        .WithName("GetReportOverview")
        .WithSummary("Get current platform report overview")
        .Produces<Report>()
        .ProducesProblem(401);

        group.MapGet("/active-session", async (
            [FromServices] IReportRepository repository,
            CancellationToken ct) =>
        {
            var activeSessions = await repository.GetActiveSessionsAsync(ct);
            return Results.Ok(activeSessions);
        })
        .WithName("GetActiveSession")
        .WithSummary("Get current active sessions")
        .Produces<ActiveSessionResult>()
        .ProducesProblem(401);

        return app;
    }
}
