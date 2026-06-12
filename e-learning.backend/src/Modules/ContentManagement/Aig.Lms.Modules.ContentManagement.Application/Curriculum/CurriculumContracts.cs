namespace Aig.Lms.Modules.ContentManagement.Application.Curriculum;

public sealed record CurriculumNodeDto(
    Guid Id,
    Guid TenantId,
    Guid? ParentId,
    string NodeType,
    string? Code,
    string Title,
    int SortOrder,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed class CurriculumTreeNode
{
    public Guid Id { get; init; }
    public Guid TenantId { get; init; }
    public Guid? ParentId { get; init; }
    public string NodeType { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string Title { get; init; } = string.Empty;
    public int SortOrder { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public List<CurriculumTreeNode> Children { get; } = [];
}

public sealed record CurriculumSiblingDto(Guid Id, Guid? ParentId, int SortOrder);
public sealed record CurriculumReorderItem(Guid Id, int SortOrder);

public sealed record CreateCurriculumNodeCommand(
    Guid TenantId,
    Guid? ParentId,
    string NodeType,
    string? Code,
    string Title,
    int SortOrder = 0,
    Guid? CreatedBy = null);

public sealed record UpdateCurriculumNodeCommand(
    Guid TenantId,
    Guid NodeId,
    string? Code,
    string Title,
    int SortOrder,
    string Status,
    Guid? UpdatedBy = null);

public sealed record DeleteCurriculumNodeCommand(Guid TenantId, Guid NodeId, Guid? DeletedBy = null);

public sealed record ReorderCurriculumCommand(
    Guid TenantId,
    Guid? ParentId,
    IReadOnlyList<Guid> OrderedNodeIds,
    Guid? UpdatedBy = null);

public sealed record CreateCurriculumNodeResult(Guid NodeId);
