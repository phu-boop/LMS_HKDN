using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Aig.Lms.IntegrationTests;
using Aig.Lms.IntegrationTests.Authorization;
using FluentAssertions;

namespace Aig.Lms.IntegrationTests.ContentManagement;

public sealed class WatermarkConfigIntegrationTests : IClassFixture<ContentManagementApiFactory>
{
    private static readonly Guid TenantId = TenantTestData.StemTenant.Id;
    private static readonly Guid ContentId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private readonly HttpClient _client;

    public WatermarkConfigIntegrationTests(ContentManagementApiFactory factory)
    {
        _client = factory.CreateClient();
        var token = TestJwtHelper.GenerateToken(Guid.NewGuid(), TenantId, "TEACHER");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task WatermarkConfig_ShouldReturnResolvedPayload_ForVisibleWatermarkedContent()
    {
        var response = await _client.GetAsync($"/api/client/contents/{ContentId}/watermark-config");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<WatermarkConfigResponse>();
        payload.Should().NotBeNull();
        payload!.Enabled.Should().BeTrue();
        payload.CompanyName.Should().Be("STEM Academy");
        payload.AccountName.Should().Be("Test User");
        payload.Template.Should().Contain("{company}");
        payload.RenderedText.Should().Contain("STEM Academy");
        payload.RenderedText.Should().Contain("Test User");
        payload.RenderedText.Should().Contain("UTC");
        payload.Opacity.Should().Be(0.5);
        payload.FontSize.Should().Be(16);
        payload.Position.Should().Be("random");
        payload.RefreshIntervalSeconds.Should().Be(7);
    }

    private sealed record WatermarkConfigResponse(
        Guid ContentId,
        bool Enabled,
        string CompanyName,
        string AccountName,
        string? IpAddress,
        DateTimeOffset CurrentTimeUtc,
        string Template,
        double Opacity,
        int FontSize,
        string Color,
        string Position,
        int RefreshIntervalSeconds,
        string RenderedText);
}