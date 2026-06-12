using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.Schools.Application;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Api.Endpoints;

public static class TenantDashboardEndpoints
{
    public static IEndpointRouteBuilder MapTenantDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tenants/dashboard")
            .WithTags("Tenant Dashboard")
            .RequireAuthorization();

        group.MapGet("/summary", async (
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository contentRepository,
            ISchoolRepository schoolRepository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(30);

            var totalDocuments = await contentRepository.CountContentsAsync(tenantId.Value, ct);
            var totalSchools = await schoolRepository.CountSubscriptionsAsync(null, tenantId.Value, "ACTIVE", null, ct);
            var schoolsExpiringSoon = await schoolRepository.CountSubscriptionsExpiringSoonAsync(tenantId.Value, now, threshold, ct);

            var totalSchoolsUsing = await contentRepository.CountSchoolsUsingAsync(tenantId.Value, ct);
            var soldDocuments = await contentRepository.CountSoldDocumentsAsync(tenantId.Value, ct);
            var unsoldDocuments = Math.Max(0, totalDocuments - soldDocuments);

            return Results.Ok(new TenantDashboardSummaryDto(totalSchools, totalSchoolsUsing, schoolsExpiringSoon, totalDocuments, soldDocuments, unsoldDocuments));
        })
        .WithName("GetTenantDashboardSummary")
        .WithSummary("Get tenant-level dashboard summary counts")
        .Produces<TenantDashboardSummaryDto>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        group.MapGet("/top-contents", async (
            ICurrentTenant currentTenant,
            ClaimsPrincipal user,
            IContentManagementRepository contentRepository,
            CancellationToken ct) =>
        {
            var tenantId = ResolveTenantId(currentTenant, user);
            if (!tenantId.HasValue)
                return Results.Unauthorized();

            var topContents = await contentRepository.ListTopSoldContentsAsync(tenantId.Value, 3, ct);
            return Results.Ok(topContents);
        })
        .WithName("GetTenantDashboardTopContents")
        .WithSummary("Get top 3 sold contents for a tenant")
        .Produces<IReadOnlyList<TopSoldContentItemDto>>(200)
        .ProducesProblem(401)
        .ProducesProblem(403);

        return app;
    }

    private static Guid? ResolveTenantId(ICurrentTenant currentTenant, ClaimsPrincipal user)
    {
        if (currentTenant.TenantId.HasValue)
            return currentTenant.TenantId.Value;

        var tenantClaim = user.FindFirst("tenant_id")?.Value;
        if (Guid.TryParse(tenantClaim, out var tenantIdFromClaim))
            return tenantIdFromClaim;

        return null;
    }
}

public sealed record TenantDashboardSummaryDto(
    int TotalSchools,
    int TotalSchoolsUsing,
    int SchoolsExpiringSoon,
    int TotalDocuments,
    int SoldDocuments,
    int UnsoldDocuments);
