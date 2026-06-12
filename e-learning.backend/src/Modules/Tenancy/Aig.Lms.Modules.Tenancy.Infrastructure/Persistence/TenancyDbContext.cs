using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Persistence;

public sealed class TenancyDbContext
{
    private readonly string _connectionString;

    public TenancyDbContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public NpgsqlConnection CreateConnection() => new(_connectionString);
}
