using System.Text.Json.Serialization;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record DashboardTimeSeriesDto(IReadOnlyList<string> Labels, IReadOnlyList<long> Data);

public sealed record AdminSessionDashboardDto(
    [property: JsonPropertyName("24h")] DashboardTimeSeriesDto Last24Hours,
    [property: JsonPropertyName("7d")] DashboardTimeSeriesDto Last7Days,
    [property: JsonPropertyName("30d")] DashboardTimeSeriesDto Last30Days);

public sealed record GetAdminSessionDashboardQuery(Guid? TenantId = null);

public sealed class GetAdminSessionDashboardQueryHandler
{
    private readonly IUserRepository _userRepository;

    public GetAdminSessionDashboardQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<AdminSessionDashboardDto> HandleAsync(
        GetAdminSessionDashboardQuery query,
        CancellationToken ct = default)
    {
        return await _userRepository.GetAdminSessionDashboardAsync(query.TenantId, ct);
    }
}
