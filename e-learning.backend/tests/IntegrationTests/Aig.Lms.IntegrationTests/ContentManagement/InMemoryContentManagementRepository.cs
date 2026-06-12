using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Aig.Lms.IntegrationTests;

namespace Aig.Lms.IntegrationTests.ContentManagement;

internal sealed class InMemoryContentManagementRepository : IContentManagementRepository
{
    private static readonly Guid WatermarkedContentId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid WatermarkedNodeId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    private readonly object _sync = new();
    private readonly Dictionary<Guid, Aig.Lms.Modules.ContentManagement.Domain.CurriculumNode> _nodes = new();
    private readonly Dictionary<Guid, ContentItemDto> _contents = new();

    public InMemoryContentManagementRepository()
    {
        _nodes[WatermarkedNodeId] = new Aig.Lms.Modules.ContentManagement.Domain.CurriculumNode
        {
            Id = WatermarkedNodeId,
            TenantId = TenantTestData.StemTenant.Id,
            ParentId = null,
            NodeType = "LESSON",
            Code = "LSN-001",
            Title = "Dynamic Watermark Demo",
            SortOrder = 1,
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _contents[WatermarkedContentId] = new ContentItemDto(
            WatermarkedContentId,
            TenantTestData.StemTenant.Id,
            WatermarkedNodeId,
            "PDF",
            "Watermarked Document",
            "Demo.pdf",
            "/files/demo.pdf",
            null,
            null,
            "application/pdf",
            1024,
            "PUBLISHED",
            null,
            null,
            true,
            true,
            3600,
            "NOT_REQUIRED",
            null,
            null,
            null,
                null,
            DateTime.UtcNow,
            DateTime.UtcNow);
    }

    public Task<IReadOnlyList<CurriculumNodeDto>> ListFlatByTenantAsync(Guid tenantId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var rows = _nodes.Values
                .Where(n => n.TenantId == tenantId)
                .OrderBy(n => n.ParentId.HasValue ? 1 : 0)
                .ThenBy(n => n.ParentId)
                .ThenBy(n => n.SortOrder)
                .ThenBy(n => n.Title)
                .Select(ToDto)
                .ToList();

            return Task.FromResult<IReadOnlyList<CurriculumNodeDto>>(rows);
        }
    }

