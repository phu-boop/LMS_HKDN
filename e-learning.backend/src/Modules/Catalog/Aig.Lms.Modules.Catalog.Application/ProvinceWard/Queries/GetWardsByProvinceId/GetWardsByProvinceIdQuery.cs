using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetWardsByProvinceId;

public sealed record GetWardsByProvinceIdQuery(int ProvinceId);

public sealed record WardDto(
    int Id,
    int ProvinceId,
    string Name);

public sealed class GetWardsByProvinceIdHandler
{
    private readonly IProvinceWardRepository _repository;

    public GetWardsByProvinceIdHandler(IProvinceWardRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<WardDto>> HandleAsync(
        GetWardsByProvinceIdQuery query,
        CancellationToken ct = default)
    {
        if (query.ProvinceId <= 0)
            return [];

        var wards = await _repository.GetWardsByProvinceIdAsync(query.ProvinceId, ct);

        return wards
            .Select(w => new WardDto(w.Id, w.ProvinceId, w.Name))
            .ToList();
    }
}
