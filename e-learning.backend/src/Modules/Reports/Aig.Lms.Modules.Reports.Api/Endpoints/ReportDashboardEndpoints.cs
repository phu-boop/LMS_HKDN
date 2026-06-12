using Aig.Lms.Modules.Identity.Application.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Aig.Lms.Modules.Reports.Api.Endpoints;

public static class ReportDashboardEndpoints
{
    public static IEndpointRouteBuilder MapAdminDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/dashboard")
            .WithTags("Reports")
            .RequireAuthorization("Permission:SESSIONS_VIEW");

        group.MapGet("/sessions", async (
            [FromQuery] Guid? tenantId,
            [FromServices] GetAdminSessionDashboardQueryHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetAdminSessionDashboardQuery(tenantId), ct);
            return Results.Ok(result);
        })
        .WithName("AdminGetDashboardUserSessionActivity")
        .WithSummary("Get admin dashboard user session activity metrics")
        .Produces<AdminSessionDashboardDto>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        return app;
    }
}
