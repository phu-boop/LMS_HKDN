using Aig.Lms.Modules.Schools.Application;
using Aig.Lms.Modules.Schools.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Schools;

public class CreateSubscriptionCommandHandlerTests
{
    private readonly ISchoolRepository _repository = Substitute.For<ISchoolRepository>();
    private readonly CreateSubscriptionCommandHandler _handler;

    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly DateOnly Start = new(2025, 1, 1);
    private static readonly DateOnly End = new(2025, 12, 31);

    public CreateSubscriptionCommandHandlerTests()
    {
        _handler = new CreateSubscriptionCommandHandler(_repository);
        _repository.SchoolExistsAsync(SchoolId).Returns(true);
        _repository.SubscriptionExistsAsync(SchoolId, TenantId, null).Returns(false);
    }

    private CreateSubscriptionCommand ValidCommand(
        Guid? schoolId = null, Guid? tenantId = null,
        DateOnly? start = null, DateOnly? end = null,
        int maxSessions = 100, string policy = "BLOCK_NEW", bool enforceExpiry = true)
        => new(schoolId ?? SchoolId, tenantId ?? TenantId,
            start ?? Start, end ?? End, maxSessions, policy, enforceExpiry);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ValidCommand_CreatesAndReturnsResult()
    {
        var result = await _handler.HandleAsync(ValidCommand());

        result.Id.Should().NotBeEmpty();
        result.SchoolId.Should().Be(SchoolId);
        result.TenantId.Should().Be(TenantId);
        result.ContractStart.Should().Be(Start);
        result.ContractEnd.Should().Be(End);
        result.MaxConcurrentSessions.Should().Be(100);
        result.LoginPolicy.Should().Be("BLOCK_NEW");
        result.EnforceExpiry.Should().BeTrue();
        await _repository.Received(1).CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    [Theory]
    [InlineData("BLOCK_NEW")]
    [InlineData("KICK_OLDEST")]
    [InlineData("block_new")]
    [InlineData("kick_oldest")]
    public async Task HandleAsync_AllValidPolicies_NormalisedToUppercase(string policy)
    {
        var result = await _handler.HandleAsync(ValidCommand(policy: policy));

        result.LoginPolicy.Should().BeOneOf("BLOCK_NEW", "KICK_OLDEST");
    }

    // ── Validation errors ─────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_EmptySchoolId_Throws()
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(schoolId: Guid.Empty));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*School ID*");
    }

    [Fact]
    public async Task HandleAsync_EmptyTenantId_Throws()
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(tenantId: Guid.Empty));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Tenant ID*");
    }

    [Fact]
    public async Task HandleAsync_EndBeforeStart_Throws()
    {
        var act = async () => await _handler.HandleAsync(
            ValidCommand(start: new DateOnly(2025, 6, 1), end: new DateOnly(2025, 1, 1)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*end date*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task HandleAsync_InvalidMaxSessions_Throws(int maxSessions)
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(maxSessions: maxSessions));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*concurrent sessions*");
    }

    [Fact]
    public async Task HandleAsync_InvalidLoginPolicy_Throws()
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(policy: "INVALID"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Login policy*");
    }

    [Fact]
    public async Task HandleAsync_SchoolNotFound_Throws()
    {
        _repository.SchoolExistsAsync(SchoolId).Returns(false);

        var act = async () => await _handler.HandleAsync(ValidCommand());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task HandleAsync_DuplicateSubscription_Throws()
    {
        _repository.SubscriptionExistsAsync(SchoolId, TenantId, null).Returns(true);

        var act = async () => await _handler.HandleAsync(ValidCommand());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*subscription*");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateSubscriptionsBulkCommandHandler tests
// ─────────────────────────────────────────────────────────────────────────────

public class CreateSubscriptionsBulkCommandHandlerTests
{
    private readonly ISchoolRepository _repository = Substitute.For<ISchoolRepository>();
    private readonly CreateSubscriptionsBulkCommandHandler _handler;

    private static readonly Guid SchoolId  = Guid.NewGuid();
    private static readonly Guid Tenant1   = Guid.NewGuid();
    private static readonly Guid Tenant2   = Guid.NewGuid();
    private static readonly Guid Tenant3   = Guid.NewGuid();
    private static readonly DateOnly Start = new(2025, 1, 1);
    private static readonly DateOnly End   = new(2025, 12, 31);

    public CreateSubscriptionsBulkCommandHandlerTests()
    {
        _handler = new CreateSubscriptionsBulkCommandHandler(_repository);
        _repository.SchoolExistsAsync(SchoolId).Returns(true);
        // Default: no existing subscriptions
        _repository.SubscriptionExistsAsync(SchoolId, Arg.Any<Guid>(), null).Returns(false);
    }

    private CreateSubscriptionsBulkCommand BulkCommand(
        IReadOnlyList<Guid>? tenantIds = null,
        DateOnly? start = null, DateOnly? end = null,
        int maxSessions = 100, string policy = "BLOCK_NEW", bool enforceExpiry = true)
        => new(SchoolId, tenantIds ?? new[] { Tenant1, Tenant2 },
            start ?? Start, end ?? End, maxSessions, policy, enforceExpiry);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_TwoTenants_CreatesTwoSubscriptions()
    {
        var result = await _handler.HandleAsync(BulkCommand(new[] { Tenant1, Tenant2 }));

        result.Created.Should().HaveCount(2);
        result.SkippedDuplicates.Should().BeEmpty();
        result.Created.Select(r => r.TenantId).Should().BeEquivalentTo(new[] { Tenant1, Tenant2 });
        await _repository.Received(2).CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    [Fact]
    public async Task HandleAsync_SameConfigAppliedToAllTenants()
    {
        var result = await _handler.HandleAsync(BulkCommand(
            new[] { Tenant1, Tenant2 }, maxSessions: 250, policy: "KICK_OLDEST", enforceExpiry: false));

        result.Created.Should().AllSatisfy(r =>
        {
            r.MaxConcurrentSessions.Should().Be(250);
            r.LoginPolicy.Should().Be("KICK_OLDEST");
            r.EnforceExpiry.Should().BeFalse();
        });
    }

    [Fact]
    public async Task HandleAsync_DuplicateTenantSkipped_OthersTenantCreated()
    {
        // Tenant1 already exists, Tenant2 is new
        _repository.SubscriptionExistsAsync(SchoolId, Tenant1, null).Returns(true);
        _repository.SubscriptionExistsAsync(SchoolId, Tenant2, null).Returns(false);

        var result = await _handler.HandleAsync(BulkCommand(new[] { Tenant1, Tenant2 }));

        result.Created.Should().HaveCount(1);
        result.Created[0].TenantId.Should().Be(Tenant2);
        result.SkippedDuplicates.Should().ContainSingle().Which.Should().Be(Tenant1);
        await _repository.Received(1).CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    [Fact]
    public async Task HandleAsync_AllDuplicates_ReturnsEmptyCreatedList()
    {
        _repository.SubscriptionExistsAsync(SchoolId, Arg.Any<Guid>(), null).Returns(true);

        var result = await _handler.HandleAsync(BulkCommand(new[] { Tenant1, Tenant2 }));

        result.Created.Should().BeEmpty();
        result.SkippedDuplicates.Should().HaveCount(2);
        await _repository.DidNotReceive().CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    [Fact]
    public async Task HandleAsync_DuplicateTenantIdsInInput_DeduplicatedBeforeProcessing()
    {
        // Tenant1 passed twice — should only attempt to create once
        var result = await _handler.HandleAsync(BulkCommand(new[] { Tenant1, Tenant1 }));

        result.Created.Should().HaveCount(1);
        await _repository.Received(1).CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    [Fact]
    public async Task HandleAsync_ThreeTenants_AllCreated()
    {
        var result = await _handler.HandleAsync(BulkCommand(new[] { Tenant1, Tenant2, Tenant3 }));

        result.Created.Should().HaveCount(3);
        await _repository.Received(3).CreateSubscriptionAsync(Arg.Any<SchoolSubscription>());
    }

    // ── Validation errors ─────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_EmptyTenantList_Throws()
    {
        var act = async () => await _handler.HandleAsync(BulkCommand(Array.Empty<Guid>()));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Tenant ID*");
    }

    [Fact]
    public async Task HandleAsync_EmptySchoolId_Throws()
    {
        var cmd = new CreateSubscriptionsBulkCommand(Guid.Empty, new[] { Tenant1 }, Start, End);

        var act = async () => await _handler.HandleAsync(cmd);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*School ID*");
    }

    [Fact]
    public async Task HandleAsync_EndBeforeStart_Throws()
    {
        var act = async () => await _handler.HandleAsync(
            BulkCommand(start: new DateOnly(2025, 6, 1), end: new DateOnly(2025, 1, 1)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*end date*");
    }

    [Fact]
    public async Task HandleAsync_InvalidPolicy_Throws()
    {
        var act = async () => await _handler.HandleAsync(BulkCommand(policy: "INVALID"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Login policy*");
    }

    [Fact]
    public async Task HandleAsync_SchoolNotFound_Throws()
    {
        _repository.SchoolExistsAsync(SchoolId).Returns(false);

        var act = async () => await _handler.HandleAsync(BulkCommand());

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
