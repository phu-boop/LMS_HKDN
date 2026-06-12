using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.ContentManagement.Application;

public static class ContentManagementApplicationModule
{
    public static IServiceCollection AddContentManagementApplication(this IServiceCollection services)
    {
        // Curriculum handlers
        services.AddScoped<GetCurriculumTreeQueryHandler>();
        services.AddScoped<GetCurriculumChildrenQueryHandler>();
        services.AddScoped<CreateCurriculumNodeCommandHandler>();
        services.AddScoped<UpdateCurriculumNodeCommandHandler>();
        services.AddScoped<DeleteCurriculumNodeCommandHandler>();
        services.AddScoped<ReorderCurriculumCommandHandler>();

        // Content handlers
        services.AddScoped<ListContentsQueryHandler>();
        services.AddScoped<GetContentQueryHandler>();
        services.AddScoped<CreateContentCommandHandler>();
        services.AddScoped<UpdateContentCommandHandler>();
        services.AddScoped<UpdateContentStatusCommandHandler>();
        services.AddScoped<ConfirmUploadCommandHandler>();
        services.AddScoped<DeleteContentCommandHandler>();

        // Permission distribution handlers
        services.AddScoped<ListContentPermissionsQueryHandler>();
        services.AddScoped<GrantContentPermissionCommandHandler>();
        services.AddScoped<DeleteContentPermissionCommandHandler>();
        services.AddScoped<NodePermissionViewQueryHandler>();
        services.AddScoped<NodePermissionsViewQueryHandler>();
        services.AddScoped<UserEffectivePermissionsQueryHandler>();

        return services;
    }
}
