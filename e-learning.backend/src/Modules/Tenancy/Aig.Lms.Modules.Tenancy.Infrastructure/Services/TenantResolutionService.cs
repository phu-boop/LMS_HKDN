using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public sealed class TenantResolutionService : ITenantResolutionService
{
    private readonly ITenantReadRepository _tenantReadRepository;
    private readonly TenantHostResolver _hostResolver;

    public TenantResolutionService(
        ITenantReadRepository tenantReadRepository,
        TenantHostResolver hostResolver)
    {
        _tenantReadRepository = tenantReadRepository;
        _hostResolver = hostResolver;
    }

    public async Task<TenantDomainResolution> ResolveAsync(string? domain, CancellationToken ct = default)
    {
        var hostResolution = _hostResolver.Resolve(domain);
        if (!hostResolution.IsResolvable)
        {
            return new TenantDomainResolution(
                hostResolution.Host,
                false,
                hostResolution.IsLocalHost,
                hostResolution.IsAdminDomain,
                hostResolution.Subdomain,
                null);
        }

        var targetSubdomain = hostResolution.IsAdminDomain
            ? _hostResolver.Options.AdminSubdomain
            : hostResolution.Subdomain;

        var tenant = await GetBySubdomainAsync(targetSubdomain, ct);
        return new TenantDomainResolution(
            hostResolution.Host,
            true,
            hostResolution.IsLocalHost,
            hostResolution.IsAdminDomain,
            targetSubdomain,
            tenant);
    }

    public async Task<TenantSummary?> GetByTenantIdAsync(Guid tenantId, CancellationToken ct = default)
    {
        var tenant = await _tenantReadRepository.GetByIdAsync(tenantId, ct);
        return tenant is null ? null : Map(tenant);
    }

    public async Task<TenantSummary?> GetBySubdomainAsync(string? subdomain, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(subdomain))
            return null;

        var tenant = await _tenantReadRepository.GetBySubdomainAsync(subdomain, ct);
        return tenant is null ? null : Map(tenant);
    }

    private TenantSummary Map(TenantDto tenant)
    {
        return new TenantSummary(
            tenant.Id,
            tenant.Code,
            tenant.Name,
            tenant.Subdomain,
            _hostResolver.BuildCanonicalDomain(tenant.Subdomain),
            tenant.Status,
            new TenantBrandingInfo(
                tenant.LogoUrl,
                tenant.AvatarUrl,
                tenant.WatermarkSettings));
    }
}