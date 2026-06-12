using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;

namespace Aig.Lms.Modules.ContentManagement.Application.Curriculum;

public interface IContentManagementRepository
{
    // ── Curriculum ────────────────────────────────────────────────────────────
    Task<IReadOnlyList<CurriculumNodeDto>> ListFlatByTenantAsync(Guid tenantId, CancellationToken ct = default);
    Task<IReadOnlyList<CurriculumNodeDto>> ListChildrenAsync(Guid tenantId, Guid parentId, CancellationToken ct = default);
    Task<CurriculumNodeDto?> GetNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default);
    Task<bool> TitleExistsAsync(Guid tenantId, Guid? parentId, string title, Guid? excludeNodeId, CancellationToken ct = default);
    Task CreateNodeAsync(Domain.CurriculumNode node, CancellationToken ct = default);
    Task<CurriculumNodeDto?> UpdateNodeAsync(UpdateCurriculumNodeCommand command, CancellationToken ct = default);
    Task<bool> HasChildrenAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default);
    Task<bool> HasContentsAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default);
    Task<bool> DeleteNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default);
    Task<IReadOnlyList<CurriculumSiblingDto>> ListSiblingsAsync(Guid tenantId, Guid? parentId, CancellationToken ct = default);
    Task ReorderSiblingsAsync(Guid tenantId, Guid? parentId, IReadOnlyList<CurriculumReorderItem> items, CancellationToken ct = default);

    // ── Content items ─────────────────────────────────────────────────────────
    Task<PagedResult<ContentListItem>> ListContentsAsync(ListContentsQuery query, CancellationToken ct = default);
    Task<int> CountContentsAsync(Guid tenantId, CancellationToken ct = default);
    Task<int> CountSchoolsUsingAsync(Guid tenantId, CancellationToken ct = default);
    Task<int> CountSoldDocumentsAsync(Guid tenantId, CancellationToken ct = default);
    Task<IReadOnlyList<TopSoldContentItemDto>> ListTopSoldContentsAsync(Guid tenantId, int take, CancellationToken ct = default);
    Task<ContentItemDto?> GetContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default);
    Task<IReadOnlyList<FavoriteContentItem>> ListFavoriteContentsAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<bool> AddFavoriteContentAsync(Guid userId, Guid contentId, CancellationToken ct = default);
    Task<bool> RemoveFavoriteContentAsync(Guid userId, Guid contentId, CancellationToken ct = default);
    Task<IReadOnlyList<ContentCommentDto>> ListContentCommentsAsync(Guid tenantId, Guid contentId, Guid? requestingUserSchoolId, CancellationToken ct = default);
    Task<PagedResult<ContentCommentDto>> ListTenantCommentsAsync(Guid tenantId, Guid? userId, Guid? schoolId, Guid? contentItemId, string? search, bool? isAdmin, bool? isPublic, bool? isPinned, string? sortOrder, int page = 1, int pageSize = 20, CancellationToken ct = default);
    Task<ContentCommentDto?> GetContentCommentAsync(Guid tenantId, Guid commentId, CancellationToken ct = default);
    Task<ContentCommentDetailDto?> GetContentCommentDetailsAsync(Guid tenantId, Guid commentId, CancellationToken ct = default);
    Task<Guid> CreateContentCommentAsync(CreateContentCommentCommand command, CancellationToken ct = default);
    Task<bool> UpdateContentCommentAsync(UpdateContentCommentCommand command, CancellationToken ct = default);
    Task<bool> SetContentCommentPinnedAsync(Guid tenantId, Guid commentId, bool isPinned, Guid updatedBy, CancellationToken ct = default);
    Task<bool> SetContentCommentVisibilityAsync(Guid tenantId, Guid commentId, bool isPublic, Guid updatedBy, CancellationToken ct = default);
    Task<bool> DeleteContentCommentAsync(Guid tenantId, Guid commentId, Guid updatedBy, CancellationToken ct = default);
    Task<bool> DeleteContentCommentAsTenantAdminAsync(Guid tenantId, Guid commentId, Guid updatedBy, CancellationToken ct = default);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(GetDashboardSummaryQuery query, CancellationToken ct = default);
    Task<PagedResult<QuickAccessItem>> ListQuickAccessAsync(ListQuickAccessQuery query, CancellationToken ct = default);
    Task<ContentProgressDto?> GetUserContentProgressAsync(Guid tenantId, Guid userId, Guid contentId, CancellationToken ct = default);
    Task<ContentProgressDto> UpsertUserContentProgressAsync(UpsertContentProgressCommand command, CancellationToken ct = default);
    Task CreateContentAsync(Domain.ContentItem item, CancellationToken ct = default);
    Task<ContentItemDto?> UpdateContentAsync(UpdateContentCommand command, CancellationToken ct = default);
    Task<UpdateContentStatusResult?> UpdateContentStatusAsync(UpdateContentStatusCommand command, CancellationToken ct = default);
    Task<ConfirmUploadResult?> ConfirmUploadAsync(ConfirmUploadCommand command, CancellationToken ct = default);
    Task<bool> DeleteContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default);
    Task<bool> MarkMediaProcessingQueuedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default);
    Task<bool> MarkMediaProcessingStartedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default);
    Task<bool> MarkMediaProcessingReadyAsync(Guid tenantId, Guid contentId, string hlsMasterPath, CancellationToken ct = default);
    Task<bool> MarkMediaProcessingFailedAsync(Guid tenantId, Guid contentId, string error, CancellationToken ct = default);

    // ── Permission distribution ──────────────────────────────────────────────
    Task<bool> SchoolBelongsToTenantAsync(Guid tenantId, Guid schoolId, CancellationToken ct = default);
    Task<bool> UserBelongsToTenantAsync(Guid tenantId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<ContentPermissionDto>> ListContentPermissionsAsync(ListContentPermissionsQuery query, CancellationToken ct = default);
    Task<GrantContentPermissionResult> UpsertContentPermissionAsync(GrantContentPermissionCommand command, CancellationToken ct = default);
    Task<bool> DeleteContentPermissionAsync(DeleteContentPermissionCommand command, CancellationToken ct = default);
    Task<IReadOnlyList<NodePermissionViewDto>> ListPermissionsForNodeAsync(NodePermissionViewQuery query, CancellationToken ct = default);
    Task<IReadOnlyList<NodePermissionsViewDto>> ListPermissionsForNodesAsync(NodePermissionsViewQuery query, CancellationToken ct = default);
    Task<IReadOnlyList<UserEffectiveNodePermissionDto>> ListEffectivePermissionsForUserAsync(UserEffectivePermissionsQuery query, CancellationToken ct = default);
}
