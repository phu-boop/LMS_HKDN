using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Identity.Domain;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;

namespace Aig.Lms.Modules.Identity.Application.Auth;

public sealed class LoginCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;
    private readonly ITenantResolutionService _tenantResolutionService;

    public LoginCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        IAuditLogService auditLogService,
        ITenantResolutionService tenantResolutionService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
        _tenantResolutionService = tenantResolutionService;
    }

    public async Task<(LoginResult? Result, LoginError? Error)> HandleAsync(LoginCommand command, CancellationToken ct = default)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(command.Username) ||
            string.IsNullOrWhiteSpace(command.Password))
        {
            return (null, new LoginError("VALIDATION_ERROR", "Vui lòng nhập tên đăng nhập và mật khẩu."));
        }

        var user = await _userRepository.FindByIdentifierAsync(command.Username, ct);

        if (user is null || user.Status == "DELETED")
            return (null, new LoginError("INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng."));

        // Check explicit status messages
        if (user.Status == "LOCKED")
            return (null, new LoginError("ACCOUNT_LOCKED", "Tài khoản đã bị khóa. Vui lòng liên hệ với quản trị viên."));

        if (user.Status == "DISABLED")
            return (null, new LoginError("ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên."));

        if (user.Status == "INACTIVE")
            return (null, new LoginError("ACCOUNT_INACTIVE", "Tài khoản chưa được kích hoạt. Vui lòng liên hệ với quản trị viên."));

        // Check temporary lockout from brute-force
        if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
        {
            var retryAfter = (int)(user.LockedUntil.Value - DateTime.UtcNow).TotalSeconds;
            return (null, new LoginError("TEMPORARILY_LOCKED",
                $"Bạn đã nhập sai quá nhiều lần. Thử lại sau {retryAfter} giây.",
                retryAfter));
        }

        // Check school contract expiry
        var sessionPolicy = await _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId, ct);
        if (sessionPolicy.IsContractExpired())
        {
            await _auditLogService.LogAsync(new AuditLogEntry(
                Action: "LOGIN_FAILED",
                EntityType: "UserAccount",
                EntityId: user.Id,
                SchoolId: user.SchoolId,
                ActorUserId: user.Id,
                IpAddress: command.IpAddress,
                UserAgent: command.UserAgent,
                Metadata: "{\"reason\":\"SCHOOL_CONTRACT_EXPIRED\"}"), ct);

            return (null, new LoginError("SCHOOL_CONTRACT_EXPIRED",
                "Hợp đồng của trường bạn đã hết hạn. Vui lòng liên hệ với quản trị viên."));
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(command.Password, user.PasswordHash))
        {
            await _userRepository.IncrementFailedLoginAsync(user.Id, ct);

            var newCount = user.FailedLoginCount + 1;
            if (newCount >= _tokenService.MaxFailedLoginAttempts)
            {
                var lockedUntil = DateTime.UtcNow.AddMinutes(_tokenService.LockoutMinutes);
                await _userRepository.LockUserAsync(user.Id, lockedUntil, ct);

                await _auditLogService.LogAsync(new AuditLogEntry(
                    Action: "LOGIN_FAILED",
                    EntityType: "UserAccount",
                    EntityId: user.Id,
                    SchoolId: user.SchoolId,
                    ActorUserId: user.Id,
                    IpAddress: command.IpAddress,
                    UserAgent: command.UserAgent,
                    Metadata: $"{{\"reason\":\"MAX_FAILED_ATTEMPTS\",\"failed_count\":{newCount}}}"), ct);

                return (null, new LoginError("TEMPORARILY_LOCKED",
                    $"Bạn đã nhập sai quá nhiều lần. Tài khoản đã bị khóa trong {_tokenService.LockoutMinutes} phút.",
                    _tokenService.LockoutMinutes * 60));
            }

            await _auditLogService.LogAsync(new AuditLogEntry(
                Action: "LOGIN_FAILED",
                EntityType: "UserAccount",
                EntityId: user.Id,
                SchoolId: user.SchoolId,
                ActorUserId: user.Id,
                IpAddress: command.IpAddress,
                UserAgent: command.UserAgent,
                Metadata: $"{{\"reason\":\"INVALID_PASSWORD\",\"failed_count\":{newCount}}}"), ct);

            var remaining = _tokenService.MaxFailedLoginAttempts - newCount;
            return (null, new LoginError("INVALID_CREDENTIALS",
                $"Tên đăng nhập hoặc mật khẩu không đúng. Còn {remaining} lần thử."));
        }

        // Success — reset failed login counter
        if (user.FailedLoginCount > 0)
            await _userRepository.ResetFailedLoginAsync(user.Id, ct);

        // Enforce concurrent session policy
        if (sessionPolicy.MaxConcurrentSessions > 0)
        {
            var activeCount = await _userRepository.CountActiveSessionsAsync(user.Id, user.SchoolId, ct);
            if (activeCount >= sessionPolicy.MaxConcurrentSessions)
            {
                if (sessionPolicy.Policy == ConcurrentSessionPolicy.BlockNew)
                {
                    await _auditLogService.LogAsync(new AuditLogEntry(
                        Action: "SESSION_BLOCKED",
                        EntityType: "UserSession",
                        SchoolId: user.SchoolId,
                        ActorUserId: user.Id,
                        IpAddress: command.IpAddress,
                        UserAgent: command.UserAgent,
                        Metadata: $"{{\"reason\":\"CONCURRENT_SESSION_LIMIT\",\"active_sessions\":{activeCount},\"max_sessions\":{sessionPolicy.MaxConcurrentSessions}}}"), ct);

                    return (null, new LoginError("CONCURRENT_SESSION_LIMIT",
                        $"Đã đạt giới hạn số phiên đăng nhập đồng thời ({sessionPolicy.MaxConcurrentSessions}). Vui lòng đăng xuất khỏi thiết bị khác trước."));
                }

                if (sessionPolicy.Policy == ConcurrentSessionPolicy.KickOldest)
                {
                    var oldest = await _userRepository.GetOldestActiveSessionAsync(user.Id, user.SchoolId, ct);
                    if (oldest is not null)
                    {
                        await _userRepository.RevokeSessionAsync(oldest.Id, ct);

                        await _auditLogService.LogAsync(new AuditLogEntry(
                            Action: "SESSION_KICKED",
                            EntityType: "UserSession",
                            EntityId: oldest.Id,
                            SchoolId: user.SchoolId,
                            ActorUserId: user.Id,
                            IpAddress: command.IpAddress,
                            UserAgent: command.UserAgent,
                            Metadata: $"{{\"reason\":\"KICK_OLDEST_POLICY\",\"kicked_session_id\":\"{oldest.Id}\",\"kicked_ip\":\"{oldest.IpAddress}\"}}"), ct);
                    }
                }
            }
        }

        var roles = await _userRepository.GetRoleCodesAsync(user.Id, ct);
        var tenantId = await ResolveLoginTenantIdAsync(user.Id, roles, command.Domain, ct);
        if (!tenantId.HasValue)
            return (null, new LoginError("TENANT_NOT_ASSIGNED", "Người dùng chưa được gán cho bất kỳ chương trình đang hoạt động nào."));

        var tenant = await _tenantResolutionService.GetByTenantIdAsync(tenantId.Value, ct);
        var subdomain = tenant?.Subdomain;
        var refreshToken = _tokenService.GenerateRefreshToken();
        var refreshTokenHash = _tokenService.HashRefreshToken(refreshToken);

        // Create session first to get session ID
        var sessionId = Guid.NewGuid();
        var session = new UserSession
        {
            Id = sessionId,
            TenantId = tenantId.Value,
            SchoolId = user.SchoolId,
            UserId = user.Id,
            RefreshTokenHash = refreshTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(_tokenService.RefreshTokenExpiryDays),
            UserAgent = command.UserAgent,
            IpAddress = command.IpAddress
        };

        var accessToken = _tokenService.GenerateAccessToken(user, roles, tenantId, subdomain, sessionId);

        await _userRepository.CreateSessionAsync(session, ct);
        await _userRepository.UpdateLastLoginAsync(user.Id, ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "LOGIN_SUCCESS",
            EntityType: "UserAccount",
            EntityId: user.Id,
            TenantId: tenantId == Guid.Empty ? null : tenantId,
            SchoolId: user.SchoolId,
            ActorUserId: user.Id,
            IpAddress: command.IpAddress,
            UserAgent: command.UserAgent,
            Metadata: $"{{\"session_id\":\"{session.Id}\"}}"), ct);

        await _auditLogService.LogAsync(new AuditLogEntry(
            Action: "SESSION_CREATED",
            EntityType: "UserSession",
            EntityId: session.Id,
            TenantId: tenantId == Guid.Empty ? null : tenantId,
            SchoolId: user.SchoolId,
            ActorUserId: user.Id,
            IpAddress: command.IpAddress,
            UserAgent: command.UserAgent), ct);

        var branding = await ResolveBrandingAsync(user.Id, roles, tenantId.Value, command.Domain, ct);

        return (new LoginResult(accessToken, refreshToken, _tokenService.ExpiresInSeconds, branding), null);
    }

    private async Task<Guid?> ResolveLoginTenantIdAsync(
        Guid userId,
        IReadOnlyList<string> roles,
        string? domain,
        CancellationToken ct)
    {
        var tenantIds = await _userRepository.GetActiveTenantIdsAsync(userId, ct);
        var distinctTenantIds = tenantIds.Distinct().ToArray();
        var domainResolution = await _tenantResolutionService.ResolveAsync(domain, ct);

        if (domainResolution.Tenant is not null
            && !domainResolution.IsAdminDomain
            && distinctTenantIds.Contains(domainResolution.Tenant.TenantId))
        {
            return domainResolution.Tenant.TenantId;
        }

        var isSuperAdmin = roles.Any(role => string.Equals(role, "LMS_ADMIN", StringComparison.OrdinalIgnoreCase));
        if (!isSuperAdmin && distinctTenantIds.Length == 1)
            return distinctTenantIds[0];

        return await _userRepository.GetTenantIdAsync(userId, ct);
    }

    private async Task<IdentityTenantBranding?> ResolveBrandingAsync(
        Guid userId,
        IReadOnlyList<string> roles,
        Guid tenantId,
        string? domain,
        CancellationToken ct)
    {
        var isLmsAdmin = roles.Any(r => string.Equals(r, "LMS_ADMIN", StringComparison.OrdinalIgnoreCase));
        var tenantIds = await _userRepository.GetActiveTenantIdsAsync(userId, ct);
        var distinctTenantIds = tenantIds.Distinct().ToArray();

        // LMS_ADMIN or multi-tenant: no white-label
        if (isLmsAdmin || distinctTenantIds.Length > 1)
            return null;

        // Single-tenant user: return white-label branding of their tenant
        var tenant = await _tenantResolutionService.GetByTenantIdAsync(tenantId, ct);
        if (tenant is null) return null;

        return new IdentityTenantBranding(
            tenant.TenantCode,
            tenant.Name,
            tenant.Subdomain,
            tenant.Domain,
            IsWhiteLabel: true,
            tenant.Branding.LogoUrl,
            tenant.Branding.AvatarUrl,
            tenant.Branding.WatermarkSettings);
    }
}
