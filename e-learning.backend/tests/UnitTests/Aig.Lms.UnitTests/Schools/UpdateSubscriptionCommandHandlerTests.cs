using Aig.Lms.Modules.Schools.Application;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Schools;

public class UpdateSubscriptionCommandHandlerTests
{
    private readonly ISchoolRepository _repository = Substitute.For<ISchoolRepository>();
    private readonly UpdateSubscriptionCommandHandler _handler;

    private static readonly Guid Id = Guid.NewGuid();
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly DateOnly Start = new(2025, 1, 1);
    private static readonly DateOnly End = new(2025, 12, 31);

    public UpdateSubscriptionCommandHandlerTests()
    {
        _handler = new UpdateSubscriptionCommandHandler(_repository);
        _repository.UpdateSubscriptionAsync(Arg.Any<UpdateSubscriptionCommand>())
            .Returns(new UpdateSubscriptionResult(Id, SchoolId, TenantId, Start, End, 100, "BLOCK_NEW", true));
    }

    private UpdateSubscriptionCommand ValidCommand(
        DateOnly? start = null, DateOnly? end = null,
        int maxSessions = 100, string policy = "BLOCK_NEW", bool enforceExpiry = true)
        => new(Id, SchoolId, start ?? Start, end ?? End, maxSessions, policy, enforceExpiry);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ValidCommand_DelegatesUpdateToRepository()
    {
        var result = await _handler.HandleAsync(ValidCommand());

        result.Should().NotBeNull();
        result!.Id.Should().Be(Id);
        result.MaxConcurrentSessions.Should().Be(100);
        await _repository.Received(1).UpdateSubscriptionAsync(Arg.Any<UpdateSubscriptionCommand>());
    }

    [Fact]
    public async Task HandleAsync_NotFound_ReturnsNull()
    {
        _repository.UpdateSubscriptionAsync(Arg.Any<UpdateSubscriptionCommand>())
            .Returns((UpdateSubscriptionResult?)null);

        var result = await _handler.HandleAsync(ValidCommand());

        result.Should().BeNull();
    }

    // ── Validation errors ─────────────────────────────────────────────────────

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
    [InlineData(-5)]
    public async Task HandleAsync_InvalidMaxSessions_Throws(int maxSessions)
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(maxSessions: maxSessions));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*concurrent sessions*");
    }

    [Fact]
    public async Task HandleAsync_InvalidLoginPolicy_Throws()
    {
        var act = async () => await _handler.HandleAsync(ValidCommand(policy: "UNKNOWN"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Login policy*");
    }
}
