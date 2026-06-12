using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.ChangeTenantStatus;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.CreateTenant;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenantById;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenants;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Tenancy.Application;

public static class TenancyApplicationModule
{
    public static IServiceCollection AddTenancyApplication(this IServiceCollection services)
    {
        services.AddScoped<CreateTenantHandler>();
        services.AddScoped<UpdateTenantHandler>();
        services.AddScoped<ChangeTenantStatusHandler>();
        services.AddScoped<GetTenantByIdHandler>();
        services.AddScoped<GetTenantsHandler>();

        return services;
    }
}