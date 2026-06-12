using System.Text.RegularExpressions;
using Aig.Lms.BuildingBlocks.Domain.Exceptions;
using Aig.Lms.BuildingBlocks.Domain.ValueObjects;

namespace Aig.Lms.Modules.Tenancy.Domain.ValueObjects;

public sealed class Subdomain : ValueObject
{
    // DNS-safe: lowercase alphanumeric + hyphens, no leading/trailing hyphens, 3-50 chars
    private static readonly Regex Pattern = new(@"^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$", RegexOptions.Compiled);

    public string Value { get; }

    private Subdomain(string value) => Value = value;

    public static Subdomain Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Subdomain cannot be empty.");

        var normalized = value.Trim().ToLowerInvariant();

        if (normalized.Length < 3 || normalized.Length > 50)
            throw new DomainException("Subdomain must be between 3 and 50 characters.");

        if (!Pattern.IsMatch(normalized))
            throw new DomainException(
                "Subdomain must contain only lowercase letters, digits, or hyphens, " +
                "and cannot start or end with a hyphen (e.g. stem, kns-2025).");

        return new Subdomain(normalized);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
