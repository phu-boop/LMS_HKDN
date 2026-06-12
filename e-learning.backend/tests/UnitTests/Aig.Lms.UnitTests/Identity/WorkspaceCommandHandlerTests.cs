using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using Aig.Lms.Modules.Tenancy.Application.Abstractions;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class GetWorkspacesQueryHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITenantResolutionService _tenantResolutionService = Substitute.For<ITenantResolutionService>();
    private readonly GetWorkspacesQueryHandler _handler;

    public GetWorkspacesQueryHandlerTests()
    {
        _handler = new GetWorkspacesQueryHandler(_userRepository, _tenantResolutionService);
    }

    private static TenantSummary MakeTenant(Guid id, string code = "STEM", string status = "ACTIVE") =>
        new(id, code, $"Tenant {code}", code.ToLower(), $"{code.ToLower()}.daihoc.io.vn", status,
            new TenantBrandingInfo("logo.png", "avatar.png", null));

    [Fact]
    public async Task HandleAsync_ReturnsWorkspacesForUser()
    {
        var userId = Guid.NewGuid();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        _userRepository.GetActiveTenantIdsAsync(userId)
            .Returns(new List<Guid> { tenantId1, tenantId2 });
        _tenantResolutionService.GetByTenantIdAsync(tenantId1)
            .Returns(MakeTenant(tenantId1, "STEM"));
        _tenantResolutionService.GetByTenantIdAsync(tenantId2)
            .Returns(MakeTenant(tenantId2, "MATH"));

        var result = await _handler.HandleAsync(new GetWorkspacesQuery(userId, null));

        result.Should().HaveCount(2);
        result.Should().ContainSingle(w => w.TenantId == tenantId1 && w.TenantCode == "STEM");
        result.Should().ContainSingle(w => w.TenantId == tenantId2 && w.TenantCode == "MATH");
    }

    [Fact]
    public async Task HandleAsync_MarksCurrentTenantCorrectly()
    {
        var userId = Guid.NewGuid();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        _userRepository.GetActiveTenantIdsAsync(userId)
            .Returns(new List<Guid> { tenantId1, tenantId2 });
        _tenantResolutionService.GetByTenantIdAsync(tenantId1).Returns(MakeTenant(tenantId1, "STEM"));
        _tenantResolutionService.GetByTenantIdAsync(tenantId2).Returns(MakeTenant(tenantId2, "MATH"));

        var result = await _handler.HandleAsync(new GetWorkspacesQuery(userId, tenantId1));

        result.Single(w => w.TenantId == tenantId1).IsCurrentTenant.Should().BeTrue();
        result.Single(w => w.TenantId == tenantId2).IsCurrentTenant.Should().BeFalse();
    }

    [Fact]
    public async Task HandleAsync_FiltersOutInactiveTenants()
    {
        var userId = Guid.NewGuid();
        var activeTenantId = Guid.NewGuid();
        var inactiveTenantId = Guid.NewGuid();

        _userRepository.GetActiveTenantIdsAsync(userId)
            .Returns(new List<Guid> { activeTenantId, inactiveTenantId });
        _tenantResolutionService.GetByTenantIdAsync(activeTenantId)
            .Returns(MakeTenant(activeTenantId, "STEM", "ACTIVE"));
        _tenantResolutionService.GetByTenantIdAsync(inactiveTenantId)
            .Returns(MakeTenant(inactiveTenantId, "OLD", "INACTIVE"));

        var result = await _handler.HandleAsync(new GetWorkspacesQuery(userId, null));

        result.Should().HaveCount(1);
        result.Single().TenantId.Should().Be(activeTenantId);
    }

    [Fact]
    public async Task HandleAsync_FiltersOutNullTenantSummaries()
    {
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var deletedTenantId = Guid.NewGuid();

        _userRepository.GetActiveTenantIdsAsync(userId)
            .Returns(new List<Guid> { tenantId, deletedTenantId });
        _tenantResolutionService.GetByTenantIdAsync(tenantId).Returns(MakeTenant(tenantId, "STEM"));
        _tenantResolutionService.GetByTenantIdAsync(deletedTenantId).Returns((TenantSummary?)null);

        var result = await _handler.HandleAsync(new GetWorkspacesQuery(userId, null));

        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task HandleAsync_ReturnsEmptyList_WhenNoTenants()
    {
        var userId = Guid.NewGuid();
        _userRepository.GetActiveTenantIdsAsync(userId).Returns(new List<Guid>());

        var result = await _handler.HandleAsync(new GetWorkspacesQuery(userId, null));

        result.Should().BeEmpty();
    }
}

