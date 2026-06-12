using Aig.Lms.Modules.Catalog.Domain.Entities;
using Aig.Lms.Modules.Catalog.Domain.Repositories;
using Dapper;

namespace Aig.Lms.Modules.Catalog.Infrastructure.Persistence.Repositories;

public sealed class ProvinceWardRepository : IProvinceWardRepository
{
    private readonly CatalogDbContext _context;

    public ProvinceWardRepository(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Province>> GetAllProvincesAsync(CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM provinces
            ORDER BY id
            """;

        await using var conn = _context.CreateConnection();
        var rows = await conn.QueryAsync<ProvinceRow>(
            new CommandDefinition(sql, cancellationToken: ct));

        return rows.Select(r => r.ToDomain()).ToList();
    }

    public async Task<Province?> GetProvinceByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, name,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM provinces
            WHERE id = @Id
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<ProvinceRow>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task<IReadOnlyList<Ward>> GetWardsByProvinceIdAsync(int provinceId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, province_id AS ProvinceId, name,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM wards
            WHERE province_id = @ProvinceId
            ORDER BY id
            """;

        await using var conn = _context.CreateConnection();
        var rows = await conn.QueryAsync<WardRow>(
            new CommandDefinition(sql, new { ProvinceId = provinceId }, cancellationToken: ct));

        return rows.Select(r => r.ToDomain()).ToList();
    }

    public async Task<Ward?> GetWardByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id, province_id AS ProvinceId, name,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM wards
            WHERE id = @Id
            LIMIT 1
            """;

        await using var conn = _context.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<WardRow>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return row?.ToDomain();
    }

    public async Task AddProvinceAsync(Province province, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO provinces (name, created_at, updated_at)
            VALUES (@Name, @CreatedAt, @UpdatedAt)
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql,
            new
            {
                province.Name,
                province.CreatedAt,
                province.UpdatedAt
            },
            cancellationToken: ct));
    }

    public async Task AddWardAsync(Ward ward, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO wards (province_id, name, created_at, updated_at)
            VALUES (@ProvinceId, @Name, @CreatedAt, @UpdatedAt)
            """;

        await using var conn = _context.CreateConnection();
        await conn.ExecuteAsync(new CommandDefinition(sql,
            new
            {
                ward.ProvinceId,
                ward.Name,
                ward.CreatedAt,
                ward.UpdatedAt
            },
            cancellationToken: ct));
    }

    // Internal row classes for Dapper mapping
    private sealed class ProvinceRow
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Province ToDomain() => Province.Reconstitute(Id, Name, CreatedAt, UpdatedAt);
    }

    private sealed class WardRow
    {
        public int Id { get; set; }
        public int ProvinceId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Ward ToDomain() => Ward.Reconstitute(Id, ProvinceId, Name, CreatedAt, UpdatedAt);
    }
}
