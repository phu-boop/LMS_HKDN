using System.Text.RegularExpressions;
using Aig.Lms.BuildingBlocks.Domain.Exceptions;
using Aig.Lms.BuildingBlocks.Domain.ValueObjects;

namespace Aig.Lms.Modules.Tenancy.Domain.ValueObjects;

public sealed class TenantCode : ValueObject
{
    // Uppercase alphanumeric + underscore, 3-50 chars e.g. STEM, KNS, ENGLISH
    private static readonly Regex Pattern = new(@"^[A-Z0-9_]{3,50}$", RegexOptions.Compiled);

    public string Value { get; }

    private TenantCode(string value) => Value = value;

    public static TenantCode Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Tenant code cannot be empty.");

        var normalized = value.Trim().ToUpperInvariant();

        if (!Pattern.IsMatch(normalized))
            throw new DomainException(
                "Tenant code must be 3–50 uppercase alphanumeric characters or underscores (e.g. STEM, KNS_2025).");

        return new TenantCode(normalized);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
