using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Catalog.Infrastructure.Persistence;

public sealed class CatalogDbContext
{
    private readonly string _connectionString;

    public CatalogDbContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public NpgsqlConnection CreateConnection() => new(_connectionString);
}
