namespace Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;

/// <summary>
/// Repository interface for querying audit logs.
/// </summary>
public interface IAuditLogsRepository
{
    /// <summary>
    /// List audit logs with filtering and pagination.
    /// </summary>
    Task<IReadOnlyList<AuditLogDto>> ListAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default);

    /// <summary>
    /// List all audit logs matching the filter criteria (no pagination) for export.
    /// </summary>
    Task<IReadOnlyList<AuditLogDto>> ListAllAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);

    /// <summary>
    /// Count audit logs matching the filter criteria.
    /// </summary>
    Task<int> CountAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default);
}