public class SelectWorkspaceCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ITokenService _tokenService = Substitute.For<ITokenService>();
    private readonly ITenantResolutionService _tenantResolutionService = Substitute.For<ITenantResolutionService>();
    private readonly SelectWorkspaceCommandHandler _handler;

    public SelectWorkspaceCommandHandlerTests()
    {
        _tokenService.ExpiresInSeconds.Returns(3600);
        _handler = new SelectWorkspaceCommandHandler(_userRepository, _tokenService, _tenantResolutionService);
    }

    private static UserAccount CreateActiveUser(Guid? schoolId = null) => new()
    {
        Id = Guid.NewGuid(),
        SchoolId = schoolId,
        Username = "teacher01",
        Email = "teacher01@demo.edu.vn",
        PasswordHash = "hash",
        FullName = "Teacher 01",
        Status = "ACTIVE"
    };

    private static UserSession CreateActiveSession(Guid userId, Guid tenantId) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        TenantId = tenantId,
        Status = "ACTIVE"
    };

    private static TenantSummary MakeTenant(Guid id, string code = "STEM") =>
        new(id, code, $"Tenant {code}", code.ToLower(), $"{code.ToLower()}.daihoc.io.vn", "ACTIVE",
            new TenantBrandingInfo(null, null, null));

    [Fact]
    public async Task HandleAsync_ValidSwitch_ReturnsNewTokens()
    {
        var user = CreateActiveUser();
        var currentTenantId = Guid.NewGuid();
        var targetTenantId = Guid.NewGuid();
        var session = CreateActiveSession(user.Id, currentTenantId);

        _tokenService.HashRefreshToken("old-refresh").Returns("old-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("old-hash").Returns(session);
        _userRepository.FindByIdAsync(user.Id).Returns(user);
        _userRepository.GetActiveTenantIdsAsync(user.Id)
            .Returns(new List<Guid> { currentTenantId, targetTenantId });
        _tenantResolutionService.GetByTenantIdAsync(targetTenantId).Returns(MakeTenant(targetTenantId));
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateRefreshToken().Returns("new-refresh");
        _tokenService.HashRefreshToken("new-refresh").Returns("new-hash");
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), targetTenantId, Arg.Any<string?>())
            .Returns("new-access-token");

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            user.Id, targetTenantId, "old-refresh"));

        result.Should().NotBeNull();
        result!.AccessToken.Should().Be("new-access-token");
        result.RefreshToken.Should().Be("new-refresh");
        error.Should().BeNull();
        await _userRepository.Received(1).UpdateSessionTenantAsync(session.Id, targetTenantId, "new-hash");
    }

    [Fact]
    public async Task HandleAsync_InvalidRefreshToken_Returns401()
    {
        _tokenService.HashRefreshToken("bad-token").Returns("bad-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("bad-hash").Returns((UserSession?)null);

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            Guid.NewGuid(), Guid.NewGuid(), "bad-token"));

        result.Should().BeNull();
        error!.Code.Should().Be("INVALID_TOKEN");
    }

    [Fact]
    public async Task HandleAsync_SessionBelongsToDifferentUser_Returns401()
    {
        var session = CreateActiveSession(Guid.NewGuid(), Guid.NewGuid()); // different userId
        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            Guid.NewGuid(), Guid.NewGuid(), "token")); // different userId in command

        result.Should().BeNull();
        error!.Code.Should().Be("INVALID_TOKEN");
    }

    [Fact]
    public async Task HandleAsync_InactiveUser_RevokesSessionAndReturns403()
    {
        var user = new UserAccount
        {
            Id = Guid.NewGuid(),
            Username = "teacher01",
            Email = "teacher01@demo.edu.vn",
            PasswordHash = "hash",
            FullName = "Teacher 01",
            Status = "DISABLED"
        };
        var session = CreateActiveSession(user.Id, Guid.NewGuid());

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.FindByIdAsync(user.Id).Returns(user);

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            user.Id, Guid.NewGuid(), "token"));

        result.Should().BeNull();
        error!.Code.Should().Be("USER_INACTIVE");
        await _userRepository.Received(1).RevokeSessionAsync(session.Id);
    }

    [Fact]
    public async Task HandleAsync_TenantNotInUserList_Returns403()
    {
        var user = CreateActiveUser();
        var session = CreateActiveSession(user.Id, Guid.NewGuid());
        var otherTenantId = Guid.NewGuid();

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.FindByIdAsync(user.Id).Returns(user);
        _userRepository.GetActiveTenantIdsAsync(user.Id)
            .Returns(new List<Guid> { Guid.NewGuid() }); // different tenant

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            user.Id, otherTenantId, "token"));

        result.Should().BeNull();
        error!.Code.Should().Be("TENANT_NOT_ACCESSIBLE");
    }

    [Fact]
    public async Task HandleAsync_InactiveTenant_Returns403()
    {
        var user = CreateActiveUser();
        var targetTenantId = Guid.NewGuid();
        var session = CreateActiveSession(user.Id, Guid.NewGuid());

        _tokenService.HashRefreshToken("token").Returns("hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("hash").Returns(session);
        _userRepository.FindByIdAsync(user.Id).Returns(user);
        _userRepository.GetActiveTenantIdsAsync(user.Id)
            .Returns(new List<Guid> { targetTenantId });
        _tenantResolutionService.GetByTenantIdAsync(targetTenantId)
            .Returns(new TenantSummary(targetTenantId, "OLD", "Old Tenant", "old", "old.daihoc.io.vn",
                "INACTIVE", new TenantBrandingInfo(null, null, null)));

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            user.Id, targetTenantId, "token"));

        result.Should().BeNull();
        error!.Code.Should().Be("TENANT_NOT_ACCESSIBLE");
    }

    [Fact]
    public async Task HandleAsync_SwitchToSameTenant_StillRotatesToken()
    {
        var user = CreateActiveUser();
        var tenantId = Guid.NewGuid();
        var session = CreateActiveSession(user.Id, tenantId); // already on this tenant

        _tokenService.HashRefreshToken("old-refresh").Returns("old-hash");
        _userRepository.FindSessionByRefreshTokenHashAsync("old-hash").Returns(session);
        _userRepository.FindByIdAsync(user.Id).Returns(user);
        _userRepository.GetActiveTenantIdsAsync(user.Id).Returns(new List<Guid> { tenantId });
        _tenantResolutionService.GetByTenantIdAsync(tenantId).Returns(MakeTenant(tenantId));
        _userRepository.GetRoleCodesAsync(user.Id).Returns(new List<string> { "TEACHER" });
        _tokenService.GenerateRefreshToken().Returns("new-refresh");
        _tokenService.HashRefreshToken("new-refresh").Returns("new-hash");
        _tokenService.GenerateAccessToken(user, Arg.Any<IReadOnlyList<string>>(), tenantId, Arg.Any<string?>())
            .Returns("new-access-token");

        var (result, error) = await _handler.HandleAsync(new SelectWorkspaceCommand(
            user.Id, tenantId, "old-refresh"));

        result.Should().NotBeNull();
        error.Should().BeNull();
        await _userRepository.Received(1).UpdateSessionTenantAsync(session.Id, tenantId, "new-hash");
    }
}
