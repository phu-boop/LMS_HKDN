using Aig.Lms.Modules.Schools.Application;
using Aig.Lms.Modules.Schools.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Schools;

public class CreateSchoolCommandHandlerTests
{
    private readonly ISchoolRepository _repository = Substitute.For<ISchoolRepository>();
    private readonly CreateSchoolCommandHandler _handler;

    public CreateSchoolCommandHandlerTests()
    {
        _handler = new CreateSchoolCommandHandler(_repository);
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_FullValidCommand_CreatesSchoolAndReturnsResult()
    {
        _repository.CodeExistsAsync("SCH001").Returns(false);

        var command = new CreateSchoolCommand(
            Code: "SCH001",
            Name: "THPT Lê Hồng Phong",
            TaxId: "0123456789",
            Province: "HCM",
            District: "Q5",
            Address: "1 Lê Hồng Phong, P4, Q5, TP.HCM",
            ContactName: "Nguyễn Văn A",
            ContactEmail: "contact@lhp.edu.vn",
            ContactPhone: "0909123456",
            ContractStartDate: new DateOnly(2024, 1, 1),
            ContractEndDate: new DateOnly(2025, 12, 31));

        var result = await _handler.HandleAsync(command);

        result.SchoolId.Should().NotBeEmpty();
        result.Code.Should().Be("SCH001");
        result.Name.Should().Be("THPT Lê Hồng Phong");
        await _repository.Received(1).CreateAsync(Arg.Any<School>());
    }

    [Fact]
    public async Task HandleAsync_CodeIsNormalisedToUppercase()
    {
        _repository.CodeExistsAsync("LHP-HCM").Returns(false);

        var result = await _handler.HandleAsync(new CreateSchoolCommand("lhp-hcm", "THPT Lê Hồng Phong"));

        result.Code.Should().Be("LHP-HCM");
        await _repository.Received(1).CodeExistsAsync("LHP-HCM");
    }

    [Fact]
    public async Task HandleAsync_NameIsTrimmed()
    {
        _repository.CodeExistsAsync("S001").Returns(false);

        var result = await _handler.HandleAsync(new CreateSchoolCommand("S001", "  Trường ABC  "));

        result.Name.Should().Be("Trường ABC");
    }

    [Fact]
    public async Task HandleAsync_MinimalCommand_OptionalFieldsAreNull()
    {
        _repository.CodeExistsAsync("S001").Returns(false);

        await _handler.HandleAsync(new CreateSchoolCommand("S001", "Trường ABC"));

        await _repository.Received(1).CreateAsync(Arg.Is<School>(s =>
            s.TaxId == null &&
            s.ContactName == null &&
            s.ContactEmail == null &&
            s.ContactPhone == null &&
            s.ContractStartDate == null &&
            s.ContractEndDate == null));
    }

    [Fact]
    public async Task HandleAsync_NewSchool_DefaultStatusIsActive()
    {
        _repository.CodeExistsAsync("S001").Returns(false);

        await _handler.HandleAsync(new CreateSchoolCommand("S001", "Trường ABC"));

        await _repository.Received(1).CreateAsync(Arg.Is<School>(s => s.Status == "ACTIVE"));
    }

    // ── Duplicate validation ──────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_DuplicateCode_ThrowsInvalidOperationException()
    {
        _repository.CodeExistsAsync("SCH001").Returns(true);

        var act = () => _handler.HandleAsync(new CreateSchoolCommand("SCH001", "Trường X"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*SCH001*already exists*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    // ── Required field validation ─────────────────────────────────────────────

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public async Task HandleAsync_EmptyCode_ThrowsInvalidOperationException(string code)
    {
        var act = () => _handler.HandleAsync(new CreateSchoolCommand(code, "Trường ABC"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*code*required*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public async Task HandleAsync_EmptyName_ThrowsInvalidOperationException(string name)
    {
        var act = () => _handler.HandleAsync(new CreateSchoolCommand("SCH001", name));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*name*required*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    // ── Length validation ─────────────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_CodeExceeds50Chars_ThrowsInvalidOperationException()
    {
        var longCode = new string('A', 51);

        var act = () => _handler.HandleAsync(new CreateSchoolCommand(longCode, "Trường ABC"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*50*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    [Fact]
    public async Task HandleAsync_NameExceeds255Chars_ThrowsInvalidOperationException()
    {
        var longName = new string('a', 256);

        var act = () => _handler.HandleAsync(new CreateSchoolCommand("SCH001", longName));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*255*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    // ── Contract date validation ──────────────────────────────────────────────

    [Fact]
    public async Task HandleAsync_EndDateBeforeStartDate_ThrowsInvalidOperationException()
    {
        _repository.CodeExistsAsync(Arg.Any<string>()).Returns(false);

        var act = () => _handler.HandleAsync(new CreateSchoolCommand(
            Code: "SCH001",
            Name: "Trường X",
            ContractStartDate: new DateOnly(2025, 6, 1),
            ContractEndDate: new DateOnly(2025, 1, 1)));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*contract end*before*start*");
        await _repository.DidNotReceive().CreateAsync(Arg.Any<School>());
    }

    [Fact]
    public async Task HandleAsync_StartDateWithoutEndDate_IsAllowed()
    {
        _repository.CodeExistsAsync("SCH001").Returns(false);

        var act = () => _handler.HandleAsync(new CreateSchoolCommand(
            Code: "SCH001",
            Name: "Trường X",
            ContractStartDate: new DateOnly(2025, 1, 1)));

        await act.Should().NotThrowAsync();
    }
}
