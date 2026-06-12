using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace Aig.Lms.IntegrationTests;

public sealed class TenantResolutionIntegrationTests : IClassFixture<CustomApiFactory>
{
    private readonly HttpClient _client;

    public TenantResolutionIntegrationTests(CustomApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ResolveEndpoint_ShouldReturnTenantBranding_ByDomainQuery()
    {
        var response = await _client.GetAsync("/api/tenants/resolve?domain=stem.daihoc.io.vn");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ResolveTenantResponse>();
        payload.Should().NotBeNull();
        payload!.TenantCode.Should().Be("STEM");
        payload.Subdomain.Should().Be("stem");
        payload.Domain.Should().Be("stem.daihoc.io.vn");
        payload.IsAdminDomain.Should().BeFalse();
        payload.Branding.LogoUrl.Should().Be("/assets/stem-logo.svg");
    }

    [Fact]
    public async Task ResolveEndpoint_ShouldFallbackToAdminTenant_OnAdminDomain()
    {
        var response = await _client.GetAsync("/api/tenants/resolve?domain=id.daihoc.io.vn");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ResolveTenantResponse>();
        payload.Should().NotBeNull();
        payload!.TenantCode.Should().Be("ADMIN");
        payload.IsAdminDomain.Should().BeTrue();
    }

    [Fact]
    public async Task Middleware_ShouldResolveTenantContext_FromHostHeader()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/_tests/current-tenant");
        request.Headers.Host = "stem.daihoc.io.vn";

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CurrentTenantResponse>();
        payload.Should().NotBeNull();
        payload!.IsResolved.Should().BeTrue();
        payload.TenantCode.Should().Be("STEM");
        payload.Subdomain.Should().Be("stem");
        payload.TenantId.Should().Be(TenantTestData.StemTenant.Id);
    }

    [Fact]
    public async Task Middleware_ShouldResolveTenantContext_FromHostHeader_WithPort()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/_tests/current-tenant");
        request.Headers.Host = "stem.daihoc.io.vn:5294";

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<CurrentTenantResponse>();
        payload.Should().NotBeNull();
        payload!.IsResolved.Should().BeTrue();
        payload.TenantCode.Should().Be("STEM");
        payload.Subdomain.Should().Be("stem");
        payload.TenantId.Should().Be(TenantTestData.StemTenant.Id);
    }

    [Fact]
    public async Task Middleware_ShouldReturnNotFound_ForUnknownTenantHost()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/_tests/current-tenant");
        request.Headers.Host = "unknown.daihoc.io.vn";

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private sealed record ResolveTenantResponse(
        Guid TenantId,
        string TenantCode,
        string Name,
        string Subdomain,
        string Domain,
        string Status,
        bool IsAdminDomain,
        BrandingResponse Branding);

    private sealed record BrandingResponse(
        string? LogoUrl,
        string? AvatarUrl,
        string? WatermarkSettings);

    private sealed record CurrentTenantResponse(
        Guid? TenantId,
        string? TenantCode,
        string? Subdomain,
        bool IsResolved);
}