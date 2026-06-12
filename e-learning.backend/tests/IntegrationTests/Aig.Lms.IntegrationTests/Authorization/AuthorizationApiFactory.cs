extern alias apihost;

using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aig.Lms.IntegrationTests.Authorization;

public sealed class AuthorizationApiFactory : WebApplicationFactory<apihost::Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Tenant middleware — replace with in-memory to avoid DB calls
            services.RemoveAll<ITenantReadRepository>();
            services.AddSingleton<ITenantReadRepository>(new InMemoryTenantReadRepository(TenantTestData.All));

            // Permission check — replace with in-memory to control test behavior
            services.RemoveAll<IPermissionService>();
            services.AddSingleton<IPermissionService, InMemoryPermissionService>();

            // Authorization queries — replace with in-memory to avoid DB calls
            services.RemoveAll<IAuthorizationRepository>();
            services.AddSingleton<IAuthorizationRepository, InMemoryAuthorizationRepository>();
        });
    }
}
