using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

namespace Aig.Lms.Api.Extensions;

public static class OpenApiExtensions
{
    public static IServiceCollection AddOpenApiDocs(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, _) =>
            {
                document.Info.Title = "Aig LMS API";
                document.Info.Version = "v1";
                document.Info.Description = "E-Learning Management System — Backend API";

                // Add Bearer security scheme to the OpenAPI spec
                var components = document.Components ?? new OpenApiComponents();
                components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
                components.SecuritySchemes[JwtBearerDefaults.AuthenticationScheme] =
                    new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        Description = "Enter the JWT token obtained from POST /api/identity/auth/login"
                    };
                document.Components = components;

                return Task.CompletedTask;
            });
        });

        return services;
    }

    public static IEndpointRouteBuilder MapApiDocs(this IEndpointRouteBuilder app)
    {
        // Raw OpenAPI JSON — for integration with services and UIs
        app.MapOpenApi("/openapi/{documentName}.json");

        // Scalar UI — interactive API explorer for testing and sharing with the team
        app.MapScalarApiReference("/scalar", options =>
        {
            options
                .WithTitle("Aig LMS API")
                .WithOpenApiRoutePattern("/openapi/{documentName}.json")
                .AddServer("/", "Local")
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        }).AllowAnonymous();

        return app;
    }
}
