using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Identity;

public class IdentifyCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IdentifyCommandHandler _handler;

    public IdentifyCommandHandlerTests()
    {
        _handler = new IdentifyCommandHandler(_userRepository);
    }

    private static UserAccount MakeUser(string status = "ACTIVE") => new()
    {
        Id = Guid.NewGuid(),
        SchoolId = Guid.NewGuid(),
        Username = "testuser",
        Email = "test@test.com",
        PasswordHash = "hash",
        FullName = "Test User",
        Status = status
    };

    // ----------------------------------------------------------------
    // Validation
    // ----------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_EmptyIdentifier_ReturnsValidationError()
    {
        var (result, error) = await _handler.HandleAsync(new IdentifyCommand(""));

        result.Should().BeNull();
        error!.Code.Should().Be("VALIDATION_ERROR");
    }

    [Fact]
    public async Task HandleAsync_WhitespaceIdentifier_ReturnsValidationError()
    {
        var (result, error) = await _handler.HandleAsync(new IdentifyCommand("   "));

        result.Should().BeNull();
        error!.Code.Should().Be("VALIDATION_ERROR");
    }

    // ----------------------------------------------------------------
    // Anti-enumeration: never reveal whether user exists
    // ----------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_UserNotFound_ReturnsPasswordStepNoError()
    {
        _userRepository.FindByIdentifierAsync("ghost").Returns((UserAccount?)null);

        var (result, error) = await _handler.HandleAsync(new IdentifyCommand("ghost"));

        error.Should().BeNull();
        result!.NextStep.Should().Be("PASSWORD");
    }

    [Fact]
    public async Task HandleAsync_DeletedUser_ReturnsPasswordStepNoError()
    {
        var deleted = MakeUser(status: "DELETED");
        _userRepository.FindByIdentifierAsync(deleted.Username).Returns(deleted);

        var (result, error) = await _handler.HandleAsync(new IdentifyCommand(deleted.Username));

        error.Should().BeNull();
        result!.NextStep.Should().Be("PASSWORD");
    }

    // ----------------------------------------------------------------
    // nextStep is always "PASSWORD"
    // ----------------------------------------------------------------

    [Fact]
    public async Task HandleAsync_ValidUser_ReturnsPasswordStep()
    {
        var user = MakeUser();
        _userRepository.FindByIdentifierAsync(user.Username).Returns(user);

        var (result, error) = await _handler.HandleAsync(new IdentifyCommand(user.Username));

        error.Should().BeNull();
        result!.NextStep.Should().Be("PASSWORD");
    }

    [Fact]
    public async Task HandleAsync_LockedUser_ReturnsPasswordStep()
    {
        var user = MakeUser(status: "LOCKED");
        _userRepository.FindByIdentifierAsync(user.Username).Returns(user);

        var (result, error) = await _handler.HandleAsync(new IdentifyCommand(user.Username));

        // Identify does NOT reveal account status — that's revealed at login
        error.Should().BeNull();
        result!.NextStep.Should().Be("PASSWORD");
    }

    [Fact]
    public async Task HandleAsync_DisabledUser_ReturnsPasswordStep()
    {
        var user = MakeUser(status: "DISABLED");
        _userRepository.FindByIdentifierAsync(user.Username).Returns(user);

        var (result, error) = await _handler.HandleAsync(new IdentifyCommand(user.Username));

        error.Should().BeNull();
        result!.NextStep.Should().Be("PASSWORD");
    }
}
