using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;
using Aig.Lms.Modules.Tenancy.Infrastructure.Persistence;
using Dapper;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Persistence.Repositories;

public sealed class TenantReadRepository : ITenantReadRepository
{
    private readonly TenancyDbContext _context;

    public TenantReadRepository(TenancyDbContext context)
    {
        _context = context;
    }

    public async Task<TenantDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
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
        return await conn.QueryFirstOrDefaultAsync<TenantDto>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<TenantDto?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default)
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
        return await conn.QueryFirstOrDefaultAsync<TenantDto>(
            new CommandDefinition(sql, new { Subdomain = subdomain.ToLowerInvariant() }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<TenantListItemDto>> ListAsync(
        int page,
        int pageSize,
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        var sql = """
            SELECT id, code, name, subdomain,
                   logo_url AS LogoUrl,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM tenant
            WHERE is_deleted = FALSE AND status != 'DELETED'::common_status
            """;

        if (!string.IsNullOrWhiteSpace(status))
            sql += " AND status = @Status::common_status";

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (name ILIKE @Search OR code ILIKE @Search OR subdomain ILIKE @Search)";

        sql += " ORDER BY name ASC LIMIT @PageSize OFFSET @Offset";

        await using var conn = _context.CreateConnection();
        var results = await conn.QueryAsync<TenantListItemDto>(new CommandDefinition(sql, new
        {
            Status = string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToUpperInvariant(),
            Search = $"%{search?.Trim()}%",
            PageSize = pageSize,
            Offset = (page - 1) * pageSize,
        }, cancellationToken: ct));

        return results.AsList();
    }

    public async Task<int> CountAsync(string? status, string? search, CancellationToken ct = default)
    {
        var sql = "SELECT COUNT(1) FROM tenant WHERE is_deleted = FALSE AND status != 'DELETED'::common_status";

        if (!string.IsNullOrWhiteSpace(status))
            sql += " AND status = @Status::common_status";

        if (!string.IsNullOrWhiteSpace(search))
            sql += " AND (name ILIKE @Search OR code ILIKE @Search OR subdomain ILIKE @Search)";

        await using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new
        {
            Status = string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToUpperInvariant(),
            Search = $"%{search?.Trim()}%",
        }, cancellationToken: ct));
    }
}