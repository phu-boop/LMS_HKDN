using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenants;

public sealed record GetTenantsQuery(int Page, int PageSize, string? Status, string? Search);

public sealed record GetTenantsResult(
    IReadOnlyList<TenantListItemDto> Items,
    int Total,
    int Page,
    int PageSize);

public sealed class GetTenantsHandler
{
    private readonly ITenantReadRepository _readRepository;

    public GetTenantsHandler(ITenantReadRepository readRepository)
    {
        _readRepository = readRepository;
    }

    public async Task<GetTenantsResult> HandleAsync(GetTenantsQuery query, CancellationToken ct = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 20 : query.PageSize > 100 ? 100 : query.PageSize;

        var items = await _readRepository.ListAsync(page, pageSize, query.Status, query.Search, ct);
        var total = await _readRepository.CountAsync(query.Status, query.Search, ct);

        return new GetTenantsResult(items, total, page, pageSize);
    }
}