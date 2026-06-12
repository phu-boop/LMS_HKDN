using Aig.Lms.BuildingBlocks.Domain.Exceptions;
using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.ValueObjects;
using FluentAssertions;

namespace Aig.Lms.UnitTests.Tenancy;

public class TenantTests
{
    // ── Tenant.Create ────────────────────────────────────────────────────────

    private static Tenant MakeTenant(string name = "STEM Program", string code = "STEM", string subdomain = "stem") =>
        Tenant.Create(name, code, subdomain, null, null, null, null);

    [Fact]
    public void Create_ValidInputs_ReturnsTenantWithActiveStatus()
    {
        var tenant = MakeTenant();

        tenant.Name.Should().Be("STEM Program");
        tenant.Code.Value.Should().Be("STEM");
        tenant.Subdomain.Value.Should().Be("stem");
        tenant.Status.Should().Be(TenantStatus.Active);
        tenant.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void Create_TrimsName()
    {
        var tenant = Tenant.Create("  STEM Program  ", "STEM", "stem", null, null, null, null);
        tenant.Name.Should().Be("STEM Program");
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Create_EmptyCode_ThrowsDomainException(string code)
    {
        var act = () => Tenant.Create("STEM", code, "stem", null, null, null, null);
        act.Should().Throw<DomainException>().WithMessage("*code*");
    }

    [Fact]
    public void Create_InvalidCodeFormat_ThrowsDomainException()
    {
        var act = () => Tenant.Create("STEM", "st em!", "stem", null, null, null, null);
        act.Should().Throw<DomainException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void Create_EmptySubdomain_ThrowsDomainException(string subdomain)
    {
        var act = () => Tenant.Create("STEM", "STEM", subdomain, null, null, null, null);
        act.Should().Throw<DomainException>().WithMessage("*ubdomain*");
    }

    [Theory]
    [InlineData("ab")]          // too short
    [InlineData("-stem")]       // leading hyphen
    [InlineData("stem-")]       // trailing hyphen
    public void Create_InvalidSubdomainFormat_ThrowsDomainException(string subdomain)
    {
        var act = () => Tenant.Create("STEM", "STEM", subdomain, null, null, null, null);
        act.Should().Throw<DomainException>();
    }

    // ── Tenant.UpdateDetails ─────────────────────────────────────────────────

    [Fact]
    public void UpdateDetails_ValidName_UpdatesNameAndTimestamp()
    {
        var tenant = MakeTenant("Old Name");
        var before = tenant.UpdatedAt;

        tenant.UpdateDetails("New Name", "STEM", "stem", null, null, null, null);

        tenant.Name.Should().Be("New Name");
        tenant.UpdatedAt.Should().BeOnOrAfter(before);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void UpdateDetails_EmptyName_ThrowsDomainException(string name)
    {
        var tenant = MakeTenant();
        var act = () => tenant.UpdateDetails(name, "STEM", "stem", null, null, null, null);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void UpdateDetails_NameExceeds255Chars_ThrowsDomainException()
    {
        var tenant = MakeTenant();
        var longName = new string('a', 256);
        var act = () => tenant.UpdateDetails(longName, "STEM", "stem", null, null, null, null);
        act.Should().Throw<DomainException>();
    }

    // ── Tenant.SetStatus ─────────────────────────────────────────────────────

    [Fact]
    public void SetStatus_Active_SetsStatusToActive()
    {
        var tenant = MakeTenant();
        tenant.SetStatus(TenantStatus.Inactive);

        tenant.SetStatus(TenantStatus.Active);

        tenant.Status.Should().Be(TenantStatus.Active);
    }

    [Fact]
    public void SetStatus_Inactive_SetsStatusToInactive()
    {
        var tenant = MakeTenant();

        tenant.SetStatus(TenantStatus.Inactive);

        tenant.Status.Should().Be(TenantStatus.Inactive);
    }
}

public class TenantCodeTests
{
    [Theory]
    [InlineData("STEM", "STEM")]
    [InlineData("kns", "KNS")]
    [InlineData("KNS_2025", "KNS_2025")]
    public void Create_ValidCode_NormalizesToUppercase(string input, string expected)
    {
        var code = TenantCode.Create(input);
        code.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]           // too short (< 3)
    [InlineData("st em")]        // space
    [InlineData("stem-2025")]    // hyphen not allowed
    public void Create_InvalidCode_ThrowsDomainException(string input)
    {
        var act = () => TenantCode.Create(input);
        act.Should().Throw<DomainException>();
    }
}

public class SubdomainValueObjectTests
{
    [Theory]
    [InlineData("stem", "stem")]
    [InlineData("KNS", "kns")]
    [InlineData("my-school", "my-school")]
    public void Create_ValidSubdomain_NormalizesToLowercase(string input, string expected)
    {
        var subdomain = Subdomain.Create(input);
        subdomain.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("ab")]           // too short
    [InlineData("-stem")]        // leading hyphen
    [InlineData("stem-")]        // trailing hyphen
    [InlineData("stem domain")]  // space
    public void Create_InvalidSubdomain_ThrowsDomainException(string input)
    {
        var act = () => Subdomain.Create(input);
        act.Should().Throw<DomainException>();
    }
}
