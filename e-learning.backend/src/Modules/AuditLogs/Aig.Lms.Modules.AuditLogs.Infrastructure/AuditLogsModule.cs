using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.AuditLogs.Application.GetAuditLogs;
using Aig.Lms.Modules.AuditLogs.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.AuditLogs.Infrastructure;

public static class AuditLogsModule
{
    public static IServiceCollection AddAuditLogsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAuditLogsRepository, AuditLogsRepository>();
        services.AddScoped<GetAuditLogsQueryHandler>();
        return services;
    }
}
