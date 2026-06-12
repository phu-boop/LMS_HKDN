using Aig.Lms.Modules.Reports.Application.Interfaces;
using Aig.Lms.Modules.Reports.Domain;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Reports.Infrastructure;

public sealed class ReportRepository : IReportRepository
{
    private readonly string _connectionString;

    public ReportRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    }

    public async Task<Report> GetOverviewAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(1)
                 FROM tenant
                 WHERE is_deleted = FALSE
                   AND status = 'ACTIVE'::common_status) AS ActiveTenants,
                (SELECT COUNT(1)
                 FROM school
                 WHERE is_deleted = FALSE
                   AND status = 'ACTIVE'::common_status) AS ActiveSchools
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstAsync<Report>(new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<ActiveSessionResult> GetActiveSessionsAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                (SELECT COUNT(1)
                 FROM user_session
                 WHERE status = 'ACTIVE'::session_status
                   AND expires_at > NOW()) AS ActiveSessions
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstAsync<ActiveSessionResult>(new CommandDefinition(sql, cancellationToken: ct));
    }
}
