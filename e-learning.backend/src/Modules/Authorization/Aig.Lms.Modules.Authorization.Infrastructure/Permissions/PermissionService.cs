using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Microsoft.Extensions.Caching.Memory;

namespace Aig.Lms.Modules.Authorization.Infrastructure.Permissions;

public sealed class PermissionService : IPermissionService
{
    private readonly IAuthorizationRepository _repository;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public PermissionService(IAuthorizationRepository repository, IMemoryCache cache)
    {
        _repository = repository;
        _cache = cache;
    }

    public async Task<IReadOnlySet<string>> GetPermissionsForRolesAsync(IEnumerable<string> roleCodes, CancellationToken ct = default)
    {
        var sortedKey = string.Join(",", roleCodes.OrderBy(r => r));
        var cacheKey = $"permissions:{sortedKey}";

        if (_cache.TryGetValue(cacheKey, out IReadOnlySet<string>? cached) && cached is not null)
            return cached;

        var permissions = await _repository.GetPermissionCodesByRoleCodesAsync(roleCodes, ct);
        var result = permissions.ToHashSet().AsReadOnly();

        _cache.Set(cacheKey, (IReadOnlySet<string>)result, CacheDuration);
        return result;
    }
}
