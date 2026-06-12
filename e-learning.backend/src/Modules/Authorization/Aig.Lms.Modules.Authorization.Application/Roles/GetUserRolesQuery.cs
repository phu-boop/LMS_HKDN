using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Roles;

public sealed record GetUserRolesQuery(Guid UserId);

public sealed class GetUserRolesQueryHandler
{
    private readonly IAuthorizationRepository _repository;

    public GetUserRolesQueryHandler(IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<UserTenantRoleAssignment>> HandleAsync(GetUserRolesQuery query, CancellationToken ct = default)
        => _repository.GetUserRolesAsync(query.UserId, ct);
}
