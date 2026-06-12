using Aig.Lms.Modules.Catalog.Domain.Entities;

namespace Aig.Lms.Modules.Catalog.Domain.Repositories;

public interface ICatalogRepository
{
    Task<IReadOnlyList<CatalogItem>> GetByTypeAsync(string type, CancellationToken ct = default);
    Task<CatalogItem?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByCodeAsync(string type, string code, Guid? excludeId = null, CancellationToken ct = default);
    Task<bool> IsInUseAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(CatalogItem item, CancellationToken ct = default);
    Task UpdateAsync(CatalogItem item, CancellationToken ct = default);
    Task DeleteAsync(CatalogItem item, CancellationToken ct = default);
}
