using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using FluentAssertions;
using NSubstitute;
namespace Aig.Lms.UnitTests.Identity;

public class LoginCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly IAuditLogService _auditLogService = Substitute.For<IAuditLogService>();
    private readonly ITenantResolutionService _tenantResolutionService = Substitute.For<ITenantResolutionService>();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _tokenService.MaxFailedLoginAttempts.Returns(5);
        _tokenService.LockoutMinutes.Returns(15);
        _tokenService.ExpiresInSeconds.Returns(3600);
        // Disable concurrent session enforcement by default in unit tests
        _userRepository.GetSchoolSessionPolicyAsync(Arg.Any<Guid?>())
            .Returns(new SchoolSessionPolicy { MaxConcurrentSessions = 0 });
        // Default: no tenant resolved from domain (admin domain or no domain)
        _tenantResolutionService.ResolveAsync(Arg.Any<string?>())
            .Returns(new TenantDomainResolution("", false, true, true, null, null));
        // Default: user is assigned to one tenant
        var defaultTenantId = Guid.NewGuid();
        _userRepository.GetActiveTenantIdsAsync(Arg.Any<Guid>())
            .Returns(new List<Guid> { defaultTenantId });
        _userRepository.GetTenantIdAsync(Arg.Any<Guid>())
            .Returns(defaultTenantId);
        _handler = new LoginCommandHandler(_userRepository, _tokenService, _auditLogService, _tenantResolutionService);
    }

    private static UserAccount CreateUser(
        string status = "ACTIVE",
        int failedLoginCount = 0,
        DateTime? lockedUntil = null) => new()
    {
        Id = Guid.NewGuid(),
        SchoolId = Guid.NewGuid(),
        Username = "testuser",
        Email = "test@test.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Correct@123"),
        FullName = "Test User",
        Status = status,
        FailedLoginCount = failedLoginCount,
        LockedUntil = lockedUntil
    };

    [Fact]
    public async Task HandleAsync_ValidCredentials_ReturnsLoginResult()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("access-token");
        _tokenService.GenerateRefreshToken().Returns("refresh-token");
        _tokenService.HashRefreshToken("refresh-token").Returns("hashed-refresh");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().NotBeNull();
        result!.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token");
        result.ExpiresIn.Should().Be(3600);
        error.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsInvalidCredentials()
    {
        _userRepository.FindByIdentifierAsync("unknown").Returns((UserAccount?)null);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("unknown", "any"));

        result.Should().BeNull();
        error.Should().NotBeNull();
        error!.Code.Should().Be("INVALID_CREDENTIALS");
    }

    [Fact]
    public async Task HandleAsync_DeletedUser_ReturnsInvalidCredentials()
    {
        var user = CreateUser(status: "DELETED");
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "any"));

        result.Should().BeNull();
        error!.Code.Should().Be("INVALID_CREDENTIALS");
    }

    [Fact]
    public async Task HandleAsync_LockedUser_ReturnsAccountLocked()
    {
        var user = CreateUser(status: "LOCKED");
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "any"));

        result.Should().BeNull();
        error!.Code.Should().Be("ACCOUNT_LOCKED");
    }

    [Fact]
    public async Task HandleAsync_DisabledUser_ReturnsAccountDisabled()
    {
        var user = CreateUser(status: "DISABLED");
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "any"));

        result.Should().BeNull();
        error!.Code.Should().Be("ACCOUNT_DISABLED");
    }

    [Fact]
    public async Task HandleAsync_InactiveUser_ReturnsAccountInactive()
    {
        var user = CreateUser(status: "INACTIVE");
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "any"));

        result.Should().BeNull();
        error!.Code.Should().Be("ACCOUNT_INACTIVE");
    }

    [Fact]
    public async Task HandleAsync_TemporarilyLocked_ReturnsTemporarilyLocked()
    {
        var user = CreateUser(lockedUntil: DateTime.UtcNow.AddMinutes(10));
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "any"));

        result.Should().BeNull();
        error!.Code.Should().Be("TEMPORARILY_LOCKED");
        error.RetryAfterSeconds.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task HandleAsync_ExpiredLockout_ProceedsWithLogin()
    {
        var user = CreateUser(lockedUntil: DateTime.UtcNow.AddMinutes(-1));
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().NotBeNull();
        error.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WrongPassword_IncrementsFailedCount()
    {
        var user = CreateUser(failedLoginCount: 0);
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "WrongPass"));

        result.Should().BeNull();
        error!.Code.Should().Be("INVALID_CREDENTIALS");
        error.Message.Should().Contain("4 attempt(s) remaining");
        await _userRepository.Received(1).IncrementFailedLoginAsync(user.Id);
    }

    [Fact]
    public async Task HandleAsync_MaxFailedAttempts_LocksAccount()
    {
        var user = CreateUser(failedLoginCount: 4); // 4 + 1 = 5 = max
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "WrongPass"));

        result.Should().BeNull();
        error!.Code.Should().Be("TEMPORARILY_LOCKED");
        error.RetryAfterSeconds.Should().Be(15 * 60);
        await _userRepository.Received(1).LockUserAsync(user.Id, Arg.Any<DateTime>());
    }

    [Fact]
    public async Task HandleAsync_SuccessAfterFailures_ResetsFailedCount()
    {
        var user = CreateUser(failedLoginCount: 2);
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        await _userRepository.Received(1).ResetFailedLoginAsync(user.Id);
    }

    [Fact]
    public async Task HandleAsync_SuccessWithNoFailures_DoesNotResetCounter()
    {
        var user = CreateUser(failedLoginCount: 0);
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        await _userRepository.DidNotReceive().ResetFailedLoginAsync(Arg.Any<Guid>());
    }

    [Fact]
    public async Task HandleAsync_WithTenantId_PassesTenantToTokenService()
    {
        var tenantId = Guid.NewGuid();
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetActiveTenantIdsAsync(user.Id).Returns(new List<Guid> { tenantId });
        _userRepository.GetTenantIdAsync(user.Id).Returns(tenantId);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), tenantId).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        _tokenService.Received(1).GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), tenantId);
    }

    [Fact]
    public async Task HandleAsync_Success_CreatesSession()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string>());
        _tokenService.GenerateAccessToken(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123", UserAgent: "Mozilla", IpAddress: "1.2.3.4"));

        await _userRepository.Received(1).CreateSessionAsync(Arg.Is<UserSession>(s =>
            s.UserId == user.Id &&
            s.SchoolId == user.SchoolId &&
            s.UserAgent == "Mozilla" &&
            s.IpAddress == "1.2.3.4"));
    }

    [Fact]
    public async Task HandleAsync_Success_UpdatesLastLogin()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string>());
        _tokenService.GenerateAccessToken(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        await _userRepository.Received(1).UpdateLastLoginAsync(user.Id);
    }

    [Fact]
    public async Task HandleAsync_SchoolContractExpired_ReturnsForbidden()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId)
            .Returns(new SchoolSessionPolicy
            {
                MaxConcurrentSessions = 1,
                ContractEnd = DateTime.UtcNow.AddDays(-1),
                EnforceExpiry = true
            });

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().BeNull();
        error.Should().NotBeNull();
        error!.Code.Should().Be("SCHOOL_CONTRACT_EXPIRED");
    }

    [Fact]
    public async Task HandleAsync_SchoolContractExpired_WritesLoginFailedAuditLog()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId)
            .Returns(new SchoolSessionPolicy
            {
                MaxConcurrentSessions = 1,
                ContractEnd = DateTime.UtcNow.AddDays(-1),
                EnforceExpiry = true
            });

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123", IpAddress: "1.2.3.4"));

        await _auditLogService.Received(1).LogAsync(Arg.Is<AuditLogEntry>(e =>
            e.Action == "LOGIN_FAILED" &&
            e.ActorUserId == user.Id));
    }

    [Fact]
    public async Task HandleAsync_SchoolContractExpired_EnforceExpiryFalse_Allows()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId)
            .Returns(new SchoolSessionPolicy
            {
                MaxConcurrentSessions = 0,
                ContractEnd = DateTime.UtcNow.AddDays(-1),
                EnforceExpiry = false
            });
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string>());
        _tokenService.GenerateAccessToken(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().NotBeNull();
        error.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WrongPassword_WritesLoginFailedAuditLog()
    {
        var user = CreateUser(failedLoginCount: 0);
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);

        await _handler.HandleAsync(new LoginCommand("testuser", "WrongPassword!", IpAddress: "1.2.3.4"));

        await _auditLogService.Received(1).LogAsync(Arg.Is<AuditLogEntry>(e =>
            e.Action == "LOGIN_FAILED" &&
            e.ActorUserId == user.Id));
    }

    [Fact]
    public async Task HandleAsync_Success_WritesLoginSuccessAuditLog()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string>());
        _tokenService.GenerateAccessToken(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        await _auditLogService.Received(1).LogAsync(Arg.Is<AuditLogEntry>(e =>
            e.Action == "LOGIN_SUCCESS" &&
            e.ActorUserId == user.Id));
    }

    [Fact]
    public async Task HandleAsync_BlockedBySessionPolicy_WritesSessionBlockedAuditLog()
    {
        var user = CreateUser();
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId)
            .Returns(new SchoolSessionPolicy
            {
                MaxConcurrentSessions = 1,
                Policy = ConcurrentSessionPolicy.BlockNew
            });
        _userRepository.CountActiveSessionsAsync(user.Id, user.SchoolId).Returns(1);

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().BeNull();
        error!.Code.Should().Be("CONCURRENT_SESSION_LIMIT");
        await _auditLogService.Received(1).LogAsync(Arg.Is<AuditLogEntry>(e =>
            e.Action == "SESSION_BLOCKED" &&
            e.ActorUserId == user.Id));
    }

    [Fact]
    public async Task HandleAsync_KickOldestPolicy_KicksOldestSessionAndSucceeds()
    {
        var user = CreateUser();
        var oldestSession = new UserSession { Id = Guid.NewGuid(), UserId = user.Id, SchoolId = user.SchoolId };
        _userRepository.FindByIdentifierAsync("testuser").Returns(user);
        _userRepository.GetSchoolSessionPolicyAsync(user.SchoolId)
            .Returns(new SchoolSessionPolicy
            {
                MaxConcurrentSessions = 1,
                Policy = ConcurrentSessionPolicy.KickOldest
            });
        _userRepository.CountActiveSessionsAsync(user.Id, user.SchoolId).Returns(1);
        _userRepository.GetOldestActiveSessionAsync(user.Id, user.SchoolId).Returns(oldestSession);
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string>());
        _tokenService.GenerateAccessToken(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyList<string>>(), Arg.Any<Guid?>()).Returns("token");
        _tokenService.GenerateRefreshToken().Returns("refresh");
        _tokenService.HashRefreshToken("refresh").Returns("hash");
        _userRepository.CreateSessionAsync(Arg.Any<UserSession>()).Returns(Guid.NewGuid());

        var (result, error) = await _handler.HandleAsync(new LoginCommand("testuser", "Correct@123"));

        result.Should().NotBeNull();
        error.Should().BeNull();
        await _userRepository.Received(1).RevokeSessionAsync(oldestSession.Id);
        await _auditLogService.Received(1).LogAsync(Arg.Is<AuditLogEntry>(e =>
            e.Action == "SESSION_KICKED" &&
            e.ActorUserId == user.Id));
    }
}
