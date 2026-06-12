namespace Aig.Lms.Modules.Catalog.Domain.Entities;

public sealed class Ward
{
    public int Id { get; private set; }
    public int ProvinceId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Ward() { }

    public static Ward Create(int provinceId, string name) =>
        new()
        {
            ProvinceId = provinceId,
            Name = name.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

    public static Ward Reconstitute(
        int id,
        int provinceId,
        string name,
        DateTime createdAt,
        DateTime updatedAt) =>
        new()
        {
            Id = id,
            ProvinceId = provinceId,
            Name = name,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
}
