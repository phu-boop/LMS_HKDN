using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.ChangeTenantStatus;
using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Tenancy;

public class ChangeTenantStatusHandlerTests
{
    private readonly ITenantRepository _repository = Substitute.For<ITenantRepository>();
    private readonly ChangeTenantStatusHandler _handler;

    public ChangeTenantStatusHandlerTests()
    {
        _handler = new ChangeTenantStatusHandler(_repository);
    }

    private static Tenant BuildTenant() =>
        Tenant.Create("STEM", "STEM", "stem", null, null, null, null);

    [Fact]
    public async Task HandleAsync_ExistingActiveTenant_SetsStatusToInactive()
    {
        var tenant = BuildTenant();
        _repository.GetByIdAsync(tenant.Id).Returns(tenant);

        await _handler.HandleAsync(new ChangeTenantStatusCommand(tenant.Id, "INACTIVE"));

        tenant.Status.Should().Be(TenantStatus.Inactive);
        await _repository.Received(1).UpdateAsync(tenant);
    }

    [Fact]
    public async Task HandleAsync_ExistingInactiveTenant_SetsStatusToActive()
    {
        var tenant = BuildTenant();
        tenant.SetStatus(TenantStatus.Inactive);
        _repository.GetByIdAsync(tenant.Id).Returns(tenant);

        await _handler.HandleAsync(new ChangeTenantStatusCommand(tenant.Id, "ACTIVE"));

        tenant.Status.Should().Be(TenantStatus.Active);
        await _repository.Received(1).UpdateAsync(tenant);
    }

    [Fact]
    public async Task HandleAsync_TenantNotFound_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id).Returns((Tenant?)null);

        var result = await _handler.HandleAsync(new ChangeTenantStatusCommand(id, "INACTIVE"));

        result.Should().BeFalse();
        await _repository.DidNotReceive().UpdateAsync(Arg.Any<Tenant>());
    }

    [Theory]
    [InlineData("UNKNOWN")]
    [InlineData("DELETED")]
    public async Task HandleAsync_InvalidStatus_ThrowsInvalidOperationException(string status)
    {
        var act = () => _handler.HandleAsync(new ChangeTenantStatusCommand(Guid.NewGuid(), status));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ACTIVE*INACTIVE*LOCKED*");
    }
}
