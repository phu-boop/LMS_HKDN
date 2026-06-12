using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Domain;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Users;

public class GetSchoolUsersQueryHandlerTests
{
    private readonly IUsersRepository _repository = Substitute.For<IUsersRepository>();
    private readonly GetSchoolUsersQueryHandler _handler;

    public GetSchoolUsersQueryHandlerTests()
    {
        _handler = new GetSchoolUsersQueryHandler(_repository);
    }

    [Fact]
    public async Task HandleAsync_SchoolHasUsers_ReturnsPaginatedResult()
    {
        var schoolId = Guid.NewGuid();
        var users = new List<User>
        {
            new() { Id = Guid.NewGuid(), SchoolId = schoolId, Username = "teacher1", FullName = "Teacher One", AccountType = "TEACHER", Status = "ACTIVE" },
            new() { Id = Guid.NewGuid(), SchoolId = schoolId, Username = "teacher2", FullName = "Teacher Two", AccountType = "TEACHER", Status = "ACTIVE" }
        };
        _repository.GetSchoolUsersAsync(schoolId, 1, 20, null, null, null).Returns(users);
        _repository.CountSchoolUsersAsync(schoolId, null, null, null).Returns(2);

        var (items, total) = await _handler.HandleAsync(new GetSchoolUsersQuery(schoolId));

        items.Should().HaveCount(2);
        total.Should().Be(2);
        items.Should().AllSatisfy(u => u.SchoolId.Should().Be(schoolId));
    }

    [Fact]
    public async Task HandleAsync_EmptySchool_ReturnsEmptyResult()
    {
        var schoolId = Guid.NewGuid();
        _repository.GetSchoolUsersAsync(schoolId, Arg.Any<int>(), Arg.Any<int>(),
            Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>()).Returns(new List<User>());
        _repository.CountSchoolUsersAsync(schoolId,
            Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>()).Returns(0);

        var (items, total) = await _handler.HandleAsync(new GetSchoolUsersQuery(schoolId));

        items.Should().BeEmpty();
        total.Should().Be(0);
    }

    [Fact]
    public async Task HandleAsync_FilterByStatus_PassesFilterToRepository()
    {
        var schoolId = Guid.NewGuid();
        _repository.GetSchoolUsersAsync(schoolId, 1, 20, "LOCKED", null, null).Returns(new List<User>());
        _repository.CountSchoolUsersAsync(schoolId, "LOCKED", null, null).Returns(0);

        await _handler.HandleAsync(new GetSchoolUsersQuery(schoolId, Status: "LOCKED"));

        await _repository.Received(1).GetSchoolUsersAsync(schoolId, 1, 20, "LOCKED", null, null,
            Arg.Any<CancellationToken>());
        await _repository.Received(1).CountSchoolUsersAsync(schoolId, "LOCKED", null, null,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_FilterByAccountType_PassesFilterToRepository()
    {
        var schoolId = Guid.NewGuid();
        _repository.GetSchoolUsersAsync(schoolId, 1, 20, null, null, "TEACHER").Returns(new List<User>());
        _repository.CountSchoolUsersAsync(schoolId, null, null, "TEACHER").Returns(0);

        await _handler.HandleAsync(new GetSchoolUsersQuery(schoolId, AccountType: "TEACHER"));

        await _repository.Received(1).GetSchoolUsersAsync(schoolId, 1, 20, null, null, "TEACHER",
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HandleAsync_CustomPage_PassesPageToRepository()
    {
        var schoolId = Guid.NewGuid();
        _repository.GetSchoolUsersAsync(schoolId, 3, 10, null, null, null).Returns(new List<User>());
        _repository.CountSchoolUsersAsync(schoolId, null, null, null).Returns(25);

        var (_, total) = await _handler.HandleAsync(new GetSchoolUsersQuery(schoolId, Page: 3, PageSize: 10));

        total.Should().Be(25);
        await _repository.Received(1).GetSchoolUsersAsync(schoolId, 3, 10,
            Arg.Any<string?>(), Arg.Any<string?>(), Arg.Any<string?>(),
            Arg.Any<CancellationToken>());
    }
}
