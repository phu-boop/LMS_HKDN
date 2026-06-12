using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.Catalog.Queries.GetCatalogByType;

public sealed record GetCatalogByTypeQuery(string Type);

public sealed record CatalogItemDto(
    Guid Id,
    string Type,
    string Code,
    string Name,
    string? Description,
    int SortOrder,
    bool IsSystem,
    bool IsActive);

public sealed class GetCatalogByTypeHandler
{
    private readonly ICatalogRepository _repository;

    public GetCatalogByTypeHandler(ICatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<CatalogItemDto>> HandleAsync(
        GetCatalogByTypeQuery query,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query.Type))
            return [];

        var items = await _repository.GetByTypeAsync(
            query.Type.Trim().ToUpperInvariant(), ct);

        return items
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CatalogItemDto(
                x.Id, x.Type, x.Code, x.Name, x.Description, x.SortOrder, x.IsSystem, x.IsActive))
            .ToList();
    }
}
