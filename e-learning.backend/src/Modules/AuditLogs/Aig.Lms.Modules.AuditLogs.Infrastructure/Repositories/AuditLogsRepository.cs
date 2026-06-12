using Dapper;
using Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;
using Microsoft.Extensions.Configuration;

namespace Aig.Lms.Modules.AuditLogs.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for querying audit logs using Dapper.
/// </summary>
public sealed class AuditLogsRepository : IAuditLogsRepository
{
    private readonly IConfiguration _configuration;

    public AuditLogsRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<IReadOnlyList<AuditLogDto>> ListAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        var offset = (page - 1) * pageSize;
        string sql = $@"
SELECT
    id,
    created_at as OccurredAt,
    tenant_id as TenantId,
    school_id as SchoolId,
    user_id as UserId,
    action,
    entity_type as EntityType,
    entity_id as EntityId,
    metadata
FROM audit_log
WHERE 1=1
    AND (@TenantId IS NULL OR tenant_id = @TenantId)
    AND (@SchoolId IS NULL OR school_id = @SchoolId)
    AND (@UserId IS NULL OR user_id = @UserId)
    AND (@FromDate IS NULL OR created_at >= @FromDate)
    AND (@ToDate IS NULL OR created_at <= @ToDate)
ORDER BY created_at DESC
LIMIT {pageSize} OFFSET {offset}";

        var parameters = new DynamicParameters();
        parameters.Add("TenantId",  tenantId,  System.Data.DbType.Guid);
        parameters.Add("SchoolId",  schoolId,  System.Data.DbType.Guid);
        parameters.Add("UserId",    userId,    System.Data.DbType.Guid);
        parameters.Add("FromDate",  fromDate,  System.Data.DbType.DateTime);
        parameters.Add("ToDate",    toDate,    System.Data.DbType.DateTime);

        using var connection = new Npgsql.NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var logs = await connection.QueryAsync<AuditLogDto>(sql, parameters);
        return logs.ToList();
    }

    public async Task<int> CountAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        const string sql = @"
SELECT COUNT(*)
FROM audit_log
WHERE 1=1
    AND (@TenantId IS NULL OR tenant_id = @TenantId)
    AND (@SchoolId IS NULL OR school_id = @SchoolId)
    AND (@UserId IS NULL OR user_id = @UserId)
    AND (@FromDate IS NULL OR created_at >= @FromDate)
    AND (@ToDate IS NULL OR created_at <= @ToDate)";

        var parameters = new DynamicParameters();
        parameters.Add("TenantId",  tenantId,  System.Data.DbType.Guid);
        parameters.Add("SchoolId",  schoolId,  System.Data.DbType.Guid);
        parameters.Add("UserId",    userId,    System.Data.DbType.Guid);
        parameters.Add("FromDate",  fromDate,  System.Data.DbType.DateTime);
        parameters.Add("ToDate",    toDate,    System.Data.DbType.DateTime);

        using var connection = new Npgsql.NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var count = await connection.ExecuteScalarAsync<int>(sql, parameters);
        return count;
    }

    public async Task<IReadOnlyList<AuditLogDto>> ListAllAsync(
        Guid? tenantId = null,
        Guid? schoolId = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken ct = default)
    {
        const string sql = @"
SELECT
    id,
    created_at as OccurredAt,
    tenant_id as TenantId,
    school_id as SchoolId,
    user_id as UserId,
    action,
    entity_type as EntityType,
    entity_id as EntityId,
    metadata
FROM audit_log
WHERE 1=1
    AND (@TenantId IS NULL OR tenant_id = @TenantId)
    AND (@SchoolId IS NULL OR school_id = @SchoolId)
    AND (@UserId IS NULL OR user_id = @UserId)
    AND (@FromDate IS NULL OR created_at >= @FromDate)
    AND (@ToDate IS NULL OR created_at <= @ToDate)
ORDER BY created_at DESC";

        var parameters = new DynamicParameters();
        parameters.Add("TenantId",  tenantId,  System.Data.DbType.Guid);
        parameters.Add("SchoolId",  schoolId,  System.Data.DbType.Guid);
        parameters.Add("UserId",    userId,    System.Data.DbType.Guid);
        parameters.Add("FromDate",  fromDate,  System.Data.DbType.DateTime);
        parameters.Add("ToDate",    toDate,    System.Data.DbType.DateTime);

        using var connection = new Npgsql.NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection"));
        var logs = await connection.QueryAsync<AuditLogDto>(sql, parameters);
        return logs.ToList();
    }
}
