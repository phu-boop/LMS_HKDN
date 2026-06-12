using Aig.Lms.Modules.Schools.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Schools.Infrastructure;

public static class SchoolsModule
{
    public static IServiceCollection AddSchoolsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<ISchoolRepository, SchoolRepository>();
        services.AddSchoolsApplication();
        return services;
    }
}
