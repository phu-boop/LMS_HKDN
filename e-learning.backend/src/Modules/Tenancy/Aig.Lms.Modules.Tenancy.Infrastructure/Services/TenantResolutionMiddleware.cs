using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public sealed class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly string[] _bypassPathPrefixes = ["/health", "/scalar", "/swagger"];

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        CurrentTenantContext currentTenant,
        ITenantResolutionService tenantResolutionService)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (_bypassPathPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        // Priority 1: Extract tenant from JWT token (if authenticated)
        var tenantIdClaim = context.User?.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantIdClaim) && Guid.TryParse(tenantIdClaim, out var tenantId))
        {
            var subdomainClaim = context.User?.FindFirst("subdomain")?.Value;
            var tenantCodeClaim = context.User?.FindFirst("tenant_code")?.Value;
            
            if (!string.IsNullOrEmpty(subdomainClaim))
            {
                currentTenant.Set(tenantId, tenantCodeClaim ?? subdomainClaim, subdomainClaim);
                await _next(context);
                return;
            }
        }

        // Priority 2: Resolve from Host header or ?domain= query param
        var requestedDomain = context.Request.Query.TryGetValue("domain", out var domainValues)
            ? domainValues.ToString()
            : context.Request.Host.Value;

        var resolution = await tenantResolutionService.ResolveAsync(requestedDomain, context.RequestAborted);
        if (!resolution.IsResolvable || resolution.IsAdminDomain || resolution.IsLocalHost)
        {
            // No tenant context found — proceed without tenant scope (OK for public/admin endpoints)
            await _next(context);
            return;
        }

        if (resolution.Tenant is null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new
            {
                error = $"Tenant could not be resolved from domain '{requestedDomain}'."
            });
            return;
        }

        currentTenant.Set(
            resolution.Tenant.TenantId,
            resolution.Tenant.TenantCode,
            resolution.Tenant.Subdomain);
        await _next(context);
    }
}