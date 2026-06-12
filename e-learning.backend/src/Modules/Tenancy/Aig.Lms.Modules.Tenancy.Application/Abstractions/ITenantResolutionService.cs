namespace Aig.Lms.Modules.Tenancy.Application.Abstractions;

public interface ITenantResolutionService
{
    Task<TenantDomainResolution> ResolveAsync(string? domain, CancellationToken ct = default);
    Task<TenantSummary?> GetByTenantIdAsync(Guid tenantId, CancellationToken ct = default);
    Task<TenantSummary?> GetBySubdomainAsync(string? subdomain, CancellationToken ct = default);
}

public sealed record TenantDomainResolution(
    string RequestedDomain,
    bool IsResolvable,
    bool IsLocalHost,
    bool IsAdminDomain,
    string? TargetSubdomain,
    TenantSummary? Tenant);

public sealed record TenantSummary(
    Guid TenantId,
    string TenantCode,
    string Name,
    string Subdomain,
    string Domain,
    string Status,
    TenantBrandingInfo Branding);

public sealed record TenantBrandingInfo(
    string? LogoUrl,
    string? AvatarUrl,
    string? WatermarkSettings);