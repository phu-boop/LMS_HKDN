using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.CreateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.DeleteCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.UpdateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Queries.GetCatalogByType;
using Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetAllProvinces;
using Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetWardsByProvinceId;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Catalog.Application;

public static class CatalogApplicationModule
{
    public static IServiceCollection AddCatalogApplication(this IServiceCollection services)
    {
        services.AddScoped<GetCatalogByTypeHandler>();
        services.AddScoped<CreateCatalogItemHandler>();
        services.AddScoped<UpdateCatalogItemHandler>();
        services.AddScoped<DeleteCatalogItemHandler>();
        services.AddScoped<GetAllProvincesHandler>();
        services.AddScoped<GetWardsByProvinceIdHandler>();

        return services;
    }
}
