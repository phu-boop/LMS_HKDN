using Aig.Lms.Modules.Tenancy.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

// ─── DTOs ───────────────────────────────────────────────────────────────────

public sealed record WorkspaceDto(
    Guid TenantId,
    string TenantCode,
    string Name,
    string Subdomain,
    string Domain,
    string? LogoUrl,
    string? AvatarUrl,
    bool IsCurrentTenant);

// ─── GET /identity/workspaces ─────────────────────────────────────────────

public sealed record GetWorkspacesQuery(
    Guid UserId,
    Guid? CurrentTenantId);

public sealed class GetWorkspacesQueryHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantResolutionService _tenantResolutionService;

    public GetWorkspacesQueryHandler(
        IUserRepository userRepository,
        ITenantResolutionService tenantResolutionService)
    {
        _userRepository = userRepository;
        _tenantResolutionService = tenantResolutionService;
    }

    public async Task<IReadOnlyList<WorkspaceDto>> HandleAsync(
        GetWorkspacesQuery query,
        CancellationToken ct = default)
    {
        var tenantIds = await _userRepository.GetActiveTenantIdsAsync(query.UserId, ct);
        var workspaces = new List<WorkspaceDto>();

        foreach (var tenantId in tenantIds.Distinct())
        {
            var tenant = await _tenantResolutionService.GetByTenantIdAsync(tenantId, ct);
            if (tenant is null || tenant.Status != "ACTIVE")
                continue;

            workspaces.Add(new WorkspaceDto(
                tenant.TenantId,
                tenant.TenantCode,
                tenant.Name,
                tenant.Subdomain,
                tenant.Domain,
                tenant.Branding.LogoUrl,
                tenant.Branding.AvatarUrl,
                IsCurrentTenant: query.CurrentTenantId == tenantId));
        }

        return workspaces;
    }
}

// ─── POST /identity/workspaces/{tenantId}/select ─────────────────────────

public sealed record SelectWorkspaceCommand(
    Guid UserId,
    Guid TargetTenantId,
    string RefreshToken,
    string? UserAgent = null,
    string? IpAddress = null);

public sealed class SelectWorkspaceCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly ITenantResolutionService _tenantResolutionService;

    public SelectWorkspaceCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        ITenantResolutionService tenantResolutionService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _tenantResolutionService = tenantResolutionService;
    }

    public async Task<(LoginResult? Result, LoginError? Error)> HandleAsync(
        SelectWorkspaceCommand command,
        CancellationToken ct = default)
    {
        // Validate session via refresh token
        var tokenHash = _tokenService.HashRefreshToken(command.RefreshToken);
        var session = await _userRepository.FindSessionByRefreshTokenHashAsync(tokenHash, ct);

        if (session is null)
            return (null, new LoginError("INVALID_TOKEN", "Refresh token is invalid or expired."));

        // Prevent cross-user session usage
        if (session.UserId != command.UserId)
            return (null, new LoginError("INVALID_TOKEN", "Token does not belong to the authenticated user."));

        // Ensure user account is still active
        var user = await _userRepository.FindByIdAsync(command.UserId, ct);
        if (user is null || user.Status != "ACTIVE")
        {
            await _userRepository.RevokeSessionAsync(session.Id, ct);
            return (null, new LoginError("USER_INACTIVE", "User account is no longer active."));
        }

        // Validate user has access to the requested tenant
        var activeTenantIds = await _userRepository.GetActiveTenantIdsAsync(command.UserId, ct);
        if (!activeTenantIds.Contains(command.TargetTenantId))
            return (null, new LoginError("TENANT_NOT_ACCESSIBLE",
                "User does not have access to the requested workspace."));

        var tenant = await _tenantResolutionService.GetByTenantIdAsync(command.TargetTenantId, ct);
        if (tenant is null || tenant.Status != "ACTIVE")
            return (null, new LoginError("TENANT_NOT_ACCESSIBLE",
                "The requested workspace is not available."));

        var roles = await _userRepository.GetRoleCodesAsync(user.Id, ct);

        // Rotate refresh token and update session to new tenant scope
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var newRefreshTokenHash = _tokenService.HashRefreshToken(newRefreshToken);
        await _userRepository.UpdateSessionTenantAsync(
            session.Id, command.TargetTenantId, newRefreshTokenHash, ct);

        // Issue new access token scoped to the selected tenant
        var accessToken = _tokenService.GenerateAccessToken(
            user, roles, command.TargetTenantId, tenant.Subdomain);

        return (new LoginResult(accessToken, newRefreshToken, _tokenService.ExpiresInSeconds,
            TenantBranding: null), null);
    }
}
