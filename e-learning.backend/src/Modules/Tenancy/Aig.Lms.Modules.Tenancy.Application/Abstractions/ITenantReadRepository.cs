using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.Modules.Tenancy.Application.Abstractions;

public interface ITenantReadRepository
{
    Task<TenantDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TenantDto?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default);
    Task<IReadOnlyList<TenantListItemDto>> ListAsync(
        int page,
        int pageSize,
        string? status,
        string? search,
        CancellationToken ct = default);
    Task<int> CountAsync(string? status, string? search, CancellationToken ct = default);
}