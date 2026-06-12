using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Domain;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Users.Infrastructure.Users;

public sealed class UsersRepository : IUsersRepository
{
    private readonly string _connectionString;

    public UsersRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task<bool> ExistsAsync(Guid? schoolId, string username, CancellationToken ct = default)
    {
        string sql;
        object param;

        if (schoolId.HasValue)
        {
            sql = """
                SELECT COUNT(1)
                FROM user_account
                WHERE home_school_id = @SchoolId AND username = @Username AND is_deleted = FALSE
                """;
            param = new { SchoolId = schoolId.Value, Username = username };
        }
        else
        {
            // For LMS_ADMIN / TENANT_ADMIN, username must be globally unique (no school)
            sql = """
                SELECT COUNT(1)
                FROM user_account
                WHERE home_school_id IS NULL AND username = @Username AND is_deleted = FALSE
                """;
            param = new { Username = username };
        }

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, param, cancellationToken: ct));

        return count > 0;
    }

    public async Task CreateAsync(User user, string passwordHash, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_account (id, home_school_id, username, email, password_hash, full_name, avatar_url,
                                      account_type, status, is_deleted, created_at, updated_at)
            VALUES (@Id, @SchoolId, @Username, @Email, @PasswordHash, @FullName, @AvatarUrl,
                    @AccountType::account_type, @Status::common_status, FALSE, NOW(), NOW())
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            user.Id,
            user.SchoolId,
            user.Username,
            user.Email,
            PasswordHash = passwordHash,
            user.FullName,
            user.AvatarUrl,
            user.AccountType,
            user.Status
        }, cancellationToken: ct));
    }

    public async Task<User?> GetByIdAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   home_school_id AS SchoolId,
                   (SELECT tenant_id FROM user_tenant_role_assignment WHERE user_id = @UserId AND is_deleted = FALSE LIMIT 1) AS TenantId,
                   username,
                   email,
                   full_name AS FullName,
                   avatar_url AS AvatarUrl,
                   status::TEXT AS Status,
                   account_type::TEXT AS AccountType
            FROM user_account
            WHERE id = @UserId AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<User>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<User>> ListUsersAsync(Guid? schoolId, Guid? tenantId, Guid? roleId, int page, int pageSize, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default)
    {
        var sql = """
            SELECT DISTINCT u.id,
                   u.home_school_id AS SchoolId,
                   (SELECT tenant_id FROM user_tenant_role_assignment utra WHERE utra.user_id = u.id AND utra.is_deleted = FALSE LIMIT 1) AS TenantId,
                   u.username,
                   u.email,
                   u.full_name AS FullName,
                   u.avatar_url AS AvatarUrl,
                   u.status::TEXT AS Status,
                   u.account_type::TEXT AS AccountType,
                   u.created_at
            FROM user_account u
            """;

        if (tenantId.HasValue || roleId.HasValue)
            sql += " INNER JOIN user_tenant_role_assignment utra ON utra.user_id = u.id AND utra.is_deleted = FALSE";

        sql += " WHERE u.is_deleted = FALSE";

        if (schoolId.HasValue)
            sql += " AND u.home_school_id = @SchoolId";

        if (tenantId.HasValue)
            sql += " AND utra.tenant_id = @TenantId";

        if (roleId.HasValue)
            sql += " AND utra.role_id = @RoleId";

        if (!string.IsNullOrWhiteSpace(status))
            sql += " AND u.status = @Status::common_status";

        if (!string.IsNullOrWhiteSpace(accountType))
            sql += " AND u.account_type = @AccountType::account_type";

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (u.username ILIKE @Search OR u.full_name ILIKE @Search OR u.email ILIKE @Search)";

        sql += " ORDER BY u.created_at DESC LIMIT @PageSize OFFSET @Offset";

        await using var conn = new NpgsqlConnection(_connectionString);
        var users = await conn.QueryAsync<User>(
            new CommandDefinition(sql, new
            {
                SchoolId    = schoolId,
                TenantId    = tenantId,
                RoleId      = roleId,
                Status      = status,
                AccountType = accountType,
                Search      = $"%{search}%",
                PageSize    = pageSize,
                Offset      = (page - 1) * pageSize
            }, cancellationToken: ct));

        return users.AsList();
    }

    public async Task<int> CountUsersAsync(Guid? schoolId, Guid? tenantId, Guid? roleId, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default)
    {
        var sql = """
            SELECT COUNT(DISTINCT u.id)
            FROM user_account u
            """;

        if (tenantId.HasValue || roleId.HasValue)
            sql += " INNER JOIN user_tenant_role_assignment utra ON utra.user_id = u.id AND utra.is_deleted = FALSE";

        sql += " WHERE u.is_deleted = FALSE";

        if (schoolId.HasValue)
            sql += " AND u.home_school_id = @SchoolId";

        if (tenantId.HasValue)
            sql += " AND utra.tenant_id = @TenantId";

        if (roleId.HasValue)
            sql += " AND utra.role_id = @RoleId";

        if (!string.IsNullOrWhiteSpace(status))
            sql += " AND u.status = @Status::common_status";

        if (!string.IsNullOrWhiteSpace(accountType))
            sql += " AND u.account_type = @AccountType::account_type";

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (u.username ILIKE @Search OR u.full_name ILIKE @Search OR u.email ILIKE @Search)";

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                SchoolId    = schoolId,
                TenantId    = tenantId,
                RoleId      = roleId,
                Status      = status,
                AccountType = accountType,
                Search      = $"%{search}%"
            }, cancellationToken: ct));
    }

    public async Task<UpdateUserResult?> UpdateAsync(UpdateUserCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET full_name    = @FullName,
                email        = @Email,
                status       = @Status::common_status,
                account_type = @AccountType::account_type,
                updated_at   = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            RETURNING id AS UserId,
                      username,
                      full_name AS FullName,
                      email,
                      status::TEXT AS Status,
                      account_type::TEXT AS AccountType,
                      home_school_id AS SchoolId,
                      (SELECT tenant_id FROM user_tenant_role_assignment WHERE user_id = @UserId AND is_deleted = FALSE LIMIT 1) AS TenantId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UpdateUserResult>(
            new CommandDefinition(sql, new
            {
                command.UserId,
                command.FullName,
                command.Email,
                command.Status,
                command.AccountType
            }, cancellationToken: ct));
    }

    public async Task<bool> ChangeStatusAsync(Guid userId, string status, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET status     = @Status::common_status,
                updated_at = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, Status = status }, cancellationToken: ct));

        return rows > 0;
    }

    public async Task<bool> SoftDeleteAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET is_deleted  = TRUE,
                status      = 'DELETED'::common_status,
                updated_at  = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));

        return rows > 0;
    }

    public async Task<bool> UpdateAvatarAsync(Guid userId, string avatarUrl, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET avatar_url  = @AvatarUrl,
                updated_at  = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, AvatarUrl = avatarUrl }, cancellationToken: ct));

        return rows > 0;
    }

    public async Task<bool> ResetPasswordAsync(Guid userId, string passwordHash, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_account
            SET password_hash          = @PasswordHash,
                failed_attempts        = 0,
                locked_until           = NULL,
                updated_at             = NOW()
            WHERE id = @UserId AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, PasswordHash = passwordHash }, cancellationToken: ct));

        return rows > 0;
    }

    // -----------------------------------------------------------------------
    // 2.6 — User-Tenant management
    // -----------------------------------------------------------------------

    public async Task<IReadOnlyList<UserTenantDto>> GetUserTenantsAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                a.tenant_id   AS TenantId,
                t.code        AS TenantCode,
                t.name        AS TenantName,
                a.role_id     AS RoleId,
                r.code        AS RoleCode,
                a.is_inherited AS IsInherited
            FROM user_tenant_role_assignment a
            JOIN tenant t ON t.id = a.tenant_id
            JOIN role   r ON r.id = a.role_id
            WHERE a.user_id    = @UserId
              AND a.is_deleted = FALSE
              AND t.is_deleted = FALSE
            ORDER BY t.name, r.code
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<UserTenantDto>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));

        return rows.AsList();
    }

    public async Task<bool> AssignUserTenantAsync(Guid userId, Guid tenantId, string roleCode, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_tenant_role_assignment (id, user_id, tenant_id, role_id, is_inherited, created_at)
            SELECT @Id, @UserId, @TenantId, r.id, FALSE, NOW()
            FROM role r
            WHERE r.code = @RoleCode AND r.is_deleted = FALSE
              AND NOT EXISTS (
                  SELECT 1 FROM user_tenant_role_assignment x
                  WHERE x.user_id    = @UserId
                    AND x.tenant_id  = @TenantId
                    AND x.role_id    = r.id
                    AND x.is_deleted = FALSE
              )
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { Id = Guid.NewGuid(), UserId = userId, TenantId = tenantId, RoleCode = roleCode }, cancellationToken: ct));

        return rows > 0;
    }

    public async Task<bool> RemoveUserTenantAsync(Guid userId, Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_tenant_role_assignment
            SET is_deleted = TRUE, updated_at = NOW()
            WHERE user_id    = @UserId
              AND tenant_id  = @TenantId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { UserId = userId, TenantId = tenantId }, cancellationToken: ct));

        return rows > 0;
    }

    // -----------------------------------------------------------------------
    // 2.7 — Users filtered by school
    // -----------------------------------------------------------------------

    public async Task<IReadOnlyList<User>> GetSchoolUsersAsync(
        Guid schoolId, int page, int pageSize,
        string? status = null, string? search = null, string? accountType = null,
        CancellationToken ct = default)
    {
        var sql = """
            SELECT id, home_school_id AS SchoolId, username, email, full_name AS FullName,
                   avatar_url AS AvatarUrl, status::TEXT AS Status, account_type::TEXT AS AccountType
            FROM user_account
            WHERE home_school_id = @SchoolId
              AND is_deleted = FALSE
            """ + BuildSchoolUserFilters(status, search, accountType) + """

            ORDER BY full_name
            LIMIT @PageSize OFFSET @Offset
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<User>(
            new CommandDefinition(sql,
                new { SchoolId = schoolId, Status = status, Search = $"%{search}%", AccountType = accountType, PageSize = pageSize, Offset = (page - 1) * pageSize },
                cancellationToken: ct));

        return rows.AsList();
    }

    public async Task<int> CountSchoolUsersAsync(
        Guid schoolId,
        string? status = null, string? search = null, string? accountType = null,
        CancellationToken ct = default)
    {
        var sql = """
            SELECT COUNT(*) FROM user_account
            WHERE home_school_id = @SchoolId
              AND is_deleted = FALSE
            """ + BuildSchoolUserFilters(status, search, accountType);

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql,
                new { SchoolId = schoolId, Status = status, Search = $"%{search}%", AccountType = accountType },
                cancellationToken: ct));
    }

    private static string BuildSchoolUserFilters(string? status, string? search, string? accountType)
    {
        var filters = new System.Text.StringBuilder();
        if (!string.IsNullOrWhiteSpace(status))
            filters.Append(" AND status = @Status::common_status");
        if (!string.IsNullOrWhiteSpace(search))
            filters.Append(" AND (username ILIKE @Search OR full_name ILIKE @Search OR email ILIKE @Search)");
        if (!string.IsNullOrWhiteSpace(accountType))
            filters.Append(" AND account_type = @AccountType::account_type");
        return filters.ToString();
    }

    // -----------------------------------------------------------------------
    // Tenant members — user + role in one query
    // -----------------------------------------------------------------------

    public async Task<IReadOnlyList<TenantMemberDto>> GetTenantMembersAsync(
        Guid tenantId, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var sql = """
            SELECT
                u.id            AS UserId,
                u.username      AS Username,
                u.full_name     AS FullName,
                u.avatar_url    AS AvatarUrl,
                u.email         AS Email,
                r.id            AS RoleId,
                r.code          AS RoleCode,
                r.name          AS RoleName,
                a.is_inherited  AS IsInherited,
                a.created_at    AS AssignedAt
            FROM user_tenant_role_assignment a
            JOIN user_account u ON u.id = a.user_id  AND u.is_deleted = FALSE
            JOIN role         r ON r.id = a.role_id  AND r.is_deleted = FALSE
            WHERE a.tenant_id  = @TenantId
                AND a.is_deleted = FALSE
                AND r.code = 'SCHOOL'
            """;

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (u.username ILIKE @Search OR u.full_name ILIKE @Search OR u.email ILIKE @Search)";

        sql += " ORDER BY u.full_name, r.code LIMIT @PageSize OFFSET @Offset";

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<TenantMemberDto>(
            new CommandDefinition(sql,
                new { TenantId = tenantId, Search = $"%{search}%", PageSize = pageSize, Offset = (page - 1) * pageSize },
                cancellationToken: ct));

        return rows.AsList();
    }

    public async Task<int> CountTenantMembersAsync(Guid tenantId, string? search, CancellationToken ct = default)
    {
        var sql = """
            SELECT COUNT(*)
            FROM user_tenant_role_assignment a
            JOIN user_account u ON u.id = a.user_id AND u.is_deleted = FALSE
            JOIN role         r ON r.id = a.role_id AND r.is_deleted = FALSE
            WHERE a.tenant_id  = @TenantId
              AND a.is_deleted = FALSE
              AND r.code NOT IN ('TEACHER', 'STUDENT')
            """;

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (u.username ILIKE @Search OR u.full_name ILIKE @Search OR u.email ILIKE @Search)";

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql,
                new { TenantId = tenantId, Search = $"%{search}%" },
                cancellationToken: ct));
    }
}
