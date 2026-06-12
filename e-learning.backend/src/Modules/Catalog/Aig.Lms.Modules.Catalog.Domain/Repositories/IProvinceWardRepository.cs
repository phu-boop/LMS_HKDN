using Aig.Lms.Modules.Catalog.Domain.Entities;

namespace Aig.Lms.Modules.Catalog.Domain.Repositories;

public interface IProvinceWardRepository
{
    Task<IReadOnlyList<Province>> GetAllProvincesAsync(CancellationToken ct = default);
    Task<Province?> GetProvinceByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<Ward>> GetWardsByProvinceIdAsync(int provinceId, CancellationToken ct = default);
    Task<Ward?> GetWardByIdAsync(int id, CancellationToken ct = default);
    Task AddProvinceAsync(Province province, CancellationToken ct = default);
    Task AddWardAsync(Ward ward, CancellationToken ct = default);
}
