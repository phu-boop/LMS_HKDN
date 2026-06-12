namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed record GetSessionsQuery(Guid UserId, bool ActiveOnly = true);

public sealed record SessionDto(
    Guid Id,
    string? UserAgent,
    string? IpAddress,
    DateTime StartedAt,
    DateTime LastSeenAt,
    DateTime? EndedAt,
    string Status);

public sealed class GetSessionsQueryHandler
{
    private readonly IUserRepository _userRepository;

    public GetSessionsQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IReadOnlyList<SessionDto>> HandleAsync(GetSessionsQuery query, CancellationToken ct = default)
    {
        var sessions = await _userRepository.GetUserSessionsAsync(query.UserId, query.ActiveOnly, ct);

        return sessions
            .Select(s => new SessionDto(s.Id, s.UserAgent, s.IpAddress, s.StartedAt, s.LastSeenAt, s.EndedAt, s.Status))
            .ToList();
    }
}
