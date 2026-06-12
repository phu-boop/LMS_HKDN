using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Infrastructure.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Identity.Infrastructure;

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IdentifyCommandHandler>();
        services.AddScoped<LoginCommandHandler>();
        services.AddScoped<ChangePasswordCommandHandler>();
        services.AddScoped<RefreshTokenCommandHandler>();
        services.AddScoped<LogoutCommandHandler>();
        services.AddScoped<ResetPasswordCommandHandler>();
        services.AddScoped<GetSessionsQueryHandler>();
        services.AddScoped<GetAdminSessionDashboardQueryHandler>();
        services.AddScoped<RevokeSessionCommandHandler>();
        services.AddScoped<GetWorkspacesQueryHandler>();
        services.AddScoped<SelectWorkspaceCommandHandler>();
        services.AddScoped<RevokeAllOtherSessionsCommandHandler>();
        services.AddScoped<AdminRevokeAllUserSessionsCommandHandler>();

        return services;
    }
}
