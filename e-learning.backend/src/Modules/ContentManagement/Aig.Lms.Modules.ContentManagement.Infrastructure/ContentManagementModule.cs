using Aig.Lms.Modules.ContentManagement.Application;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Infrastructure.Curriculum;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.ContentManagement.Infrastructure;

public static class ContentManagementModule
{
    public static IServiceCollection AddContentManagementModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IContentManagementRepository, ContentManagementRepository>();
        services.AddContentManagementApplication();
        return services;
    }
}
