using Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.CreateTenant;
using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Domain.Services;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Tenancy;

public class CreateTenantHandlerTests
{
    private readonly ITenantRepository _repository = Substitute.For<ITenantRepository>();
    private readonly SubdomainPolicy _subdomainPolicy = new SubdomainPolicy();
    private readonly CreateTenantHandler _handler;

    public CreateTenantHandlerTests()
    {
        _handler = new CreateTenantHandler(_repository, _subdomainPolicy);
    }

    [Fact]
    public async Task HandleAsync_ValidCommand_CreatesTenantAndReturnsResult()
    {
        _repository.ExistsByCodeAsync("STEM").Returns(false);
        _repository.ExistsBySubdomainAsync("stem").Returns(false);

        var result = await _handler.HandleAsync(
            new CreateTenantCommand("STEM Program", "STEM", "stem", null, null, null, null));

        result.TenantId.Should().NotBeEmpty();
        result.Code.Should().Be("STEM");
        result.Subdomain.Should().Be("stem");
        await _repository.Received(1).AddAsync(Arg.Any<Tenant>());
    }

    [Fact]
    public async Task HandleAsync_DuplicateCode_ThrowsInvalidOperationException()
    {
        _repository.ExistsByCodeAsync("STEM").Returns(true);
        _repository.ExistsBySubdomainAsync("stem").Returns(false);

        var act = () => _handler.HandleAsync(
            new CreateTenantCommand("STEM Program", "STEM", "stem", null, null, null, null));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*STEM*already exists*");
        await _repository.DidNotReceive().AddAsync(Arg.Any<Tenant>());
    }

    [Fact]
    public async Task HandleAsync_DuplicateSubdomain_ThrowsInvalidOperationException()
    {
        _repository.ExistsByCodeAsync("STEM").Returns(false);
        _repository.ExistsBySubdomainAsync("stem").Returns(true);

        var act = () => _handler.HandleAsync(
            new CreateTenantCommand("STEM Program", "STEM", "stem", null, null, null, null));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*stem*already exists*");
        await _repository.DidNotReceive().AddAsync(Arg.Any<Tenant>());
    }

    [Theory]
    [InlineData("", "STEM", "stem")]
    [InlineData("STEM Program", "", "stem")]
    [InlineData("STEM Program", "STEM", "")]
    public async Task HandleAsync_MissingRequiredField_ThrowsInvalidOperationException(
        string name, string code, string subdomain)
    {
        var act = () => _handler.HandleAsync(
            new CreateTenantCommand(name, code, subdomain, null, null, null, null));

        await act.Should().ThrowAsync<InvalidOperationException>();
        await _repository.DidNotReceive().AddAsync(Arg.Any<Tenant>());
    }

    [Fact]
    public async Task HandleAsync_NameExceeds255Characters_ThrowsInvalidOperationException()
    {
        var longName = new string('a', 256);

        var act = () => _handler.HandleAsync(
            new CreateTenantCommand(longName, "STEM", "stem", null, null, null, null));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
