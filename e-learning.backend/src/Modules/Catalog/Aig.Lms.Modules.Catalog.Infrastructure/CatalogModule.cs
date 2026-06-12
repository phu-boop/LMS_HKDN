using Aig.Lms.Modules.Catalog.Application;
using Aig.Lms.Modules.Catalog.Domain.Repositories;
using Aig.Lms.Modules.Catalog.Infrastructure.Persistence;
using Aig.Lms.Modules.Catalog.Infrastructure.Persistence.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Catalog.Infrastructure;

public static class CatalogModule
{
    public static IServiceCollection AddCatalogModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<CatalogDbContext>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IProvinceWardRepository, ProvinceWardRepository>();
        services.AddCatalogApplication();

        return services;
    }
}
