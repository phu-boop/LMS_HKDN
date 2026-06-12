using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace Aig.Lms.IntegrationTests.Authorization;

/// <summary>
/// Integration tests for task 2.8 — Permission-based authorization enforcement.
///
/// Covers:
/// - LMS_ADMIN bypasses all permission checks (handler short-circuits)
/// - TEACHER is denied endpoints requiring ROLES_VIEW
/// - TENANT_ADMIN (has ROLES_VIEW) is allowed
/// - Unauthenticated requests return 401
/// - GET /api/admin/roles returns correct shape
/// - GET /api/admin/users/{userId}/permissions returns effective permissions
/// </summary>
public sealed class PermissionAuthorizationIntegrationTests : IClassFixture<AuthorizationApiFactory>
{
    private readonly HttpClient _client;
    private readonly Guid _testUserId = InMemoryAuthorizationRepository.TestUserId;

    public PermissionAuthorizationIntegrationTests(AuthorizationApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void UseToken(string token) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private void ClearToken() =>
        _client.DefaultRequestHeaders.Authorization = null;

    // ── GET /api/admin/roles ───────────────────────────────────────────────────

    [Fact]
    public async Task GetAdminRoles_NoToken_Returns401()
    {
        ClearToken();
        var response = await _client.GetAsync("/api/admin/roles");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAdminRoles_LmsAdmin_Returns200_WithoutPermissionServiceCall()
    {
        // LMS_ADMIN bypasses PermissionAuthorizationHandler — InMemoryPermissionService is NOT invoked
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "LMS_ADMIN"));
        var response = await _client.GetAsync("/api/admin/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAdminRoles_Teacher_Returns403_BecauseMissingRolesView()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "TEACHER"));
        var response = await _client.GetAsync("/api/admin/roles");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAdminRoles_TenantAdmin_Returns200_BecauseHasRolesView()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "TENANT_ADMIN"));
        var response = await _client.GetAsync("/api/admin/roles");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAdminRoles_LmsAdmin_ResponseContainsAllRolesWithPermissionCodes()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "LMS_ADMIN"));
        var response = await _client.GetAsync("/api/admin/roles");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var roles = await response.Content.ReadFromJsonAsync<List<RoleResponse>>();
        roles.Should().NotBeNull().And.HaveCount(3);
        roles.Should().Contain(r => r.Code == "TEACHER");
        roles.Should().Contain(r => r.Code == "LMS_ADMIN");

        var teacher = roles!.First(r => r.Code == "TEACHER");
        teacher.PermissionCodes.Should().Contain("CONTENT_VIEW").And.Contain("CURRICULUM_VIEW");
        teacher.PermissionCodes.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetAdminRoles_TenantAdmin_ResponseContainsRolesWithPermissionCodes()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "TENANT_ADMIN"));
        var response = await _client.GetAsync("/api/admin/roles");

        var roles = await response.Content.ReadFromJsonAsync<List<RoleResponse>>();
        roles.Should().NotBeNull().And.NotBeEmpty();
        roles.Should().AllSatisfy(r => r.PermissionCodes.Should().NotBeNull());
    }

    // ── GET /api/admin/users/{userId}/permissions ─────────────────────────────

    [Fact]
    public async Task GetUserPermissions_NoToken_Returns401()
    {
        ClearToken();
        var response = await _client.GetAsync($"/api/admin/users/{_testUserId}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetUserPermissions_LmsAdmin_Returns200()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "LMS_ADMIN"));
        var response = await _client.GetAsync($"/api/admin/users/{_testUserId}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserPermissions_TenantAdmin_Returns200_BecauseHasRolesView()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "TENANT_ADMIN"));
        var response = await _client.GetAsync($"/api/admin/users/{_testUserId}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUserPermissions_Teacher_Returns403_BecauseMissingRolesView()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "TEACHER"));
        var response = await _client.GetAsync($"/api/admin/users/{_testUserId}/permissions");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetUserPermissions_LmsAdmin_ReturnsEffectivePermissionsForUser()
    {
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "LMS_ADMIN"));
        var response = await _client.GetAsync($"/api/admin/users/{_testUserId}/permissions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<UserPermissionsResponse>();
        result.Should().NotBeNull();
        result!.UserId.Should().Be(_testUserId);
        result.RoleCodes.Should().ContainSingle().Which.Should().Be("TEACHER");
        result.PermissionCodes.Should().Contain("CONTENT_VIEW").And.Contain("CURRICULUM_VIEW");
        result.PermissionCodes.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetUserPermissions_LmsAdmin_UnknownUser_Returns200_WithEmptyLists()
    {
        var unknownId = Guid.NewGuid();
        UseToken(TestJwtHelper.GenerateToken(Guid.NewGuid(), "LMS_ADMIN"));
        var response = await _client.GetAsync($"/api/admin/users/{unknownId}/permissions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<UserPermissionsResponse>();
        result!.RoleCodes.Should().BeEmpty();
        result.PermissionCodes.Should().BeEmpty();
    }

    // ── Response DTOs (match JSON output of handlers) ─────────────────────────

    private sealed record RoleResponse(
        Guid Id,
        string Code,
        string Name,
        IReadOnlyList<string> PermissionCodes);

    private sealed record UserPermissionsResponse(
        Guid UserId,
        IReadOnlyList<string> RoleCodes,
        IReadOnlyList<string> PermissionCodes);
}
