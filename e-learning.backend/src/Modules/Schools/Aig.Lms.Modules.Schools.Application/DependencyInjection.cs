using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Schools.Application;

public static class SchoolsApplicationModule
{
    public static IServiceCollection AddSchoolsApplication(this IServiceCollection services)
    {
        services.AddScoped<CreateSchoolCommandHandler>();
        services.AddScoped<UpdateSchoolCommandHandler>();
        services.AddScoped<CreateSubscriptionCommandHandler>();
        services.AddScoped<CreateSubscriptionsBulkCommandHandler>();
        services.AddScoped<UpdateSubscriptionCommandHandler>();
        return services;
    }
}
