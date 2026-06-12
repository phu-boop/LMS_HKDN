using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Roles;

public sealed record ListRolesQuery(string? RoleType = null);

public sealed class ListRolesQueryHandler
{
    private readonly IAuthorizationRepository _repository;

    public ListRolesQueryHandler(IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<Role>> HandleAsync(ListRolesQuery query, CancellationToken ct = default)
        => _repository.GetAllRolesAsync(query.RoleType, ct);
}
