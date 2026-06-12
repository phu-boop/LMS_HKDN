namespace Aig.Lms.Modules.Catalog.Domain.Entities;

public sealed class Province
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Province() { }

    public static Province Create(string name) =>
        new()
        {
            Name = name.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

    public static Province Reconstitute(
        int id,
        string name,
        DateTime createdAt,
        DateTime updatedAt) =>
        new()
        {
            Id = id,
            Name = name,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
}
