using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aig.Lms.IntegrationTests.Authorization;
using FluentAssertions;

namespace Aig.Lms.IntegrationTests.ContentManagement;

public sealed class CurriculumFlexibilityIntegrationTests : IClassFixture<ContentManagementApiFactory>
{
    private static readonly Guid TenantId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private readonly HttpClient _client;

    public CurriculumFlexibilityIntegrationTests(ContentManagementApiFactory factory)
    {
        _client = factory.CreateClient();
        var token = TestJwtHelper.GenerateToken(Guid.NewGuid(), TenantId, "TENANT_ADMIN");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task CreateRoot_WithCustomNodeType_ShouldReturn201()
    {
        var payload = new
        {
            parentId = (Guid?)null,
            nodeType = "LearningTrack",
            code = "LTRK-01",
            title = "Track A",
            sortOrder = 1
        };

        var response = await _client.PostAsJsonAsync($"/api/tenants/{TenantId}/curriculum/", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadFromJsonAsync<CreateNodeResponse>();
        body.Should().NotBeNull();
        body!.NodeId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateChild_WithArbitraryNodeType_ShouldReturn201_WithoutHierarchyEnforcement()
    {
        var rootPayload = new
        {
            parentId = (Guid?)null,
            nodeType = "KHOI_DAO_TAO",
            code = "KDT",
            title = "Khoi dao tao",
            sortOrder = 1
        };

        var rootResponse = await _client.PostAsJsonAsync($"/api/tenants/{TenantId}/curriculum/", rootPayload);
        rootResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var rootBody = await rootResponse.Content.ReadFromJsonAsync<CreateNodeResponse>();

        var childPayload = new
        {
            parentId = rootBody!.NodeId,
            nodeType = "CapConTuDinhNghia",
            code = "LEVEL-X",
            title = "Cap X",
            sortOrder = 1
        };

        var childResponse = await _client.PostAsJsonAsync($"/api/tenants/{TenantId}/curriculum/", childPayload);
        childResponse.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateRoot_WithBlankNodeType_ShouldReturn400()
    {
        var payload = new
        {
            parentId = (Guid?)null,
            nodeType = "   ",
            code = "BAD",
            title = "Invalid Node",
            sortOrder = 1
        };

        var response = await _client.PostAsJsonAsync($"/api/tenants/{TenantId}/curriculum/", payload);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("node_type is required");
    }

    private sealed record CreateNodeResponse(Guid NodeId);
}
