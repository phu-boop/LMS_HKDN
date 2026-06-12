using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Infrastructure.Persistence;
using Dapper;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Persistence.Repositories;

public sealed class TenantRepository : ITenantRepository
{
    private readonly TenancyDbContext _context;

    public TenantRepository(TenancyDbContext context)
    {
        _context = context;
    }

    public async Task<Tenant?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, code, name, subdomain,
                   logo_url AS LogoUrl,
                   avatar_url AS AvatarUrl,
                   description,
                   watermark_settings::TEXT AS WatermarkSettings,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM tenant
            WHERE id = @Id AND is_deleted = FALSE AND status != 'DELETED'::common_status
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, code, name, subdomain,
                   logo_url AS LogoUrl,
                   avatar_url AS AvatarUrl,
                   description,
                   watermark_settings::TEXT AS WatermarkSettings,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM tenant
            WHERE subdomain = @Subdomain AND is_deleted = FALSE AND status != 'DELETED'::common_status
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new { Subdomain = subdomain.ToLowerInvariant() }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task<Tenant?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, code, name, subdomain,
                   logo_url AS LogoUrl,
                   avatar_url AS AvatarUrl,
                   description,
                   watermark_settings::TEXT AS WatermarkSettings,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM tenant
            WHERE code = @Code AND is_deleted = FALSE AND status != 'DELETED'::common_status
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<TenantRow>(
            new CommandDefinition(sql, new { Code = code.ToUpperInvariant() }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task<bool> ExistsBySubdomainAsync(
        string subdomain,
        Guid? excludedTenantId = null,
        CancellationToken ct = default)
    {
        var sql = "SELECT COUNT(1) FROM tenant WHERE subdomain = @Subdomain AND is_deleted = FALSE AND status != 'DELETED'::common_status";
        if (excludedTenantId.HasValue)
            sql += " AND id <> @ExcludedTenantId";

        await using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new
        {
            Subdomain = subdomain.ToLowerInvariant(),
            ExcludedTenantId = excludedTenantId,
        }, cancellationToken: ct));
        return count > 0;
    }

    public async Task<bool> ExistsByCodeAsync(
        string code,
        Guid? excludedTenantId = null,
        CancellationToken ct = default)
    {
        var sql = "SELECT COUNT(1) FROM tenant WHERE code = @Code AND is_deleted = FALSE AND status != 'DELETED'::common_status";
        if (excludedTenantId.HasValue)
            sql += " AND id <> @ExcludedTenantId";

        await using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new
        {
            Code = code.ToUpperInvariant(),
            ExcludedTenantId = excludedTenantId,
        }, cancellationToken: ct));
        return count > 0;
    }

    public async Task AddAsync(Tenant tenant, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO tenant (
                id, code, name, subdomain, logo_url, avatar_url, description, watermark_settings,
                status, is_deleted, created_at, updated_at)
            VALUES (
                @Id, @Code, @Name, @Subdomain, @LogoUrl, @AvatarUrl, @Description,
                CAST(@WatermarkSettings AS jsonb), @Status::common_status, FALSE, @CreatedAt, @UpdatedAt)
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            tenant.Id,
            Code = tenant.Code.Value,
            Name = tenant.Name,
            Subdomain = tenant.Subdomain.Value,
            tenant.LogoUrl,
            tenant.AvatarUrl,
            tenant.Description,
            tenant.WatermarkSettings,
            tenant.Status,
            tenant.CreatedAt,
            tenant.UpdatedAt,
        }, cancellationToken: ct));
    }

    public async Task UpdateAsync(Tenant tenant, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE tenant
            SET code = @Code,
                name = @Name,
                subdomain = @Subdomain,
                logo_url = @LogoUrl,
                avatar_url = @AvatarUrl,
                description = @Description,
                watermark_settings = CAST(@WatermarkSettings AS jsonb),
                status = @Status::common_status,
                updated_at = @UpdatedAt
            WHERE id = @Id AND is_deleted = FALSE AND status != 'DELETED'::common_status
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            tenant.Id,
            Code = tenant.Code.Value,
            Name = tenant.Name,
            Subdomain = tenant.Subdomain.Value,
            tenant.LogoUrl,
            tenant.AvatarUrl,
            tenant.Description,
            tenant.WatermarkSettings,
            tenant.Status,
            tenant.UpdatedAt,
        }, cancellationToken: ct));
    }

    private sealed record TenantRow(
        Guid Id,
        string Code,
        string Name,
        string Subdomain,
        string? LogoUrl,
        string? AvatarUrl,
        string? Description,
        string? WatermarkSettings,
        string Status,
        DateTime CreatedAt,
        DateTime UpdatedAt)
    {
        public Tenant ToDomain() =>
            Tenant.Reconstitute(
                Id,
                Name,
                Code,
                Subdomain,
                LogoUrl,
                AvatarUrl,
                Description,
                WatermarkSettings,
                Status,
                CreatedAt,
                UpdatedAt);
    }
}
