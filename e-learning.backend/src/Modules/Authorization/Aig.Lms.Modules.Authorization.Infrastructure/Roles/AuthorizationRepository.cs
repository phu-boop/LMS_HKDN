using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Domain;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Authorization.Infrastructure.Roles;

public sealed class AuthorizationRepository : IAuthorizationRepository
{
    private const string LMS_ADMIN = "LMS_ADMIN";
    private const string TENANT_ADMIN = "TENANT_ADMIN";
    private const string SCHOOL = "SCHOOL";
    private static readonly string[] AdminRoles = [LMS_ADMIN, TENANT_ADMIN, SCHOOL];

    private readonly string _connectionString;

    public AuthorizationRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task<IReadOnlyList<Role>> GetAllRolesAsync(string? roleType = null, CancellationToken ct = default)
    {
        var sql = """
            SELECT id, code, name
            FROM role
            """;

        object? parameters = null;
        if (!string.IsNullOrWhiteSpace(roleType) && roleType.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            sql += " WHERE code = ANY(@AdminRoles)";
            parameters = new { AdminRoles };
        }

        sql += " ORDER BY name";

        await using var conn = new NpgsqlConnection(_connectionString);
        var roles = await conn.QueryAsync<Role>(new CommandDefinition(sql, parameters, cancellationToken: ct));
        return roles.AsList();
    }

    public async Task<IReadOnlyList<UserTenantRoleAssignment>> GetUserRolesAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT utra.id, utra.user_id AS UserId, utra.role_id AS RoleId,
                   r.code AS RoleCode, r.name AS RoleName,
                   utra.tenant_id AS TenantId, utra.assigned_by AS AssignedBy,
                   utra.is_active AS IsActive, utra.created_at AS CreatedAt
            FROM user_tenant_role_assignment utra
            INNER JOIN role r ON r.id = utra.role_id
            WHERE utra.user_id = @UserId AND utra.is_active = TRUE
            ORDER BY r.name
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<UserTenantRoleAssignment>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<bool> RoleExistsAsync(Guid roleId, CancellationToken ct = default)
    {
        const string sql = "SELECT COUNT(1) FROM role WHERE id = @RoleId";

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { RoleId = roleId }, cancellationToken: ct));
        return count > 0;
    }

    public async Task AssignRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_tenant_role_assignment (id, user_id, role_id, tenant_id, is_active, created_at)
            VALUES (@Id, @UserId, @RoleId, @TenantId, TRUE, NOW())
            ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
                SET is_active = TRUE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoleId = roleId,
            TenantId = tenantId
        }, cancellationToken: ct));
    }

    public async Task<bool> RevokeRoleAsync(Guid userId, Guid roleId, Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE user_tenant_role_assignment
            SET is_active = FALSE
            WHERE user_id   = @UserId
              AND role_id   = @RoleId
              AND tenant_id = @TenantId
              AND is_active = TRUE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            UserId = userId,
            RoleId = roleId,
            TenantId = tenantId
        }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<IReadOnlyList<string>> GetPermissionCodesByRoleCodesAsync(IEnumerable<string> roleCodes, CancellationToken ct = default)
    {
        const string sql = """
            SELECT DISTINCT p.code
            FROM permission p
            INNER JOIN role_permission rp ON rp.permission_id = p.id
            INNER JOIN role r ON r.id = rp.role_id
            WHERE r.code = ANY(@RoleCodes)
            ORDER BY p.code
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var codes = await conn.QueryAsync<string>(
            new CommandDefinition(sql, new { RoleCodes = roleCodes.ToArray() }, cancellationToken: ct));
        return codes.AsList();
    }

    public async Task<IReadOnlyList<Permission>> GetAllPermissionsAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, code, module, description
            FROM permission
            ORDER BY module, code
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var permissions = await conn.QueryAsync<Permission>(
            new CommandDefinition(sql, cancellationToken: ct));
        return permissions.AsList();
    }

    public async Task<IReadOnlyList<Permission>> GetPermissionsByRoleIdAsync(Guid roleId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT p.id, p.code, p.module, p.description
            FROM permission p
            INNER JOIN role_permission rp ON rp.permission_id = p.id
            WHERE rp.role_id = @RoleId
            ORDER BY p.module, p.code
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var permissions = await conn.QueryAsync<Permission>(
            new CommandDefinition(sql, new { RoleId = roleId }, cancellationToken: ct));
        return permissions.AsList();
    }
}
