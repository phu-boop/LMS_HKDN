namespace Aig.Lms.Modules.Catalog.Domain.Entities;

public sealed class CatalogItem
{
    public Guid Id { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsSystem { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CatalogItem() { }

    public static CatalogItem Create(
        string type,
        string code,
        string name,
        string? description = null,
        int sortOrder = 0) =>
        new()
        {
            Id = Guid.NewGuid(),
            Type = type.Trim().ToUpperInvariant(),
            Code = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            SortOrder = sortOrder,
            IsSystem = false,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

    public static CatalogItem Reconstitute(
        Guid id,
        string type,
        string code,
        string name,
        string? description,
        int sortOrder,
        bool isSystem,
        bool isActive,
        bool isDeleted,
        DateTime createdAt,
        DateTime updatedAt) =>
        new()
        {
            Id = id,
            Type = type,
            Code = code,
            Name = name,
            Description = description,
            SortOrder = sortOrder,
            IsSystem = isSystem,
            IsActive = isActive,
            IsDeleted = isDeleted,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };

    public void Update(string name, string? description, int sortOrder)
    {
        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        if (IsSystem)
            throw new InvalidOperationException(
                $"Catalog item '{Code}' is a system item and cannot be deleted.");

        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
