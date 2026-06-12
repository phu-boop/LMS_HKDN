using Aig.Lms.Modules.Authorization.Domain;

namespace Aig.Lms.Modules.Authorization.Application.Permissions;

public sealed record ListPermissionsQuery;

public sealed class ListPermissionsQueryHandler
{
    private readonly Roles.IAuthorizationRepository _repository;

    public ListPermissionsQueryHandler(Roles.IAuthorizationRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<Permission>> HandleAsync(CancellationToken ct = default)
    {
        return _repository.GetAllPermissionsAsync(ct);
    }
}
