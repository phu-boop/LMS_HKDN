extern alias apihost;

using System.Net;
using System.Text.Json;
using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aig.Lms.IntegrationTests;

public sealed class CustomApiFactory : WebApplicationFactory<apihost::Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ITenantReadRepository>();
            services.AddSingleton<ITenantReadRepository>(new InMemoryTenantReadRepository(TenantTestData.All));
            services.AddSingleton<IStartupFilter, TestCurrentTenantStartupFilter>();
        });
    }
}

internal sealed class TestCurrentTenantStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            next(app);

            app.Map("/_tests/current-tenant", branch =>
            {
                branch.Run(async context =>
                {
                    var currentTenant = context.RequestServices.GetRequiredService<ICurrentTenant>();
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    context.Response.ContentType = "application/json";

                    await JsonSerializer.SerializeAsync(context.Response.Body, new
                    {
                        tenantId = currentTenant.TenantId,
                        tenantCode = currentTenant.TenantCode,
                        subdomain = currentTenant.Subdomain,
                        isResolved = currentTenant.IsResolved
                    });
                });
            });
        };
    }
}