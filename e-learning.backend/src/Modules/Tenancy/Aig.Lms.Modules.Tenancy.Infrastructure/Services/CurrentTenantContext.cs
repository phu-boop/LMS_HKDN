using Aig.Lms.BuildingBlocks.Contracts.Tenancy;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

/// <summary>
/// Scoped, mutable context set once per request by TenantResolutionMiddleware.
/// Registered as both ICurrentTenant and CurrentTenantContext so the middleware
/// can call Set(...) while consumers depend only on ICurrentTenant.
/// </summary>
public sealed class CurrentTenantContext : ICurrentTenant
{
    public Guid? TenantId { get; private set; }
    public string? TenantCode { get; private set; }
    public string? Subdomain { get; private set; }
    public bool IsResolved => TenantId.HasValue;

    public void Set(Guid tenantId, string tenantCode, string subdomain)
    {
        TenantId = tenantId;
        TenantCode = tenantCode;
        Subdomain = subdomain;
    }
}
