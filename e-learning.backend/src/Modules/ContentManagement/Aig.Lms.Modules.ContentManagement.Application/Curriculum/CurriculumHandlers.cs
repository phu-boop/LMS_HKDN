using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.ContentManagement.Application.Curriculum;

public sealed class GetCurriculumTreeQueryHandler
{
    private readonly IContentManagementRepository _repository;

    public GetCurriculumTreeQueryHandler(IContentManagementRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<CurriculumTreeNode>> HandleAsync(Guid tenantId, CancellationToken ct = default)
    {
        var flatNodes = await _repository.ListFlatByTenantAsync(tenantId, ct);
        var mapped = flatNodes.ToDictionary(
            n => n.Id,
            n => new CurriculumTreeNode
            {
                Id = n.Id,
                TenantId = n.TenantId,
                ParentId = n.ParentId,
                NodeType = n.NodeType,
                Code = n.Code,
                Title = n.Title,
                SortOrder = n.SortOrder,
                Status = n.Status,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            });

        var roots = new List<CurriculumTreeNode>();
        foreach (var node in mapped.Values.OrderBy(x => x.SortOrder).ThenBy(x => x.Title))
        {
            if (!node.ParentId.HasValue)
            {
                roots.Add(node);
                continue;
            }

            if (mapped.TryGetValue(node.ParentId.Value, out var parent))
                parent.Children.Add(node);
        }

        return roots;
    }
}

public sealed class GetCurriculumChildrenQueryHandler
{
    private readonly IContentManagementRepository _repository;

    public GetCurriculumChildrenQueryHandler(IContentManagementRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<CurriculumNodeDto>> HandleAsync(Guid tenantId, Guid parentId, CancellationToken ct = default)
    {
        return _repository.ListChildrenAsync(tenantId, parentId, ct);
    }
}

public sealed class CreateCurriculumNodeCommandHandler
{
    private readonly IContentManagementRepository _repository;
    private readonly IAuditLogService _auditLog;

    public CreateCurriculumNodeCommandHandler(
        IContentManagementRepository repository,
        IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog = auditLog;
    }

    public async Task<CreateCurriculumNodeResult> HandleAsync(CreateCurriculumNodeCommand command, CancellationToken ct = default)
    {
        if (command.TenantId == Guid.Empty)
            throw new InvalidOperationException("TenantId is required.");

        var normalizedTitle = command.Title?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedTitle))
            throw new InvalidOperationException("Title is required.");
        if (normalizedTitle.Length > 255)
            throw new InvalidOperationException("Title must not exceed 255 characters.");

        var normalizedNodeType = NormalizeNodeType(command.NodeType);
        var normalizedCode = string.IsNullOrWhiteSpace(command.Code) ? null : command.Code.Trim().ToUpperInvariant();
        if (normalizedCode?.Length > 50)
            throw new InvalidOperationException("Code must not exceed 50 characters.");

        if (command.ParentId.HasValue)
        {
            var parent = await _repository.GetNodeAsync(command.TenantId, command.ParentId.Value, ct);
            if (parent is null)
                throw new InvalidOperationException("Parent node not found in this tenant.");
        }

        if (await _repository.TitleExistsAsync(command.TenantId, command.ParentId, normalizedTitle, null, ct))
            throw new InvalidOperationException("A node with the same title already exists under this parent.");

        var node = new Domain.CurriculumNode
        {
            Id = Guid.NewGuid(),
            TenantId = command.TenantId,
            ParentId = command.ParentId,
            NodeType = normalizedNodeType,
            Code = normalizedCode,
            Title = normalizedTitle,
            SortOrder = command.SortOrder,
            Status = "ACTIVE"
        };

        await _repository.CreateNodeAsync(node, ct);

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CURRICULUM_NODE_CREATED",
            EntityType:  "CurriculumNode",
            EntityId:    node.Id,
            TenantId:    command.TenantId,
            ActorUserId: command.CreatedBy),
            ct);

        return new CreateCurriculumNodeResult(node.Id);
    }

    private static string NormalizeNodeType(string nodeType)
    {
        var normalized = (nodeType ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new InvalidOperationException("node_type is required.");
        if (normalized.Length > 100)
            throw new InvalidOperationException("node_type must not exceed 100 characters.");

        return normalized;
    }
}

public sealed class UpdateCurriculumNodeCommandHandler
{
    private readonly IContentManagementRepository _repository;
    private readonly IAuditLogService _auditLog;

    public UpdateCurriculumNodeCommandHandler(
        IContentManagementRepository repository,
        IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog = auditLog;
    }

