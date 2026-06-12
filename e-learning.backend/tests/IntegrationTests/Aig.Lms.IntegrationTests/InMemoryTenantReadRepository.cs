using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.IntegrationTests;

internal sealed class InMemoryTenantReadRepository : ITenantReadRepository
{
    private readonly IReadOnlyList<TenantDto> _tenants;

    public InMemoryTenantReadRepository(IReadOnlyList<TenantDto> tenants)
    {
        _tenants = tenants;
    }

    public Task<TenantDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return Task.FromResult(_tenants.FirstOrDefault(tenant => tenant.Id == id));
    }

    public Task<TenantDto?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default)
    {
        var tenant = _tenants.FirstOrDefault(tenant =>
            string.Equals(tenant.Subdomain, subdomain, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(tenant);
    }

    public Task<IReadOnlyList<TenantListItemDto>> ListAsync(
        int page,
        int pageSize,
        string? status,
        string? search,
        CancellationToken ct = default)
    {
        IReadOnlyList<TenantListItemDto> items = _tenants
            .Select(tenant => new TenantListItemDto(
                tenant.Id,
                tenant.Code,
                tenant.Name,
                tenant.Subdomain,
                tenant.LogoUrl,
                tenant.Status,
                tenant.CreatedAt,
                tenant.UpdatedAt))
            .ToList();

        return Task.FromResult(items);
    }

    public Task<int> CountAsync(string? status, string? search, CancellationToken ct = default)
    {
        return Task.FromResult(_tenants.Count);
    }
}