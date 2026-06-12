using Aig.Lms.Modules.Schools.Application;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Schools;

public class UpdateSchoolCommandHandlerTests
{
    private readonly ISchoolRepository _repository = Substitute.For<ISchoolRepository>();
    private readonly UpdateSchoolCommandHandler _handler;
    private static readonly Guid SchoolId = Guid.NewGuid();

    public UpdateSchoolCommandHandlerTests()
    {
        _handler = new UpdateSchoolCommandHandler(_repository);
    }

    private static UpdateSchoolCommand FullCommand(
        string name = "THPT Lê Hồng Phong Updated",
        string? taxId = "0123456789",
        string? province = "HCM",
        string? district = "Q5",
        string? address = "1 Đường ABC",
        string? contactName = "Nguyễn Văn B",
        string? contactEmail = "b@lhp.edu.vn",
        string? contactPhone = "0909000111",
        DateOnly? startDate = null,
        DateOnly? endDate = null)
        => new UpdateSchoolCommand(SchoolId, name, taxId, province, district, address,
            contactName, contactEmail, contactPhone, startDate, endDate);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_ValidCommand_DelegatesUpdateToRepository()
    {
        var expected = new UpdateSchoolResult(
            SchoolId, "SCH001", "THPT Lê Hồng Phong Updated",
            "0123456789", "HCM", "Q5", "1 Đường ABC",
            "Nguyễn Văn B", "b@lhp.edu.vn", "0909000111",
            null, null, "ACTIVE");

        _repository.UpdateAsync(Arg.Any<UpdateSchoolCommand>()).Returns(expected);

        var result = await _handler.HandleAsync(FullCommand());

        result.Should().NotBeNull();
        result!.Name.Should().Be("THPT Lê Hồng Phong Updated");
        result.Status.Should().Be("ACTIVE");
        await _repository.Received(1).UpdateAsync(Arg.Any<UpdateSchoolCommand>());
    }

    [Fact]
    public async Task HandleAsync_SchoolNotFound_ReturnsNull()
    {
        _repository.UpdateAsync(Arg.Any<UpdateSchoolCommand>()).Returns((UpdateSchoolResult?)null);

        var result = await _handler.HandleAsync(FullCommand());

        result.Should().BeNull();
    }

    [Fact]
    public async Task HandleAsync_WithContractDates_PassesDatesToRepository()
    {
        var startDate = new DateOnly(2024, 1, 1);
        var endDate = new DateOnly(2025, 12, 31);
        var expected = new UpdateSchoolResult(
            SchoolId, "SCH001", "Trường X",
            null, null, null, null, null, null, null,
            startDate, endDate, "ACTIVE");

        _repository.UpdateAsync(Arg.Any<UpdateSchoolCommand>()).Returns(expected);

        var result = await _handler.HandleAsync(FullCommand(startDate: startDate, endDate: endDate));

        result!.ContractStartDate.Should().Be(startDate);
        result.ContractEndDate.Should().Be(endDate);
        await _repository.Received(1).UpdateAsync(
            Arg.Is<UpdateSchoolCommand>(c =>
                c.ContractStartDate == startDate &&
                c.ContractEndDate == endDate));
    }

    // ── Required field validation ─────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public async Task HandleAsync_EmptyName_ThrowsInvalidOperationException(string name)
    {
        var act = () => _handler.HandleAsync(FullCommand(name: name));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*name*required*");
        await _repository.DidNotReceive().UpdateAsync(Arg.Any<UpdateSchoolCommand>());
    }

    // ── Length validation ─────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_NameExceeds255Chars_ThrowsInvalidOperationException()
    {
        var longName = new string('a', 256);

        var act = () => _handler.HandleAsync(FullCommand(name: longName));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*255*");
        await _repository.DidNotReceive().UpdateAsync(Arg.Any<UpdateSchoolCommand>());
    }

    // ── Contract date validation ──────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_EndDateBeforeStartDate_ThrowsInvalidOperationException()
    {
        var act = () => _handler.HandleAsync(FullCommand(
            startDate: new DateOnly(2025, 6, 1),
            endDate: new DateOnly(2025, 1, 1)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*contract end*before*start*");
        await _repository.DidNotReceive().UpdateAsync(Arg.Any<UpdateSchoolCommand>());
    }

    [Fact]
    public async Task HandleAsync_SameDateForStartAndEnd_IsAllowed()
    {
        var date = new DateOnly(2025, 12, 31);
        var expected = new UpdateSchoolResult(
            SchoolId, "SCH001", "Trường X",
            null, null, null, null, null, null, null,
            date, date, "ACTIVE");
        _repository.UpdateAsync(Arg.Any<UpdateSchoolCommand>()).Returns(expected);

        var act = () => _handler.HandleAsync(FullCommand(startDate: date, endDate: date));

        await act.Should().NotThrowAsync();
    }
}
