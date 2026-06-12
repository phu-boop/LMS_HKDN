using Aig.Lms.Modules.Tenancy.Application.Tenants.Dtos;

namespace Aig.Lms.IntegrationTests;

internal static class TenantTestData
{
    public static readonly TenantDto AdminTenant = new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "ADMIN",
        "LMS Admin",
        "admin",
        "/assets/admin-logo.svg",
        "/assets/admin-avatar.svg",
        "Default admin branding",
        "{\"theme\":\"admin\"}",
        "ACTIVE",
        DateTime.UtcNow,
        DateTime.UtcNow);

    public static readonly TenantDto StemTenant = new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        "STEM",
        "STEM Academy",
        "stem",
        "/assets/stem-logo.svg",
        "/assets/stem-avatar.svg",
        "STEM branding",
        "{\"watermark\":{\"enabled\":true,\"template\":\"{company} - {username} - {time}\",\"opacity\":0.5,\"fontSize\":16,\"color\":\"#FFFFFF\",\"position\":\"random\",\"refreshIntervalSeconds\":7}}",
        "ACTIVE",
        DateTime.UtcNow,
        DateTime.UtcNow);

    public static IReadOnlyList<TenantDto> All { get; } = [AdminTenant, StemTenant];
}