    public async Task<CurriculumNodeDto?> HandleAsync(UpdateCurriculumNodeCommand command, CancellationToken ct = default)
    {
        if (command.TenantId == Guid.Empty)
            throw new InvalidOperationException("TenantId is required.");

        var existing = await _repository.GetNodeAsync(command.TenantId, command.NodeId, ct);
        if (existing is null)
            return null;

        var normalizedTitle = command.Title.Trim();
        if (string.IsNullOrWhiteSpace(normalizedTitle))
            throw new InvalidOperationException("Title is required.");
        if (normalizedTitle.Length > 255)
            throw new InvalidOperationException("Title must not exceed 255 characters.");

        var normalizedCode = string.IsNullOrWhiteSpace(command.Code) ? null : command.Code.Trim().ToUpperInvariant();
        if (normalizedCode?.Length > 50)
            throw new InvalidOperationException("Code must not exceed 50 characters.");

        var normalizedStatus = NormalizeStatus(command.Status);

        if (await _repository.TitleExistsAsync(command.TenantId, existing.ParentId, normalizedTitle, command.NodeId, ct))
            throw new InvalidOperationException("A node with the same title already exists under this parent.");

        var updated = await _repository.UpdateNodeAsync(
            command with { Code = normalizedCode, Title = normalizedTitle, Status = normalizedStatus },
            ct);

        if (updated is not null)
        {
            await _auditLog.LogAsync(new AuditLogEntry(
                Action:      "CURRICULUM_NODE_UPDATED",
                EntityType:  "CurriculumNode",
                EntityId:    command.NodeId,
                TenantId:    command.TenantId,
                ActorUserId: command.UpdatedBy),
                ct);
        }

        return updated;
    }

    private static string NormalizeStatus(string status)
    {
        var normalized = (status ?? string.Empty).Trim().ToUpperInvariant();
        return normalized switch
        {
            "ACTIVE" => "ACTIVE",
            "INACTIVE" => "INACTIVE",
            "LOCKED" => "LOCKED",
            _ => throw new InvalidOperationException("Status must be ACTIVE, INACTIVE, or LOCKED.")
        };
    }
}

public sealed class DeleteCurriculumNodeCommandHandler
{
    private readonly IContentManagementRepository _repository;
    private readonly IAuditLogService _auditLog;

    public DeleteCurriculumNodeCommandHandler(
        IContentManagementRepository repository,
        IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog = auditLog;
    }

    public async Task<bool> HandleAsync(DeleteCurriculumNodeCommand command, CancellationToken ct = default)
    {
        var node = await _repository.GetNodeAsync(command.TenantId, command.NodeId, ct);
        if (node is null)
            return false;

        if (await _repository.HasChildrenAsync(command.TenantId, command.NodeId, ct))
            throw new InvalidOperationException("Cannot delete a node that still has child nodes.");

        if (await _repository.HasContentsAsync(command.TenantId, command.NodeId, ct))
            throw new InvalidOperationException("Cannot delete a node that still has content items attached.");

        var deleted = await _repository.DeleteNodeAsync(command.TenantId, command.NodeId, ct);
        if (deleted)
        {
            await _auditLog.LogAsync(new AuditLogEntry(
                Action:      "CURRICULUM_NODE_DELETED",
                EntityType:  "CurriculumNode",
                EntityId:    command.NodeId,
                TenantId:    command.TenantId,
                ActorUserId: command.DeletedBy),
                ct);
        }

        return deleted;
    }
}

public sealed class ReorderCurriculumCommandHandler
{
    private readonly IContentManagementRepository _repository;
    private readonly IAuditLogService _auditLog;

    public ReorderCurriculumCommandHandler(
        IContentManagementRepository repository,
        IAuditLogService auditLog
    )
    {
        _repository = repository;
        _auditLog = auditLog;
    }

    public async Task HandleAsync(ReorderCurriculumCommand command, CancellationToken ct = default)
    {
        if (command.OrderedNodeIds is null || command.OrderedNodeIds.Count == 0)
            throw new InvalidOperationException("OrderedNodeIds is required.");

        var distinctCount = command.OrderedNodeIds.Distinct().Count();
        if (distinctCount != command.OrderedNodeIds.Count)
            throw new InvalidOperationException("OrderedNodeIds must not contain duplicates.");

        var siblings = await _repository.ListSiblingsAsync(command.TenantId, command.ParentId, ct);
        if (siblings.Count == 0)
            throw new InvalidOperationException("No siblings found for the provided parent.");

        if (siblings.Count != command.OrderedNodeIds.Count)
            throw new InvalidOperationException("OrderedNodeIds must contain all and only sibling nodes.");

        var siblingIds = siblings.Select(x => x.Id).ToHashSet();
        if (command.OrderedNodeIds.Any(id => !siblingIds.Contains(id)))
            throw new InvalidOperationException("OrderedNodeIds contains node IDs that are not siblings of the provided parent.");

        var reorderItems = command.OrderedNodeIds
            .Select((id, index) => new CurriculumReorderItem(id, index + 1))
            .ToArray();

        await _repository.ReorderSiblingsAsync(command.TenantId, command.ParentId, reorderItems, ct);

        await _auditLog.LogAsync(new AuditLogEntry(
            Action:      "CURRICULUM_REORDERED",
            EntityType:  "CurriculumNode",
            EntityId:    command.ParentId,
            TenantId:    command.TenantId,
            ActorUserId: command.UpdatedBy,
            Metadata:    $"{{\"orderedCount\":{command.OrderedNodeIds.Count}}}"),
            ct);
    }
}
