using Aig.Lms.Modules.Catalog.Domain.Entities;
using Aig.Lms.Modules.Catalog.Domain.Repositories;
using Dapper;

namespace Aig.Lms.Modules.Catalog.Infrastructure.Persistence.Repositories;

public sealed class CatalogRepository : ICatalogRepository
{
    private readonly CatalogDbContext _context;

    public CatalogRepository(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CatalogItem>> GetByTypeAsync(
        string type, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, type, code, name, description,
                   sort_order AS SortOrder,
                   is_system  AS IsSystem,
                   is_active  AS IsActive,
                   is_deleted AS IsDeleted,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM catalog_item
            WHERE type = @Type AND is_deleted = FALSE
            ORDER BY sort_order, name
            """;

        await using var conn = _context.CreateConnection();
        var rows = await conn.QueryAsync<CatalogRow>(
            new CommandDefinition(sql, new { Type = type }, cancellationToken: ct));

        return rows.Select(r => r.ToDomain()).ToList();
    }

    public async Task<CatalogItem?> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, type, code, name, description,
                   sort_order AS SortOrder,
                   is_system  AS IsSystem,
                   is_active  AS IsActive,
                   is_deleted AS IsDeleted,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM catalog_item
            WHERE id = @Id AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<CatalogRow>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task<bool> ExistsByCodeAsync(
        string type, string code, Guid? excludeId = null, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1) FROM catalog_item
            WHERE type = @Type AND code = @Code
              AND is_deleted = FALSE
              AND (@ExcludeId IS NULL OR id <> @ExcludeId)
            """;

        await using var conn = _context.CreateConnection();
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql,
                new { Type = type, Code = code, ExcludeId = excludeId },
                cancellationToken: ct));
        return count > 0;
    }

    public Task<bool> IsInUseAsync(Guid id, CancellationToken ct = default)
    {
        // Extension point: as other modules gain FK references to catalog_item,
        // add SQL checks here. For now, no other table references catalog_item.
        return Task.FromResult(false);
    }

    public async Task AddAsync(CatalogItem item, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO catalog_item
                (id, type, code, name, description, sort_order, is_system, is_active, is_deleted, created_at, updated_at)
            VALUES
                (@Id, @Type, @Code, @Name, @Description, @SortOrder, @IsSystem, @IsActive, @IsDeleted, @CreatedAt, @UpdatedAt)
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql,
            new
            {
                item.Id,
                item.Type,
                item.Code,
                item.Name,
                item.Description,
                item.SortOrder,
                item.IsSystem,
                item.IsActive,
                item.IsDeleted,
                item.CreatedAt,
                item.UpdatedAt
            },
            cancellationToken: ct));
    }

    public async Task UpdateAsync(CatalogItem item, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE catalog_item
            SET name        = @Name,
                description = @Description,
                sort_order  = @SortOrder,
                updated_at  = @UpdatedAt
            WHERE id = @Id AND is_deleted = FALSE
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql,
            new
            {
                item.Id,
                item.Name,
                item.Description,
                item.SortOrder,
                item.UpdatedAt
            },
            cancellationToken: ct));
    }

    public async Task DeleteAsync(CatalogItem item, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE catalog_item
            SET is_deleted = TRUE, updated_at = @UpdatedAt
            WHERE id = @Id
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql,
            new { item.Id, item.UpdatedAt },
            cancellationToken: ct));
    }

    // ---------------------------------------------------------------------------
    // Private row mapping
    // ---------------------------------------------------------------------------

    private sealed record CatalogRow(
        Guid Id,
        string Type,
        string Code,
        string Name,
        string? Description,
        int SortOrder,
        bool IsSystem,
        bool IsActive,
        bool IsDeleted,
        DateTime CreatedAt,
        DateTime UpdatedAt)
    {
        public CatalogItem ToDomain() =>
            CatalogItem.Reconstitute(
                Id, Type, Code, Name, Description,
                SortOrder, IsSystem, IsActive, IsDeleted,
                CreatedAt, UpdatedAt);
    }
}
