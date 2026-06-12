namespace Aig.Lms.Modules.ContentManagement.Domain;

public sealed class CurriculumNode
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid? ParentId { get; set; }
    public string NodeType { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string Title { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
