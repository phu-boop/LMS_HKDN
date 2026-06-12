using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Infrastructure.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Users.Infrastructure;

public static class UsersModule
{
    public static IServiceCollection AddUsersModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<IUserRoleAssignmentService, UserRoleAssignmentService>();
        services.AddScoped<CreateUserCommandHandler>();
        services.AddScoped<UpdateUserCommandHandler>();
        services.AddScoped<ChangeUserStatusCommandHandler>();
        services.AddScoped<ResetPasswordCommandHandler>();
        services.AddScoped<BulkImportUsersCommandHandler>();
        services.AddScoped<GetUserTenantsQueryHandler>();
        services.AddScoped<AssignUserTenantCommandHandler>();
        services.AddScoped<RemoveUserTenantCommandHandler>();
        services.AddScoped<GetSchoolUsersQueryHandler>();
        services.AddScoped<GetTenantMembersQueryHandler>();

        return services;
    }
}
