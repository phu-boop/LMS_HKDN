using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.ChangeTenantStatus;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.CreateTenant;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenantById;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenants;
using Aig.Lms.Modules.Tenancy.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Aig.Lms.Modules.Tenancy.Api.Endpoints;

public static class TenantEndpoints
{
    public static IEndpointRouteBuilder MapTenantEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tenants/resolve", async (
            [FromQuery] string? domain,
            HttpContext httpContext,
            [FromServices] ITenantResolutionService tenantResolutionService,
            CancellationToken ct) =>
        {
            var requestedDomain = string.IsNullOrWhiteSpace(domain)
                ? httpContext.Request.Host.Value
                : domain;

            var resolution = await tenantResolutionService.ResolveAsync(requestedDomain, ct);
            if (!resolution.IsResolvable)
            {
                return Results.BadRequest(new
                {
                    error = "The supplied domain is not a valid tenant or admin domain."
                });
            }

            if (resolution.Tenant is null)
            {
                return Results.NotFound(new
                {
                    error = $"Tenant could not be resolved from domain '{requestedDomain}'."
                });
            }

            return Results.Ok(new ResolveTenantResponse(
                resolution.Tenant.TenantId,
                resolution.Tenant.TenantCode,
                resolution.Tenant.Name,
                resolution.Tenant.Subdomain,
                resolution.Tenant.Domain,
                resolution.Tenant.Status,
                resolution.IsAdminDomain,
                new TenantBrandingResponse(
                    resolution.Tenant.Branding.LogoUrl,
                    resolution.Tenant.Branding.AvatarUrl,
                    resolution.Tenant.Branding.WatermarkSettings)));
        })
        .WithName("ResolveTenantByDomain")
        .WithSummary("Resolve tenant branding from a domain or host")
        .Produces<ResolveTenantResponse>()
        .ProducesProblem(400)
        .ProducesProblem(404)
        .AllowAnonymous();

        var group = app.MapGroup("/api/admin/tenants")
            .WithTags("Admin Tenants")
            .RequireAuthorization();

        group.MapGet("/", async (
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? status,
            [FromQuery] string? search,
            [FromServices] GetTenantsHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetTenantsQuery(page, pageSize, status, search), ct);
            return Results.Ok(result);
        })
        .WithName("GetTenants")
        .WithSummary("List tenants with optional status and search filters")
        .Produces<GetTenantsResult>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:TENANTS_VIEW");

        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] GetTenantByIdHandler handler,
            CancellationToken ct) =>
        {
            var tenant = await handler.HandleAsync(new GetTenantByIdQuery(id), ct);
            return tenant is null ? Results.NotFound() : Results.Ok(tenant);
        })
        .WithName("GetTenantById")
        .WithSummary("Get tenant details by ID")
        .Produces<TenantDto>()
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:TENANTS_VIEW");

        group.MapPost("/", async (
            [FromBody] CreateTenantCommand command,
            [FromServices] CreateTenantHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var result = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/admin/tenants/{result.TenantId}", result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("CreateTenant")
        .WithSummary("Create a new tenant with branding settings")
        .Produces<CreateTenantResult>(201)
        .ProducesProblem(409)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:TENANTS_CREATE");

        group.MapPut("/{id:guid}", async (
            Guid id,
            [FromBody] UpdateTenantRequest body,
            [FromServices] UpdateTenantHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var result = await handler.HandleAsync(
                    new UpdateTenantCommand(
                        id,
                        body.Name,
                        body.Code,
                        body.Subdomain,
                        body.LogoUrl,
                        body.AvatarUrl,
                        body.Description,
                        body.WatermarkSettings),
                    ct);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                    ? Results.NotFound(new { error = ex.Message })
                    : Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("UpdateTenant")
        .WithSummary("Update tenant information and branding")
        .Produces<UpdateTenantResult>()
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:TENANTS_UPDATE");

        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            [FromBody] ChangeTenantStatusRequest body,
            [FromServices] ChangeTenantStatusHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var updated = await handler.HandleAsync(new ChangeTenantStatusCommand(id, body.Status), ct);
                return updated ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ChangeTenantStatus")
        .WithSummary("Change tenant status: ACTIVE | INACTIVE | LOCKED")
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:TENANTS_CHANGE_STATUS");

        return app;
    }
}

public sealed record UpdateTenantRequest(
    string Name,
    string Code,
    string Subdomain,
    string? LogoUrl,
    string? AvatarUrl,
    string? Description,
    string? WatermarkSettings);

public sealed record ChangeTenantStatusRequest(string Status);

public sealed record ResolveTenantResponse(
    Guid TenantId,
    string TenantCode,
    string Name,
    string Subdomain,
    string Domain,
    string Status,
    bool IsAdminDomain,
    TenantBrandingResponse Branding);

public sealed record TenantBrandingResponse(
    string? LogoUrl,
    string? AvatarUrl,
    string? WatermarkSettings);