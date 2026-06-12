using Aig.Lms.Modules.Tenancy.Domain.Entities;

namespace Aig.Lms.Modules.Tenancy.Domain.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Tenant?> GetBySubdomainAsync(string subdomain, CancellationToken ct = default);
    Task<Tenant?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<bool> ExistsBySubdomainAsync(string subdomain, Guid? excludedTenantId = null, CancellationToken ct = default);
    Task<bool> ExistsByCodeAsync(string code, Guid? excludedTenantId = null, CancellationToken ct = default);
    Task AddAsync(Tenant tenant, CancellationToken ct = default);
    Task UpdateAsync(Tenant tenant, CancellationToken ct = default);
}
