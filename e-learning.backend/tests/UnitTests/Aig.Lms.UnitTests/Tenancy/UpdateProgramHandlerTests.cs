using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;
using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Domain.Services;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Tenancy;

public class UpdateTenantHandlerTests
{
    private readonly ITenantRepository _repository = Substitute.For<ITenantRepository>();
    private readonly SubdomainPolicy _subdomainPolicy = new SubdomainPolicy();
    private readonly UpdateTenantHandler _handler;

    public UpdateTenantHandlerTests()
    {
        _handler = new UpdateTenantHandler(_repository, _subdomainPolicy);
    }

    private static Tenant BuildTenant() =>
        Tenant.Create("Old Name", "STEM", "stem", null, null, null, null);

    private static UpdateTenantCommand MakeCommand(Guid id, string name = "New Name") =>
        new UpdateTenantCommand(id, name, "STEM", "stem", null, null, null, null);

    [Fact]
    public async Task HandleAsync_ValidCommand_UpdatesNameAndReturnsResult()
    {
        var tenant = BuildTenant();
        _repository.GetByIdAsync(tenant.Id).Returns(tenant);
        _repository.ExistsByCodeAsync(Arg.Any<string>(), Arg.Any<Guid?>()).Returns(false);
        _repository.ExistsBySubdomainAsync(Arg.Any<string>(), Arg.Any<Guid?>()).Returns(false);

        var result = await _handler.HandleAsync(MakeCommand(tenant.Id, "New Name"));

        result.TenantId.Should().Be(tenant.Id);
        result.Name.Should().Be("New Name");
        await _repository.Received(1).UpdateAsync(tenant);
    }

    [Fact]
    public async Task HandleAsync_TenantNotFound_ThrowsInvalidOperationException()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id).Returns((Tenant?)null);
        _repository.ExistsByCodeAsync(Arg.Any<string>(), Arg.Any<Guid?>()).Returns(false);
        _repository.ExistsBySubdomainAsync(Arg.Any<string>(), Arg.Any<Guid?>()).Returns(false);

        var act = () => _handler.HandleAsync(MakeCommand(id, "New Name"));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{id}*not found*");
        await _repository.DidNotReceive().UpdateAsync(Arg.Any<Tenant>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public async Task HandleAsync_EmptyName_ThrowsInvalidOperationException(string name)
    {
        var act = () => _handler.HandleAsync(MakeCommand(Guid.NewGuid(), name));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
