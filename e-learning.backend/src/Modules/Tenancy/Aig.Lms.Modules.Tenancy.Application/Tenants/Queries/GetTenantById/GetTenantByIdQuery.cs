using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Queries.GetTenantById;

public sealed record GetTenantByIdQuery(Guid Id);

public sealed class GetTenantByIdHandler
{
    private readonly ITenantReadRepository _readRepository;

    public GetTenantByIdHandler(ITenantReadRepository readRepository)
    {
        _readRepository = readRepository;
    }

    public async Task<TenantDto?> HandleAsync(GetTenantByIdQuery query, CancellationToken ct = default) =>
        await _readRepository.GetByIdAsync(query.Id, ct);
}