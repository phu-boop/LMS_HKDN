extern alias apihost;

using Aig.Lms.IntegrationTests.Authorization;
using Aig.Lms.IntegrationTests;
using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Aig.Lms.IntegrationTests.ContentManagement;

public sealed class ContentManagementApiFactory : WebApplicationFactory<apihost::Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ITenantReadRepository>();
            services.AddSingleton<ITenantReadRepository>(new InMemoryTenantReadRepository(TenantTestData.All));

            services.RemoveAll<IPermissionService>();
            services.AddSingleton<IPermissionService, InMemoryPermissionService>();

            services.RemoveAll<IContentManagementRepository>();
            services.AddSingleton<IContentManagementRepository, InMemoryContentManagementRepository>();
        });
    }
}
