using Aig.Lms.Modules.Users.Application.Users;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Users.Infrastructure.Users;

public sealed class UserRoleAssignmentService : IUserRoleAssignmentService
{
    private readonly string _connectionString;

    public UserRoleAssignmentService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task AssignRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_tenant_role_assignment (id, user_id, role_id, tenant_id, is_inherited, created_at)
            SELECT @Id, @UserId, @RoleId, @TenantId, FALSE, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM user_tenant_role_assignment
                WHERE user_id   = @UserId
                  AND role_id   = @RoleId
                  AND tenant_id = @TenantId
                  AND is_deleted = FALSE
            )
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id       = Guid.NewGuid(),
            UserId   = userId,
            RoleId   = roleId,
            TenantId = tenantId
        }, cancellationToken: ct));
    }

    public async Task AssignRoleByCodeAsync(Guid userId, string roleCode, Guid tenantId, CancellationToken ct = default)
    {
        const string lookupSql = "SELECT id FROM role WHERE code = @Code AND is_deleted = FALSE LIMIT 1";

        await using var conn = new NpgsqlConnection(_connectionString);
        var roleId = await conn.ExecuteScalarAsync<Guid?>(
            new CommandDefinition(lookupSql, new { Code = roleCode }, cancellationToken: ct));

        if (!roleId.HasValue)
            return; // unknown role code — skip silently

        await AssignRoleAsync(userId, roleId.Value, tenantId, ct);
    }

    public async Task InheritSchoolTenantsAsync(Guid userId, Guid schoolId, string? accountTypeCode, CancellationToken ct = default)
    {
        var roleCode = ResolveRoleCodeForSchoolUser(accountTypeCode);
        if (string.IsNullOrWhiteSpace(roleCode))
            return;

        const string tenantsSql = """
            SELECT tenant_id FROM school_tenant_mapping
            WHERE school_id  = @SchoolId
              AND is_deleted = FALSE
              AND status     = 'ACTIVE'
              AND (enforce_expiry = FALSE OR contract_end > NOW())
            """;

        const string insertSql = """
            INSERT INTO user_tenant_role_assignment (id, user_id, role_id, tenant_id, is_inherited, created_at)
            SELECT @Id, @UserId, r.id, @TenantId, TRUE, NOW()
            FROM role r
            WHERE r.code       = @RoleCode
              AND r.is_deleted = FALSE
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
        var tenantIds = (await conn.QueryAsync<Guid>(
            new CommandDefinition(tenantsSql, new { SchoolId = schoolId }, cancellationToken: ct))).AsList();

        foreach (var tenantId in tenantIds)
        {
            await conn.ExecuteAsync(new CommandDefinition(insertSql, new
            {
                Id       = Guid.NewGuid(),
                UserId   = userId,
                TenantId = tenantId,
                RoleCode = roleCode
            }, cancellationToken: ct));
        }
    }

    private static string? ResolveRoleCodeForSchoolUser(string? accountTypeCode)
    {
        if (string.IsNullOrWhiteSpace(accountTypeCode))
            return null;

        return accountTypeCode.Trim().ToUpperInvariant() switch
        {
            "SCHOOL" => "SCHOOL",
            // Backward compatibility for existing account types that are now unified as SCHOOL.
            "SCHOOL_ADMIN" => "SCHOOL",
            "TEACHER" => "SCHOOL",
            "STUDENT" => "SCHOOL",
            _ => accountTypeCode.Trim().ToUpperInvariant()
        };
    }
}