    public Task<IReadOnlyList<CurriculumNodeDto>> ListChildrenAsync(Guid tenantId, Guid parentId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var rows = _nodes.Values
                .Where(n => n.TenantId == tenantId && n.ParentId == parentId)
                .OrderBy(n => n.SortOrder)
                .ThenBy(n => n.Title)
                .Select(ToDto)
                .ToList();

            return Task.FromResult<IReadOnlyList<CurriculumNodeDto>>(rows);
        }
    }

    public Task<CurriculumNodeDto?> GetNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            if (_nodes.TryGetValue(nodeId, out var node) && node.TenantId == tenantId)
                return Task.FromResult<CurriculumNodeDto?>(ToDto(node));

            return Task.FromResult<CurriculumNodeDto?>(null);
        }
    }

    public Task<bool> TitleExistsAsync(Guid tenantId, Guid? parentId, string title, Guid? excludeNodeId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var exists = _nodes.Values.Any(n =>
                n.TenantId == tenantId &&
                n.ParentId == parentId &&
                string.Equals(n.Title, title, StringComparison.OrdinalIgnoreCase) &&
                (!excludeNodeId.HasValue || n.Id != excludeNodeId.Value));

            return Task.FromResult(exists);
        }
    }

    public Task CreateNodeAsync(Aig.Lms.Modules.ContentManagement.Domain.CurriculumNode node, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var now = DateTime.UtcNow;
            node.CreatedAt = now;
            node.UpdatedAt = now;
            _nodes[node.Id] = node;
        }

        return Task.CompletedTask;
    }

    public Task<CurriculumNodeDto?> UpdateNodeAsync(UpdateCurriculumNodeCommand command, CancellationToken ct = default)
    {
        lock (_sync)
        {
            if (!_nodes.TryGetValue(command.NodeId, out var node) || node.TenantId != command.TenantId)
                return Task.FromResult<CurriculumNodeDto?>(null);

            node.Code = command.Code;
            node.Title = command.Title;
            node.SortOrder = command.SortOrder;
            node.Status = command.Status;
            node.UpdatedAt = DateTime.UtcNow;

            return Task.FromResult<CurriculumNodeDto?>(ToDto(node));
        }
    }

    public Task<bool> HasChildrenAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var hasChildren = _nodes.Values.Any(n => n.TenantId == tenantId && n.ParentId == nodeId);
            return Task.FromResult(hasChildren);
        }
    }

    public Task<bool> HasContentsAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        return Task.FromResult(false);
    }

    public Task<bool> DeleteNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            if (!_nodes.TryGetValue(nodeId, out var node) || node.TenantId != tenantId)
                return Task.FromResult(false);

            _nodes.Remove(nodeId);
            return Task.FromResult(true);
        }
    }

    public Task<IReadOnlyList<CurriculumSiblingDto>> ListSiblingsAsync(Guid tenantId, Guid? parentId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            var siblings = _nodes.Values
                .Where(n => n.TenantId == tenantId && n.ParentId == parentId)
                .OrderBy(n => n.SortOrder)
                .ThenBy(n => n.Title)
                .Select(n => new CurriculumSiblingDto(n.Id, n.ParentId, n.SortOrder))
                .ToList();

            return Task.FromResult<IReadOnlyList<CurriculumSiblingDto>>(siblings);
        }
    }

    public Task ReorderSiblingsAsync(Guid tenantId, Guid? parentId, IReadOnlyList<CurriculumReorderItem> items, CancellationToken ct = default)
    {
        lock (_sync)
        {
            foreach (var item in items)
            {
                if (_nodes.TryGetValue(item.Id, out var node) && node.TenantId == tenantId && node.ParentId == parentId)
                {
                    node.SortOrder = item.SortOrder;
                    node.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        return Task.CompletedTask;
    }

    // ── Content items (stub implementations) ────────────────────────────────

    public Task<PagedResult<ContentListItem>> ListContentsAsync(ListContentsQuery query, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ContentItemDto?> GetContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
    {
        lock (_sync)
        {
            return Task.FromResult(_contents.TryGetValue(contentId, out var content) && content.TenantId == tenantId
                ? content
                : null);
        }
    }

    public Task CreateContentAsync(Aig.Lms.Modules.ContentManagement.Domain.ContentItem item, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ContentItemDto?> UpdateContentAsync(UpdateContentCommand command, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<UpdateContentStatusResult?> UpdateContentStatusAsync(UpdateContentStatusCommand command, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ConfirmUploadResult?> ConfirmUploadAsync(ConfirmUploadCommand command, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<bool> DeleteContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<bool> MarkMediaProcessingQueuedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<bool> MarkMediaProcessingStartedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<bool> MarkMediaProcessingReadyAsync(Guid tenantId, Guid contentId, string hlsMasterPath, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<bool> MarkMediaProcessingFailedAsync(Guid tenantId, Guid contentId, string error, CancellationToken ct = default)
        => Task.FromResult(false);

    public Task<bool> SchoolBelongsToTenantAsync(Guid tenantId, Guid schoolId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<bool> UserBelongsToTenantAsync(Guid tenantId, Guid userId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IReadOnlyList<ContentPermissionDto>> ListContentPermissionsAsync(ListContentPermissionsQuery query, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<GrantContentPermissionResult> UpsertContentPermissionAsync(GrantContentPermissionCommand command, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<bool> DeleteContentPermissionAsync(DeleteContentPermissionCommand command, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IReadOnlyList<NodePermissionViewDto>> ListPermissionsForNodeAsync(NodePermissionViewQuery query, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IReadOnlyList<NodePermissionsViewDto>> ListPermissionsForNodesAsync(NodePermissionsViewQuery query, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<IReadOnlyList<UserEffectiveNodePermissionDto>> ListEffectivePermissionsForUserAsync(UserEffectivePermissionsQuery query, CancellationToken ct = default)
    {
        lock (_sync)
        {
            if (query.TenantId != TenantTestData.StemTenant.Id)
                return Task.FromResult<IReadOnlyList<UserEffectiveNodePermissionDto>>([]);

            return Task.FromResult<IReadOnlyList<UserEffectiveNodePermissionDto>>(
                [new UserEffectiveNodePermissionDto(WatermarkedNodeId, CanView: true, CanDownload: false, CanComment: false)]);
        }
    }

    private static CurriculumNodeDto ToDto(Aig.Lms.Modules.ContentManagement.Domain.CurriculumNode node)
    {
        return new CurriculumNodeDto(
            node.Id,
            node.TenantId,
            node.ParentId,
            node.NodeType,
            node.Code,
            node.Title,
            node.SortOrder,
            node.Status,
            node.CreatedAt,
            node.UpdatedAt);
    }
}
