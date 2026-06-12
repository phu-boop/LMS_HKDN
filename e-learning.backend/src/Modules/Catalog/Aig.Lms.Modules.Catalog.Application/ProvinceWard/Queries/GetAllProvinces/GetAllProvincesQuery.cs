using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetAllProvinces;

public sealed record GetAllProvincesQuery;

public sealed record ProvinceDto(
    int Id,
    string Name);

public sealed class GetAllProvincesHandler
{
    private readonly IProvinceWardRepository _repository;

    public GetAllProvincesHandler(IProvinceWardRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<ProvinceDto>> HandleAsync(
        GetAllProvincesQuery query,
        CancellationToken ct = default)
    {
        var provinces = await _repository.GetAllProvincesAsync(ct);

        return provinces
            .Select(p => new ProvinceDto(p.Id, p.Name))
            .ToList();
    }
}
