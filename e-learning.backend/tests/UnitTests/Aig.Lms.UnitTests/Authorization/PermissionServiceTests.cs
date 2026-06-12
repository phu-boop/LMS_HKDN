using Aig.Lms.Modules.Authorization.Application.Permissions;
using Aig.Lms.Modules.Authorization.Application.Roles;
using Aig.Lms.Modules.Authorization.Infrastructure.Permissions;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using NSubstitute;

namespace Aig.Lms.UnitTests.Authorization;

public class PermissionServiceTests
{
    private readonly IAuthorizationRepository _repository = Substitute.For<IAuthorizationRepository>();
    private readonly IMemoryCache _cache;
    private readonly PermissionService _service;

    public PermissionServiceTests()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new PermissionService(_repository, _cache);
    }

    [Fact]
    public async Task GetPermissionsForRolesAsync_QueriesRepository_ReturnsPermissions()
    {
        var roleCodes = new[] { "TEACHER" };
        _repository.GetPermissionCodesByRoleCodesAsync(roleCodes)
            .Returns(new List<string> { "CONTENT_VIEW", "CONTENT_DOWNLOAD" });

        var result = await _service.GetPermissionsForRolesAsync(roleCodes);

        result.Should().Contain("CONTENT_VIEW");
        result.Should().Contain("CONTENT_DOWNLOAD");
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPermissionsForRolesAsync_SecondCall_ReturnsCached()
    {
        var roleCodes = new[] { "TEACHER" };
        _repository.GetPermissionCodesByRoleCodesAsync(roleCodes)
            .Returns(new List<string> { "CONTENT_VIEW" });

        // First call
        await _service.GetPermissionsForRolesAsync(roleCodes);
        // Second call — should use cache
        var result = await _service.GetPermissionsForRolesAsync(roleCodes);

        result.Should().Contain("CONTENT_VIEW");
        await _repository.Received(1).GetPermissionCodesByRoleCodesAsync(roleCodes); // Only 1 call
    }

    [Fact]
    public async Task GetPermissionsForRolesAsync_DifferentRoleOrder_UsesSameCache()
    {
        var roleCodes1 = new[] { "TEACHER", "SCHOOL_ADMIN" };
        var roleCodes2 = new[] { "SCHOOL_ADMIN", "TEACHER" };
        _repository.GetPermissionCodesByRoleCodesAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new List<string> { "USERS_VIEW" });

        await _service.GetPermissionsForRolesAsync(roleCodes1);
        await _service.GetPermissionsForRolesAsync(roleCodes2);

        // Should only query once because sorted cache key is the same
        await _repository.Received(1).GetPermissionCodesByRoleCodesAsync(Arg.Any<IEnumerable<string>>());
    }

    [Fact]
    public async Task GetPermissionsForRolesAsync_DifferentRoles_QueriesSeparately()
    {
        _repository.GetPermissionCodesByRoleCodesAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new List<string> { "PERM_A" });

        await _service.GetPermissionsForRolesAsync(new[] { "TEACHER" });
        await _service.GetPermissionsForRolesAsync(new[] { "SCHOOL_ADMIN" });

        await _repository.Received(2).GetPermissionCodesByRoleCodesAsync(Arg.Any<IEnumerable<string>>());
    }
}
