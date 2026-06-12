using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;

namespace Aig.Lms.Modules.Identity.Infrastructure.Auth;

public sealed class UserRepository : IUserRepository
{
    private readonly string _connectionString;

    public UserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task<UserAccount?> FindByIdentifierAsync(string identifier, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, home_school_id AS SchoolId, username, email,
                   password_hash AS PasswordHash, full_name AS FullName, status::TEXT AS Status,
                   failed_attempts AS FailedLoginCount, locked_until AS LockedUntil
            FROM user_account
            WHERE (username = @Identifier OR email = @Identifier) AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UserAccount>(
            new CommandDefinition(sql, new { Identifier = identifier }, cancellationToken: ct));
    }

    public async Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, home_school_id AS SchoolId, username, email,
                   password_hash AS PasswordHash, full_name AS FullName, status::TEXT AS Status,
                   failed_attempts AS FailedLoginCount, locked_until AS LockedUntil
            FROM user_account
            WHERE id = @UserId AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UserAccount>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<string>> GetRoleCodesAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT r.code
            FROM role r
            INNER JOIN user_tenant_role_assignment utra ON utra.role_id = r.id
            WHERE utra.user_id = @UserId AND utra.is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var roles = await conn.QueryAsync<string>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));

        return roles.AsList();
    }

    public async Task<Guid?> GetTenantIdAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
           SELECT COALESCE(
               (
                   SELECT utra.tenant_id
                   FROM user_tenant_role_assignment utra
                   WHERE utra.user_id = @UserId
                     AND utra.is_deleted = FALSE
                     AND utra.tenant_id IS NOT NULL
                   ORDER BY utra.created_at ASC
                   LIMIT 1
               ),
               (
                   SELECT t.id
                   FROM user_tenant_role_assignment utra
                   INNER JOIN role r ON r.id = utra.role_id
                   INNER JOIN tenant t ON t.code = 'PLATFORM' AND t.status = 'ACTIVE'
                   WHERE utra.user_id = @UserId
                     AND utra.is_deleted = FALSE
                     AND r.code = 'LMS_ADMIN'
                   LIMIT 1
               )
           )
           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<Guid?>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<Guid>> GetActiveTenantIdsAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
           SELECT DISTINCT utra.tenant_id
           FROM user_tenant_role_assignment utra
           INNER JOIN tenant t ON t.id = utra.tenant_id
           WHERE utra.user_id = @UserId
             AND utra.is_deleted = FALSE
             AND utra.tenant_id IS NOT NULL
             AND t.status = 'ACTIVE'
           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var tenantIds = await conn.QueryAsync<Guid>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));

        return tenantIds.AsList();
    }

    public async Task UpdateLastLoginAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET updated_at = NOW()
            WHERE id = @UserId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT password_hash
            FROM user_account
            WHERE id = @UserId AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<string?>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task UpdatePasswordAsync(Guid userId, string newPasswordHash, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET password_hash = @NewPasswordHash,
                updated_at    = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, NewPasswordHash = newPasswordHash }, cancellationToken: ct));
    }

    // --- Brute-force protection ---

    public async Task IncrementFailedLoginAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET failed_attempts = failed_attempts + 1,
                updated_at = NOW()
            WHERE id = @UserId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task ResetFailedLoginAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET failed_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = @UserId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task LockUserAsync(Guid userId, DateTime lockedUntil, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET locked_until = @LockedUntil,
                failed_attempts = 0,
                updated_at = NOW()
            WHERE id = @UserId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, LockedUntil = lockedUntil }, cancellationToken: ct));
    }

    // --- Session management ---

    public async Task<Guid> CreateSessionAsync(UserSession session, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_session (id, tenant_id, school_id, user_id, refresh_token_hash,
                device_fingerprint, user_agent, ip_address, started_at, last_seen_at, expires_at, status, metadata)
            VALUES (@Id, @TenantId, @SchoolId, @UserId, @RefreshTokenHash,
                @DeviceFingerprint, @UserAgent, @IpAddress, NOW(), NOW(), @ExpiresAt, 'ACTIVE'::session_status, '{}'::jsonb)
            """;

        var parameters = new DynamicParameters();
        parameters.Add("Id", session.Id, System.Data.DbType.Guid);
        parameters.Add("TenantId", session.TenantId, System.Data.DbType.Guid);
        parameters.Add("SchoolId", session.SchoolId, System.Data.DbType.Guid);  // null-safe for users without school
        parameters.Add("UserId", session.UserId, System.Data.DbType.Guid);
        parameters.Add("RefreshTokenHash", session.RefreshTokenHash);
        parameters.Add("DeviceFingerprint", session.DeviceFingerprint);
        parameters.Add("UserAgent", session.UserAgent);
        parameters.Add("IpAddress", session.IpAddress);
        parameters.Add("ExpiresAt", session.ExpiresAt);

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, parameters, cancellationToken: ct));

        return session.Id;
    }

    public async Task<UserSession?> FindSessionByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, tenant_id AS TenantId, school_id AS SchoolId, user_id AS UserId,
                   refresh_token_hash AS RefreshTokenHash, device_fingerprint AS DeviceFingerprint,
                   user_agent AS UserAgent, ip_address AS IpAddress,
                   started_at AS StartedAt, last_seen_at AS LastSeenAt, expires_at AS ExpiresAt,
                   ended_at AS EndedAt, status::TEXT AS Status
            FROM user_session
            WHERE refresh_token_hash = @RefreshTokenHash
              AND status = 'ACTIVE'::session_status
              AND expires_at > NOW()
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UserSession>(
            new CommandDefinition(sql, new { RefreshTokenHash = refreshTokenHash }, cancellationToken: ct));
    }

    public async Task UpdateSessionLastSeenAsync(Guid sessionId, string newRefreshTokenHash, DateTime newExpiresAt, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_session
            SET refresh_token_hash = @NewRefreshTokenHash,
                last_seen_at = NOW(),
                expires_at = @NewExpiresAt
            WHERE id = @SessionId AND status = 'ACTIVE'::session_status
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { SessionId = sessionId, NewRefreshTokenHash = newRefreshTokenHash, NewExpiresAt = newExpiresAt }, cancellationToken: ct));
    }

    public async Task UpdateSessionTenantAsync(Guid sessionId, Guid newTenantId, string newRefreshTokenHash, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_session
            SET tenant_id = @NewTenantId,
                refresh_token_hash = @NewRefreshTokenHash,
                last_seen_at = NOW()
            WHERE id = @SessionId AND status = 'ACTIVE'::session_status
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { SessionId = sessionId, NewTenantId = newTenantId, NewRefreshTokenHash = newRefreshTokenHash }, cancellationToken: ct));
    }

    public async Task RevokeSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_session
            SET status = 'REVOKED'::session_status,
                ended_at = NOW()
            WHERE id = @SessionId AND status = 'ACTIVE'::session_status
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new { SessionId = sessionId }, cancellationToken: ct));
    }

    public async Task RevokeAllUserSessionsAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_session
            SET status = 'REVOKED'::session_status,
                ended_at = NOW()
            WHERE user_id = @UserId AND status = 'ACTIVE'::session_status
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<int> RevokeOtherSessionsAsync(Guid userId, Guid? exceptSessionId, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);

        if (exceptSessionId.HasValue)
        {
            const string sql = """
                UPDATE user_session
                SET status = 'REVOKED'::session_status,
                    ended_at = NOW()
                WHERE user_id = @UserId
                  AND id != @ExceptSessionId
                  AND status = 'ACTIVE'::session_status
                """;

            return await conn.ExecuteAsync(new CommandDefinition(
                sql, new { UserId = userId, ExceptSessionId = exceptSessionId.Value }, cancellationToken: ct));
        }
        else
        {
            const string sql = """
                UPDATE user_session
                SET status = 'REVOKED'::session_status,
                    ended_at = NOW()
                WHERE user_id = @UserId AND status = 'ACTIVE'::session_status
                """;

            return await conn.ExecuteAsync(new CommandDefinition(
                sql, new { UserId = userId }, cancellationToken: ct));
        }
    }

    // --- Concurrent session policy ---

    public async Task<SchoolSessionPolicy> GetSchoolSessionPolicyAsync(Guid? schoolId, CancellationToken ct = default)
    {
        if (schoolId is null)
            return new SchoolSessionPolicy();  // platform-level users (LMS_ADMIN) have no school constraints

                const string sql = """
                        SELECT max_concurrent_sessions AS MaxConcurrentSessions,
                                     login_policy::TEXT       AS Policy,
                                     contract_end             AS ContractEnd,
                                     enforce_expiry           AS EnforceExpiry
                        FROM school_tenant_mapping
                        WHERE school_id = @SchoolId
                            AND status = 'ACTIVE'
                            AND is_deleted = FALSE
                        ORDER BY (contract_end >= CURRENT_DATE) DESC, contract_end DESC
                        LIMIT 1
                        """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<SchoolSessionPolicy>(
            new CommandDefinition(sql, new { SchoolId = schoolId.Value }, cancellationToken: ct))
            ?? new SchoolSessionPolicy();
    }

    public async Task<int> CountActiveSessionsAsync(Guid userId, Guid? schoolId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(*)
            FROM user_session
            WHERE user_id = @UserId
              AND school_id IS NOT DISTINCT FROM @SchoolId
              AND status = 'ACTIVE'::session_status
              AND expires_at > NOW()
            """;

        var parameters = new DynamicParameters();
        parameters.Add("UserId", userId, System.Data.DbType.Guid);
        parameters.Add("SchoolId", schoolId, System.Data.DbType.Guid);

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }

    public async Task<UserSession?> GetOldestActiveSessionAsync(Guid userId, Guid? schoolId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, tenant_id AS TenantId, school_id AS SchoolId, user_id AS UserId,
                   refresh_token_hash AS RefreshTokenHash, device_fingerprint AS DeviceFingerprint,
                   user_agent AS UserAgent, ip_address AS IpAddress,
                   started_at AS StartedAt, last_seen_at AS LastSeenAt, expires_at AS ExpiresAt,
                   ended_at AS EndedAt, status::TEXT AS Status
            FROM user_session
            WHERE user_id = @UserId
              AND school_id IS NOT DISTINCT FROM @SchoolId
              AND status = 'ACTIVE'::session_status
              AND expires_at > NOW()
            ORDER BY started_at ASC
            LIMIT 1
            """;

        var parameters = new DynamicParameters();
        parameters.Add("UserId", userId, System.Data.DbType.Guid);
        parameters.Add("SchoolId", schoolId, System.Data.DbType.Guid);

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UserSession>(
            new CommandDefinition(sql, parameters, cancellationToken: ct));
    }

    public async Task<UserSession?> FindSessionByIdAsync(Guid sessionId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, tenant_id AS TenantId, school_id AS SchoolId, user_id AS UserId,
                   refresh_token_hash AS RefreshTokenHash, device_fingerprint AS DeviceFingerprint,
                   user_agent AS UserAgent, ip_address AS IpAddress,
                   started_at AS StartedAt, last_seen_at AS LastSeenAt, ended_at AS EndedAt, status::TEXT AS Status
            FROM user_session
            WHERE id = @SessionId
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UserSession>(
            new CommandDefinition(sql, new { SessionId = sessionId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<UserSession>> GetUserSessionsAsync(Guid userId, bool activeOnly = true, CancellationToken ct = default)
    {
        var sql = activeOnly
            ? """
              SELECT id, tenant_id AS TenantId, school_id AS SchoolId, user_id AS UserId,
                     refresh_token_hash AS RefreshTokenHash, device_fingerprint AS DeviceFingerprint,
                     user_agent AS UserAgent, ip_address AS IpAddress,
                     started_at AS StartedAt, last_seen_at AS LastSeenAt, ended_at AS EndedAt, status::TEXT AS Status
              FROM user_session
              WHERE user_id = @UserId AND status = 'ACTIVE'::session_status
              ORDER BY started_at DESC
              """
            : """
              SELECT id, tenant_id AS TenantId, school_id AS SchoolId, user_id AS UserId,
                     refresh_token_hash AS RefreshTokenHash, device_fingerprint AS DeviceFingerprint,
                     user_agent AS UserAgent, ip_address AS IpAddress,
                     started_at AS StartedAt, last_seen_at AS LastSeenAt, ended_at AS EndedAt, status::TEXT AS Status
              FROM user_session
              WHERE user_id = @UserId
              ORDER BY started_at DESC
              LIMIT 200
              """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var sessions = await conn.QueryAsync<UserSession>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));

        return sessions.AsList();
    }

    public async Task<AdminSessionDashboardDto> GetAdminSessionDashboardAsync(Guid? tenantId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start24h = now.Date;
        var start7d = now.Date.AddDays(-6);
        var start30d = now.Date.AddDays(-29);

        const string sql = """
            SELECT metric, bucket, count
            FROM (
                SELECT 1 AS metric,
                       FLOOR(DATE_PART('hour', started_at) / 2)::int AS bucket,
                       COUNT(*) AS count
                FROM user_session
                WHERE started_at >= @Start24h
                  AND (@TenantId IS NULL OR tenant_id = @TenantId)
                GROUP BY 1, 2

                UNION ALL

                SELECT 2 AS metric,
                       EXTRACT(dow FROM started_at)::int AS bucket,
                       COUNT(*) AS count
                FROM user_session
                WHERE started_at >= @Start7d
                  AND started_at < @Start7d + INTERVAL '7 day'
                  AND (@TenantId IS NULL OR tenant_id = @TenantId)
                GROUP BY 1, 2

                UNION ALL

                SELECT 3 AS metric,
                       LEAST(3, (started_at::date - @Start30d::date) / 7)::int AS bucket,
                       COUNT(*) AS count
                FROM user_session
                WHERE started_at >= @Start30d
                  AND (@TenantId IS NULL OR tenant_id = @TenantId)
                GROUP BY 1, 2
            ) AS summary
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var counts = await conn.QueryAsync<SessionDashboardCount>(
            new CommandDefinition(sql, new { Start24h = start24h, Start7d = start7d, Start30d = start30d, TenantId = tenantId }, cancellationToken: ct));

        var hours = new long[12];
        var days = new long[7];
        var weeks = new long[4];

        foreach (var item in counts)
        {
            switch (item.Metric)
            {
                case 1 when item.Bucket >= 0 && item.Bucket < hours.Length:
                    hours[item.Bucket] = item.Count;
                    break;
                case 2 when item.Bucket >= 0 && item.Bucket <= 6:
                    var dayIndex = item.Bucket == 0 ? 6 : item.Bucket - 1;
                    days[dayIndex] = item.Count;
                    break;
                case 3 when item.Bucket >= 0 && item.Bucket < weeks.Length:
                    weeks[item.Bucket] = item.Count;
                    break;
            }
        }

        var labels24h = new[] { "00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00" };
        var labels7d = new[] { "T2", "T3", "T4", "T5", "T6", "T7", "CN" };
        var labels30d = new[] { "Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4" };

        return new AdminSessionDashboardDto(
            new DashboardTimeSeriesDto(labels24h, hours),
            new DashboardTimeSeriesDto(labels7d, days),
            new DashboardTimeSeriesDto(labels30d, weeks));
    }

    private sealed record SessionDashboardCount(int Metric, int Bucket, long Count);
}
