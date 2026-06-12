using Aig.Lms.Modules.Reports.Application;
using Aig.Lms.Modules.Reports.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Reports.Infrastructure;

public static class ReportsModule
{
    public static IServiceCollection AddReportsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IReportRepository, ReportRepository>();
        return services;
    }
}
