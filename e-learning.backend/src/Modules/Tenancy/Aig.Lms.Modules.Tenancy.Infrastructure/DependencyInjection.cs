using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.Tenancy.Application;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Domain.Services;
using Aig.Lms.Modules.Tenancy.Infrastructure.Persistence;
using Aig.Lms.Modules.Tenancy.Infrastructure.Persistence.Repositories;
using Aig.Lms.Modules.Tenancy.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Tenancy.Infrastructure;

public static class TenancyModule
{
    public static IServiceCollection AddTenancyModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<TenancyOptions>(configuration.GetSection(TenancyOptions.SectionName));

        // Persistence
        services.AddSingleton<TenancyDbContext>();

        // Repositories
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<ITenantReadRepository, TenantReadRepository>();

        // ICurrentTenant — single scoped instance accessible as both types
        services.AddScoped<CurrentTenantContext>();
        services.AddScoped<ICurrentTenant>(sp => sp.GetRequiredService<CurrentTenantContext>());

        services.AddSingleton<SubdomainPolicy>();
        services.AddSingleton(sp => sp.GetRequiredService<IOptions<TenancyOptions>>().Value);
        services.AddSingleton<TenantHostResolver>();
        services.AddScoped<ITenantResolutionService, TenantResolutionService>();

        // Application handlers
        services.AddTenancyApplication();

        return services;
    }
}