namespace Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;

/// <summary>
/// Query to retrieve audit logs with filtering and pagination.
/// </summary>
public sealed record GetAuditLogsQuery(
    Guid? TenantId = null,
    Guid? SchoolId = null,
    Guid? UserId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Page = 1,
    int PageSize = 20);

/// <summary>
/// Result containing paginated audit logs.
/// </summary>
public sealed record GetAuditLogsResult(
    IReadOnlyList<AuditLogDto> Items,
    int Total,
    int Page,
    int PageSize);

/// <summary>
/// Handler for GetAuditLogsQuery.
/// </summary>
public sealed class GetAuditLogsQueryHandler
{
    private readonly IAuditLogsRepository _repository;

    public GetAuditLogsQueryHandler(IAuditLogsRepository repository)
    {
        _repository = repository;
    }

    public async Task<GetAuditLogsResult> HandleAsync(GetAuditLogsQuery query, CancellationToken ct = default)
    {
        // Validate and clamp pagination
        var clampedPage = query.Page < 1 ? 1 : query.Page;
        var clampedPageSize = query.PageSize < 1 ? 20 : query.PageSize > 100 ? 100 : query.PageSize;

        // Fetch filtered logs
        var logs = await _repository.ListAsync(
            query.TenantId,
            query.SchoolId,
            query.UserId,
            query.FromDate,
            query.ToDate,
            clampedPage,
            clampedPageSize,
            ct);

        // Count total for pagination
        var total = await _repository.CountAsync(
            query.TenantId,
            query.SchoolId,
            query.UserId,
            query.FromDate,
            query.ToDate,
            ct);

        return new GetAuditLogsResult(logs, total, clampedPage, clampedPageSize);
    }
}
