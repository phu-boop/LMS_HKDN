using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Infrastructure.Roles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Authorization.Infrastructure;

public static class AuthorizationModule
{
    public static IServiceCollection AddAuthorizationModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IAuthorizationRepository, AuthorizationRepository>();
        services.AddScoped<ListRolesQueryHandler>();
        services.AddScoped<GetRolesWithPermissionsQueryHandler>();
        services.AddScoped<GetUserRolesQueryHandler>();
        services.AddScoped<AssignRoleCommandHandler>();
        services.AddScoped<RevokeRoleCommandHandler>();
        services.AddScoped<ListPermissionsQueryHandler>();
        services.AddScoped<GetRolePermissionsQueryHandler>();
        services.AddScoped<GetUserPermissionsQueryHandler>();

        return services;
    }
}
