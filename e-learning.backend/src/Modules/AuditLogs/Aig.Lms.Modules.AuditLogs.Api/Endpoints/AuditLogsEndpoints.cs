using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;
using System.Text;

namespace Aig.Lms.Modules.AuditLogs.Api.Endpoints;

/// <summary>
/// Endpoint mappings for audit logs API.
/// </summary>
public static class AuditLogsEndpoints
{
    public static IEndpointRouteBuilder MapAuditLogsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/audit-logs")
            .WithTags("Audit Logs")
            .RequireAuthorization();

        // GET /api/admin/audit-logs - List audit logs with filtering and pagination
        group.MapGet("/", GetAuditLogs)
            .WithName("ListAuditLogs")
            .WithSummary("List audit logs")
            .WithDescription("Get paginated list of audit logs with optional filters (tenant, school, user, date range)")
            .Produces<GetAuditLogsResult>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization("Permission:AUDIT_LOGS_VIEW");

        // GET /api/admin/audit-logs/export - Export filtered audit logs as CSV
        group.MapGet("/export", ExportAuditLogs)
            .WithName("ExportAuditLogs")
            .WithSummary("Export audit logs")
            .WithDescription("Export audit logs matching the same filters as list endpoint to a CSV file")
            .Produces(StatusCodes.Status200OK, contentType: "text/csv")
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .RequireAuthorization("Permission:AUDIT_LOGS_EXPORT");

        var tenantGroup = app.MapGroup("/api/tenants/audit-logs")
            .WithTags("Audit Logs")
            .RequireAuthorization("Permission:AUDIT_LOGS_VIEW");

        tenantGroup.MapGet("/", GetTenantAuditLogs)
            .WithName("ListTenantAuditLogs")
            .WithSummary("List current tenant's audit logs")
            .WithDescription("Get paginated list of audit logs for the currently resolved tenant")
            .Produces<GetAuditLogsResult>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return app;
    }

    /// <summary>
    /// GET /api/admin/audit-logs
    /// List audit logs with filtering and pagination.
    /// </summary>
    private static async Task<IResult> GetAuditLogs(
        Guid? tenantId,
        Guid? schoolId,
        Guid? userId,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize,
        GetAuditLogsQueryHandler handler,
        CancellationToken ct = default)
    {
        try
        {
            // Clamp pagination values
            var clampedPage = page < 1 ? 1 : page;
            var clampedPageSize = pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

            var query = new GetAuditLogsQuery(
                tenantId,
                schoolId,
                userId,
                fromDate,
                toDate,
                clampedPage,
                clampedPageSize);

            var result = await handler.HandleAsync(query, ct);
            return Results.Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/tenants/audit-logs
    /// List audit logs for the currently resolved tenant.
    /// </summary>
    private static async Task<IResult> GetTenantAuditLogs(
        ICurrentTenant currentTenant,
        ClaimsPrincipal user,
        Guid? schoolId,
        Guid? userId,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize,
        GetAuditLogsQueryHandler handler,
        CancellationToken ct = default)
    {
        var tenantId = ResolveCurrentTenantId(currentTenant, user);
        if (!tenantId.HasValue)
            return Results.Unauthorized();

        try
        {
            // Clamp pagination values
            var clampedPage = page < 1 ? 1 : page;
            var clampedPageSize = pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

            var query = new GetAuditLogsQuery(
                tenantId,
                schoolId,
                userId,
                fromDate,
                toDate,
                clampedPage,
                clampedPageSize);

            var result = await handler.HandleAsync(query, ct);
            return Results.Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static Guid? ResolveCurrentTenantId(ICurrentTenant currentTenant, ClaimsPrincipal user)
    {
        if (currentTenant.TenantId.HasValue)
            return currentTenant.TenantId;

        var tenantClaim = user.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(tenantClaim, out var tenantId) ? tenantId : null;
    }

    /// <summary>
    /// GET /api/admin/audit-logs/export
    /// Export audit logs with filtering to CSV.
    /// </summary>
    private static async Task<IResult> ExportAuditLogs(
        Guid? tenantId,
        Guid? schoolId,
        Guid? userId,
        DateTime? fromDate,
        DateTime? toDate,
        IAuditLogsRepository repository,
        CancellationToken ct = default)
    {
        try
        {
            var logs = await repository.ListAllAsync(
                tenantId,
                schoolId,
                userId,
                fromDate,
                toDate,
                ct);

            var csv = new StringBuilder();
            csv.AppendLine("Id,OccurredAt,TenantId,SchoolId,UserId,Action,EntityType,EntityId,IpAddress,UserAgent,Metadata");

            foreach (var log in logs)
            {
                csv.AppendLine(string.Join(",", new[]
                {
                    CsvEscape(log.Id.ToString()),
                    CsvEscape(log.OccurredAt.ToString("o")),
                    CsvEscape(log.TenantId?.ToString()),
                    CsvEscape(log.SchoolId?.ToString()),
                    CsvEscape(log.UserId?.ToString()),
                    CsvEscape(log.Action),
                    CsvEscape(log.EntityType),
                    CsvEscape(log.EntityId?.ToString()),
                    CsvEscape(log.Metadata)
                }));
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return Results.File(bytes, "text/csv; charset=utf-8", "audit-logs.csv");
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { message = ex.Message });
        }
    }

    private static string CsvEscape(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        var escaped = value.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}
