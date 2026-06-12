using Aig.Lms.BuildingBlocks.Domain.Entities;
using Aig.Lms.BuildingBlocks.Domain.Exceptions;
using Aig.Lms.Modules.Tenancy.Domain.ValueObjects;

namespace Aig.Lms.Modules.Tenancy.Domain.Entities;

public sealed class Tenant : AggregateRoot<Guid>
{
    public TenantCode Code { get; private set; } = default!;
    public string Name { get; private set; } = string.Empty;
    public Subdomain Subdomain { get; private set; } = default!;
    public string? LogoUrl { get; private set; }
    public string? AvatarUrl { get; private set; }
    public string? Description { get; private set; }
    public string? WatermarkSettings { get; private set; }
    public string Status { get; private set; } = TenantStatus.Active;
    public DateTime CreatedAt { get; private init; }
    public DateTime UpdatedAt { get; private set; }

    private Tenant() { }

    private Tenant(
        Guid id,
        string name,
        TenantCode code,
        Subdomain subdomain,
        string? logoUrl,
        string? avatarUrl,
        string? description,
        string? watermarkSettings,
        string status,
        DateTime createdAt,
        DateTime updatedAt)
    {
        Id = id;
        Name = NormalizeName(name);
        Code = code;
        Subdomain = subdomain;
        LogoUrl = NormalizeOptional(logoUrl);
        AvatarUrl = NormalizeOptional(avatarUrl);
        Description = NormalizeOptional(description);
        WatermarkSettings = NormalizeOptional(watermarkSettings);
        Status = NormalizeStatus(status);
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public static Tenant Create(
        string name,
        string code,
        string subdomain,
        string? logoUrl,
        string? avatarUrl,
        string? description,
        string? watermarkSettings) =>
        new(
            Guid.NewGuid(),
            name,
            TenantCode.Create(code),
            ValueObjects.Subdomain.Create(subdomain),
            logoUrl,
            avatarUrl,
            description,
            watermarkSettings,
            TenantStatus.Active,
            DateTime.UtcNow,
            DateTime.UtcNow);

    public static Tenant Reconstitute(
        Guid id,
        string name,
        string code,
        string subdomain,
        string? logoUrl,
        string? avatarUrl,
        string? description,
        string? watermarkSettings,
        string status,
        DateTime createdAt,
        DateTime updatedAt) =>
        new(
            id,
            name,
            TenantCode.Create(code),
            ValueObjects.Subdomain.Create(subdomain),
            logoUrl,
            avatarUrl,
            description,
            watermarkSettings,
            status,
            createdAt,
            updatedAt);

    public void UpdateDetails(
        string name,
        string code,
        string subdomain,
        string? logoUrl,
        string? avatarUrl,
        string? description,
        string? watermarkSettings)
    {
        Name = NormalizeName(name);
        Code = TenantCode.Create(code);
        Subdomain = ValueObjects.Subdomain.Create(subdomain);
        LogoUrl = NormalizeOptional(logoUrl);
        AvatarUrl = NormalizeOptional(avatarUrl);
        Description = NormalizeOptional(description);
        WatermarkSettings = NormalizeOptional(watermarkSettings);
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetStatus(string status)
    {
        Status = NormalizeStatus(status);
        UpdatedAt = DateTime.UtcNow;
    }

    private static string NormalizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Tenant name cannot be empty.");

        var normalized = name.Trim();
        if (normalized.Length > 255)
            throw new DomainException("Tenant name must not exceed 255 characters.");

        return normalized;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string NormalizeStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new DomainException("Tenant status is required.");

        var normalized = status.Trim().ToUpperInvariant();
        if (!TenantStatus.Allowed.Contains(normalized))
            throw new DomainException($"Unsupported tenant status '{status}'.");

        return normalized;
    }
}

public static class TenantStatus
{
    public const string Active = "ACTIVE";
    public const string Inactive = "INACTIVE";
    public const string Locked = "LOCKED";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.Ordinal)
    {
        Active,
        Inactive,
        Locked,
    };
}
