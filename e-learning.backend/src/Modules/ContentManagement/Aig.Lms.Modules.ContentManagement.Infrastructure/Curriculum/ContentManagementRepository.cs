using Aig.Lms.Modules.ContentManagement.Application.Content;
using Aig.Lms.Modules.ContentManagement.Application.Curriculum;
using Aig.Lms.Modules.ContentManagement.Application.Permissions;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Linq;

namespace Aig.Lms.Modules.ContentManagement.Infrastructure.Curriculum;

public sealed class ContentManagementRepository : IContentManagementRepository
{
    private sealed record DashboardCounts(
        long ViewedThisWeekCount,
        long FavoriteCount,
        long FavoriteAddedThisWeekCount,
        DateTime? LastLearningAt);

    private readonly string _connectionString;

    public ContentManagementRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task<IReadOnlyList<CurriculumNodeDto>> ListFlatByTenantAsync(Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   tenant_id AS TenantId,
                   parent_id AS ParentId,
                   node_type::TEXT AS NodeType,
                   code,
                   title,
                   sort_order AS SortOrder,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND is_deleted = FALSE
            ORDER BY parent_id NULLS FIRST, sort_order ASC, title ASC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<CurriculumNodeDto>(new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<CurriculumNodeDto>> ListChildrenAsync(Guid tenantId, Guid parentId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   tenant_id AS TenantId,
                   parent_id AS ParentId,
                   node_type::TEXT AS NodeType,
                   code,
                   title,
                   sort_order AS SortOrder,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND parent_id = @ParentId
              AND is_deleted = FALSE
            ORDER BY sort_order ASC, title ASC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<CurriculumNodeDto>(
            new CommandDefinition(sql, new { TenantId = tenantId, ParentId = parentId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<CurriculumNodeDto?> GetNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   tenant_id AS TenantId,
                   parent_id AS ParentId,
                   node_type::TEXT AS NodeType,
                   code,
                   title,
                   sort_order AS SortOrder,
                   status::TEXT AS Status,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND id = @NodeId
              AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<CurriculumNodeDto>(
            new CommandDefinition(sql, new { TenantId = tenantId, NodeId = nodeId }, cancellationToken: ct));
    }

    public async Task<bool> TitleExistsAsync(Guid tenantId, Guid? parentId, string title, Guid? excludeNodeId, CancellationToken ct = default)
    {
        var sql = """
            SELECT COUNT(1)
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND parent_id IS NOT DISTINCT FROM @ParentId
              AND LOWER(title) = LOWER(@Title)
              AND is_deleted = FALSE
            """;

        if (excludeNodeId.HasValue)
            sql += " AND id != @ExcludeNodeId";

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new
            {
                TenantId = tenantId,
                ParentId = parentId,
                Title = title,
                ExcludeNodeId = excludeNodeId
            }, cancellationToken: ct));

        return count > 0;
    }

    public async Task CreateNodeAsync(Domain.CurriculumNode node, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO curriculum_node (
                id, tenant_id, parent_id, node_type, code, title, sort_order, status,
                is_deleted, created_at, updated_at)
            VALUES (
                @Id, @TenantId, @ParentId, @NodeType, @Code, @Title, @SortOrder, @Status::common_status,
                FALSE, NOW(), NOW())
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            node.Id,
            node.TenantId,
            node.ParentId,
            node.NodeType,
            node.Code,
            node.Title,
            node.SortOrder,
            node.Status
        }, cancellationToken: ct));
    }

    public async Task<CurriculumNodeDto?> UpdateNodeAsync(UpdateCurriculumNodeCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE curriculum_node
            SET code = @Code,
                title = @Title,
                sort_order = @SortOrder,
                status = @Status::common_status,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @NodeId
              AND is_deleted = FALSE
            RETURNING id,
                      tenant_id AS TenantId,
                      parent_id AS ParentId,
                      node_type::TEXT AS NodeType,
                      code,
                      title,
                      sort_order AS SortOrder,
                      status::TEXT AS Status,
                      created_at AS CreatedAt,
                      updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<CurriculumNodeDto>(
            new CommandDefinition(sql, new
            {
                command.TenantId,
                command.NodeId,
                command.Code,
                command.Title,
                command.SortOrder,
                command.Status
            }, cancellationToken: ct));
    }

    public async Task<bool> HasChildrenAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND parent_id = @NodeId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { TenantId = tenantId, NodeId = nodeId }, cancellationToken: ct));
        return count > 0;
    }

    public async Task<bool> HasContentsAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM content_item
            WHERE tenant_id = @TenantId
              AND curriculum_node_id = @NodeId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { TenantId = tenantId, NodeId = nodeId }, cancellationToken: ct));
        return count > 0;
    }

    public async Task<bool> DeleteNodeAsync(Guid tenantId, Guid nodeId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE curriculum_node
            SET is_deleted = TRUE,
                status = 'DELETED'::common_status,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @NodeId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId, NodeId = nodeId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<IReadOnlyList<CurriculumSiblingDto>> ListSiblingsAsync(Guid tenantId, Guid? parentId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   parent_id AS ParentId,
                   sort_order AS SortOrder
            FROM curriculum_node
            WHERE tenant_id = @TenantId
              AND parent_id IS NOT DISTINCT FROM @ParentId
              AND is_deleted = FALSE
            ORDER BY sort_order ASC, title ASC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<CurriculumSiblingDto>(
            new CommandDefinition(sql, new { TenantId = tenantId, ParentId = parentId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task ReorderSiblingsAsync(Guid tenantId, Guid? parentId, IReadOnlyList<CurriculumReorderItem> items, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE curriculum_node
            SET sort_order = @SortOrder,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND parent_id IS NOT DISTINCT FROM @ParentId
              AND id = @Id
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);

        try
        {
            foreach (var item in items)
            {
                await conn.ExecuteAsync(new CommandDefinition(sql, new
                {
                    TenantId = tenantId,
                    ParentId = parentId,
                    item.Id,
                    item.SortOrder
                }, transaction: tx, cancellationToken: ct));
            }

            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    // ── Content items ─────────────────────────────────────────────────────────

    public async Task<PagedResult<ContentListItem>> ListContentsAsync(ListContentsQuery query, CancellationToken ct = default)
    {
        var conditions = new List<string>
        {
            "tenant_id = @TenantId",
            "is_deleted = FALSE"
        };

        if (query.NodeId.HasValue)
            conditions.Add("curriculum_node_id = @NodeId");

        if (!string.IsNullOrWhiteSpace(query.Type))
            conditions.Add("type::TEXT = @Type");

        var status = query.Status?.ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(status))
        {
            conditions.Add("publish_status::TEXT = @Status");

            if (status == "PUBLISHED")
            {
                conditions.Add("(visibility_from IS NULL OR visibility_from <= @CurrentDate)");
                conditions.Add("(visibility_to IS NULL OR visibility_to >= @CurrentDate)");
            }
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
            conditions.Add("(title ILIKE @Search OR description ILIKE @Search)");

        var where = "WHERE " + string.Join(" AND ", conditions);
        var offset = (query.Page - 1) * query.PageSize;

        var countSql = $"SELECT COUNT(1) FROM content_item {where}";
        var dataSql = $"""
            WITH latest_progress AS (
                SELECT DISTINCT ON (p.content_item_id)
                       p.content_item_id AS content_id,
                       p.progress_value AS progress_value,
                       p.progress_total AS total_value
                FROM user_content_progress p
                WHERE p.tenant_id = @TenantId
                  AND p.user_id = @UserId
                  AND p.is_deleted = FALSE
                ORDER BY p.content_item_id, p.updated_at DESC
            )
            SELECT c.id,
                   c.type::TEXT AS Type,
                   c.title,
                   c.description,
                   c.file_name AS FileName,
                   c.file_size_bytes AS FileSizeBytes,
                   c.publish_status::TEXT AS PublishStatus,
                   c.visibility_from AS VisibilityFrom,
                   c.visibility_to AS VisibilityTo,
                   c.is_downloadable AS IsDownloadable,
                   FALSE AS IsCommentable,
                   c.watermark_enabled AS WatermarkEnabled,
                   c.media_processing_status AS MediaProcessingStatus,
                   COALESCE(lp.progress_value, 0) AS ProgressValue,
                   COALESCE(lp.total_value, 0) AS TotalValue,
                   c.created_at AS CreatedAt,
                   c.updated_at AS UpdatedAt
            FROM content_item c
            LEFT JOIN latest_progress lp ON lp.content_id = c.id
            {where}
            ORDER BY c.created_at DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var now = DateTime.UtcNow.Date;
        var parameters = new
        {
            query.TenantId,
            query.NodeId,
            Type = query.Type?.ToUpperInvariant(),
            Status = status,
            Search = string.IsNullOrWhiteSpace(query.Search) ? null : $"%{query.Search}%",
            query.PageSize,
            Offset = offset,
            query.UserId,
            CurrentDate = now
        };

        await using var conn = new NpgsqlConnection(_connectionString);
        var total = await conn.ExecuteScalarAsync<int>(new CommandDefinition(countSql, parameters, cancellationToken: ct));
        var rows = await conn.QueryAsync<ContentListItem>(new CommandDefinition(dataSql, parameters, cancellationToken: ct));

        return new PagedResult<ContentListItem>(rows.AsList(), total, query.Page, query.PageSize);
    }

    public async Task<int> CountContentsAsync(Guid tenantId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM content_item
            WHERE tenant_id = @TenantId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));
    }

        public async Task<int> CountSchoolsUsingAsync(Guid tenantId, CancellationToken ct = default)
        {
                const string sql = """
                        SELECT COUNT(DISTINCT school_id)
                        FROM content_permission cp
                        WHERE cp.tenant_id = @TenantId
                            AND cp.school_id IS NOT NULL
                            AND cp.is_deleted = FALSE
                        """;

                await using var conn = new NpgsqlConnection(_connectionString);
                return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));
        }

        public async Task<int> CountSoldDocumentsAsync(Guid tenantId, CancellationToken ct = default)
        {
                const string sql = """
                        WITH RECURSIVE item_ancestors AS (
                                SELECT id AS content_id, curriculum_node_id AS node_id
                                FROM content_item
                                WHERE tenant_id = @TenantId
                                    AND is_deleted = FALSE

                                UNION ALL

                                SELECT ia.content_id, cn.parent_id AS node_id
                                FROM item_ancestors ia
                                JOIN curriculum_node cn ON cn.id = ia.node_id
                                WHERE cn.tenant_id = @TenantId
                                    AND cn.is_deleted = FALSE
                                    AND cn.parent_id IS NOT NULL
                        )
                        SELECT COUNT(DISTINCT ia.content_id)
                        FROM item_ancestors ia
                        JOIN content_permission cp
                            ON cp.tenant_id = @TenantId
                         AND cp.is_deleted = FALSE
                         AND cp.school_id IS NOT NULL
                         AND cp.curriculum_node_id = ia.node_id
                        """;

                await using var conn = new NpgsqlConnection(_connectionString);
                return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));
        }

        public async Task<IReadOnlyList<TopSoldContentItemDto>> ListTopSoldContentsAsync(Guid tenantId, int take, CancellationToken ct = default)
        {
                const string sql = """
                        WITH RECURSIVE node_hierarchy AS (
                                SELECT ci.id AS content_id,
                                       ci.title AS content_title,
                                       ci.curriculum_node_id AS leaf_node_id,
                                       cn.id AS node_id,
                                       cn.parent_id AS parent_id,
                                       cn.title AS title,
                                       1 AS depth
                                FROM content_item ci
                                JOIN curriculum_node cn ON cn.id = ci.curriculum_node_id
                                WHERE ci.tenant_id = @TenantId
                                  AND ci.is_deleted = FALSE
                                  AND cn.tenant_id = @TenantId
                                  AND cn.is_deleted = FALSE

                                UNION ALL

                                SELECT nh.content_id,
                                       nh.content_title,
                                       nh.leaf_node_id,
                                       parent.id AS node_id,
                                       parent.parent_id AS parent_id,
                                       parent.title AS title,
                                       nh.depth + 1 AS depth
                                FROM node_hierarchy nh
                                JOIN curriculum_node parent ON parent.id = nh.parent_id
                                WHERE parent.tenant_id = @TenantId
                                  AND parent.is_deleted = FALSE
                        ),
                        content_sales AS (
                                SELECT nh.content_id,
                                       COUNT(DISTINCT cp.school_id) AS sold_count
                                FROM node_hierarchy nh
                                JOIN content_permission cp
                                  ON cp.tenant_id = @TenantId
                                 AND cp.is_deleted = FALSE
                                 AND cp.school_id IS NOT NULL
                                 AND cp.curriculum_node_id = nh.node_id
                                GROUP BY nh.content_id
                        ),
                        content_paths AS (
                                SELECT nh.content_id,
                                       nh.content_title,
                                       nh.leaf_node_id AS curriculum_node_id,
                                       string_agg(nh.title, ' > ' ORDER BY nh.depth DESC) AS curriculum_node_full_path,
                                       max(nh.title) FILTER (WHERE nh.parent_id IS NULL) AS root_node_title,
                                       max(nh.title) FILTER (WHERE nh.depth = 1) AS leaf_node_title
                                FROM node_hierarchy nh
                                GROUP BY nh.content_id, nh.content_title, nh.leaf_node_id
                        )
                        SELECT row_number() OVER (
                            ORDER BY cs.sold_count DESC, cp.content_title ASC, cp.content_id ASC
                        ) AS "Rank",
                               cp.content_id AS "ContentId",
                               cp.content_title AS "ContentTitle",
                               cp.curriculum_node_id AS "CurriculumNodeId",
                               CASE
                                   WHEN cp.root_node_title IS NULL OR cp.root_node_title = cp.leaf_node_title THEN cp.curriculum_node_full_path
                                   ELSE cp.root_node_title || ' > ... > ' || cp.leaf_node_title
                               END AS "CurriculumNodeShortPath",
                               cp.curriculum_node_full_path AS "CurriculumNodeFullPath",
                               cs.sold_count AS "SoldCount"
                        FROM content_paths cp
                        JOIN content_sales cs ON cs.content_id = cp.content_id
                        ORDER BY cs.sold_count DESC, cp.content_title ASC, cp.content_id ASC
                        LIMIT @Take
                        """;

                await using var conn = new NpgsqlConnection(_connectionString);
                var rows = await conn.QueryAsync<TopSoldContentItemDto>(new CommandDefinition(sql, new { TenantId = tenantId, Take = take }, cancellationToken: ct));
                return rows.AsList();
        }

    public async Task<ContentItemDto?> GetContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   tenant_id AS TenantId,
                   curriculum_node_id AS CurriculumNodeId,
                   type::TEXT AS Type,
                   title,
                   description,
                   file_name AS FileName,
                   file_path AS FilePath,
                     hls_url AS HlsUrl,
                   source_url AS SourceUrl,
                   mime_type AS MimeType,
                   file_size_bytes AS FileSizeBytes,
                   publish_status::TEXT AS PublishStatus,
                   visibility_from AS VisibilityFrom,
                   visibility_to AS VisibilityTo,
                   is_downloadable AS IsDownloadable,
                   watermark_enabled AS WatermarkEnabled,
                   signed_url_ttl AS SignedUrlTtl,
                     media_processing_status AS MediaProcessingStatus,
                     media_processing_error AS MediaProcessingError,
                     media_processing_started_at AS MediaProcessingStartedAt,
                     media_processing_completed_at AS MediaProcessingCompletedAt,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM content_item
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<ContentItemDto>(
            new CommandDefinition(sql, new { TenantId = tenantId, ContentId = contentId }, cancellationToken: ct));
    }

    public async Task<IReadOnlyList<FavoriteContentItem>> ListFavoriteContentsAsync(Guid tenantId, Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT f.id,
                   f.content_item_id AS ContentItemId,
                   c.curriculum_node_id AS CurriculumNodeId,
                   c.title AS ContentItemTitle,
                   c.description AS ContentItemDescription,
                   n.title AS CurriculumNodeTitle,
                   c.type::TEXT AS Type,
                   f.created_at AS CreatedAt
            FROM user_favorite_content f
            JOIN content_item c ON c.id = f.content_item_id
            JOIN curriculum_node n ON n.id = c.curriculum_node_id
            WHERE f.user_id = @UserId
              AND c.tenant_id = @TenantId
              AND c.is_deleted = FALSE
            ORDER BY f.created_at DESC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<FavoriteContentItem>(
            new CommandDefinition(sql, new { TenantId = tenantId, UserId = userId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<bool> AddFavoriteContentAsync(Guid userId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_favorite_content (user_id, content_item_id)
            VALUES (@UserId, @ContentId)
            ON CONFLICT (user_id, content_item_id) DO NOTHING
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, ContentId = contentId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> RemoveFavoriteContentAsync(Guid userId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            DELETE
            FROM user_favorite_content
            WHERE user_id = @UserId
              AND content_item_id = @ContentId
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { UserId = userId, ContentId = contentId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<IReadOnlyList<ContentCommentDto>> ListContentCommentsAsync(Guid tenantId, Guid contentId, Guid? requestingUserSchoolId, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE live_comments AS (
                SELECT cc.id,
                       cc.parent_id
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                WHERE c.tenant_id = @TenantId
                  AND cc.content_item_id = @ContentId
                  AND cc.status = 'APPROVED'::comment_status
                  AND cc.is_deleted = FALSE
                  AND cc.parent_id IS NULL
                  AND (cc.is_public = TRUE OR (cc.is_public = FALSE AND cc.school_id = @RequestingUserSchoolId))
                UNION ALL
                SELECT cc.id,
                       cc.parent_id
                FROM content_comment cc
                JOIN live_comments lc ON cc.parent_id = lc.id
                JOIN content_item c ON c.id = cc.content_item_id
                WHERE c.tenant_id = @TenantId
                  AND cc.content_item_id = @ContentId
                  AND cc.status = 'APPROVED'::comment_status
                  AND cc.is_deleted = FALSE
                  AND (cc.is_public = TRUE OR (cc.is_public = FALSE AND cc.school_id = @RequestingUserSchoolId))
            ),
            deleted_admin_placeholders AS (
                SELECT cc.id,
                       cc.parent_id
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                WHERE c.tenant_id = @TenantId
                  AND cc.content_item_id = @ContentId
                  AND cc.status = 'DELETED'::comment_status
                  AND cc.is_deleted = TRUE
                  AND (cc.is_public = TRUE OR (cc.is_public = FALSE AND cc.school_id = @RequestingUserSchoolId))
                  AND (cc.parent_id IS NULL OR cc.parent_id IN (SELECT id FROM live_comments))
            ),
            all_visible AS (
                SELECT id FROM live_comments
                UNION ALL
                SELECT id FROM deleted_admin_placeholders
            )
            SELECT cc.id AS Id,
                   cc.content_item_id AS ContentItemId,
                   cc.user_id AS UserId,
                   CASE WHEN cc.status = 'DELETED'::comment_status THEN NULL ELSE u.full_name END AS AuthorName,
                   CASE WHEN cc.status = 'DELETED'::comment_status THEN NULL ELSE u.avatar_url END AS AvatarUrl,
                   cc.parent_id AS ParentId,
                   CASE WHEN cc.status = 'DELETED'::comment_status THEN NULL ELSE cc.body END AS Body,
                   cc.is_deleted AS IsDeleted,
                   cc.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                   cc.created_at AS CreatedAt,
                   cc.updated_at AS UpdatedAt,
                   cc.is_public AS IsPublic,
                   cc.is_admin AS IsAdmin,
                   cc.is_edited AS IsEdited,
                   cc.is_pinned AS IsPinned,
                     cc.school_id AS SchoolId,
                     c.title AS ContentTitle,
                     s.name AS SchoolName
            FROM content_comment cc
            JOIN content_item c ON c.id = cc.content_item_id
            LEFT JOIN user_account u ON u.id = cc.user_id
                 LEFT JOIN school s ON s.id = cc.school_id
            WHERE c.tenant_id = @TenantId
              AND cc.content_item_id = @ContentId
              AND cc.id IN (SELECT id FROM all_visible)
            ORDER BY cc.is_pinned DESC, cc.created_at ASC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<ContentCommentDto>(new CommandDefinition(sql, new { TenantId = tenantId, ContentId = contentId, RequestingUserSchoolId = requestingUserSchoolId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<PagedResult<ContentCommentDto>> ListTenantCommentsAsync(Guid tenantId, Guid? userId, Guid? schoolId, Guid? contentItemId, string? search, bool? isAdmin, bool? isPublic, bool? isPinned, string? sortOrder, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);
        var offset = (page - 1) * pageSize;

        const string countSql = """
            SELECT COUNT(1)
            FROM content_comment cc
            JOIN content_item c ON c.id = cc.content_item_id
            WHERE c.tenant_id = @TenantId
              AND cc.is_deleted = FALSE
              AND (@UserId IS NULL OR cc.user_id = @UserId)
              AND (@SchoolId IS NULL OR cc.school_id = @SchoolId)
              AND (@ContentItemId IS NULL OR cc.content_item_id = @ContentItemId)
              AND (@Search IS NULL OR cc.body ILIKE '%' || @Search || '%')
              AND (@IsAdmin IS NULL OR cc.is_admin = @IsAdmin)
              AND (@IsPublic IS NULL OR cc.is_public = @IsPublic)
              AND (@IsPinned IS NULL OR cc.is_pinned = @IsPinned)
            """;

        var sortDirection = string.Equals(sortOrder?.Trim(), "asc", StringComparison.OrdinalIgnoreCase)
            ? "ASC"
            : "DESC";

        const string sqlPrefix = """
            SELECT cc.id AS Id,
                   cc.content_item_id AS ContentItemId,
                   cc.user_id AS UserId,
                   CASE WHEN cc.is_deleted THEN NULL ELSE u.full_name END AS AuthorName,
                   CASE WHEN cc.is_deleted THEN NULL ELSE u.avatar_url END AS AvatarUrl,
                   cc.parent_id AS ParentId,
                   CASE WHEN cc.is_deleted THEN NULL ELSE cc.body END AS Body,
                   cc.is_deleted AS IsDeleted,
                   cc.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                   cc.created_at AS CreatedAt,
                   cc.updated_at AS UpdatedAt,
                   cc.is_public AS IsPublic,
                   cc.is_admin AS IsAdmin,
                   cc.is_edited AS IsEdited,
                   cc.is_pinned AS IsPinned,
                     cc.school_id AS SchoolId,
                     c.title AS ContentTitle,
                     s.name AS SchoolName
            FROM content_comment cc
            JOIN content_item c ON c.id = cc.content_item_id
            LEFT JOIN user_account u ON u.id = cc.user_id
                 LEFT JOIN school s ON s.id = cc.school_id
            WHERE c.tenant_id = @TenantId
              AND cc.is_deleted = FALSE
              AND (@UserId IS NULL OR cc.user_id = @UserId)
              AND (@SchoolId IS NULL OR cc.school_id = @SchoolId)
              AND (@ContentItemId IS NULL OR cc.content_item_id = @ContentItemId)
              AND (@Search IS NULL OR cc.body ILIKE '%' || @Search || '%')
              AND (@IsAdmin IS NULL OR cc.is_admin = @IsAdmin)
              AND (@IsPublic IS NULL OR cc.is_public = @IsPublic)
              AND (@IsPinned IS NULL OR cc.is_pinned = @IsPinned)
            """;

        var sql = $"""
            {sqlPrefix}
            ORDER BY cc.created_at {sortDirection}
            LIMIT @PageSize OFFSET @Offset
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var total = await conn.ExecuteScalarAsync<int>(new CommandDefinition(countSql, new { TenantId = tenantId, UserId = userId, SchoolId = schoolId, ContentItemId = contentItemId, Search = search, IsAdmin = isAdmin, IsPublic = isPublic, IsPinned = isPinned }, cancellationToken: ct));
        var rows = await conn.QueryAsync<ContentCommentDto>(new CommandDefinition(sql, new { TenantId = tenantId, UserId = userId, SchoolId = schoolId, ContentItemId = contentItemId, Search = search, IsAdmin = isAdmin, IsPublic = isPublic, IsPinned = isPinned, PageSize = pageSize, Offset = offset }, cancellationToken: ct));
        return new PagedResult<ContentCommentDto>(rows.AsList(), total, page, pageSize);
    }

    public async Task<ContentCommentDto?> GetContentCommentAsync(Guid tenantId, Guid commentId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT cc.id AS Id,
                   cc.content_item_id AS ContentItemId,
                   cc.user_id AS UserId,
                   u.full_name AS AuthorName,
                   u.avatar_url AS AvatarUrl,
                   cc.parent_id AS ParentId,
                   cc.body AS Body,
                   cc.is_deleted AS IsDeleted,
                   cc.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                   cc.created_at AS CreatedAt,
                   cc.updated_at AS UpdatedAt,
                   cc.is_public AS IsPublic,
                   cc.is_admin AS IsAdmin,
                   cc.is_edited AS IsEdited,
                   cc.is_pinned AS IsPinned,
                     cc.school_id AS SchoolId,
                     c.title AS ContentTitle,
                     s.name AS SchoolName
            FROM content_comment cc
            JOIN content_item c ON c.id = cc.content_item_id
                 JOIN user_account u ON u.id = cc.user_id
                 LEFT JOIN school s ON s.id = cc.school_id
            WHERE c.tenant_id = @TenantId
              AND cc.id = @CommentId
              AND cc.is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<ContentCommentDto>(new CommandDefinition(sql, new { TenantId = tenantId, CommentId = commentId }, cancellationToken: ct));
    }

    public async Task<ContentCommentDetailDto?> GetContentCommentDetailsAsync(Guid tenantId, Guid commentId, CancellationToken ct = default)
    {
        var comment = await GetContentCommentAsync(tenantId, commentId, ct);
        if (comment is null)
            return null;

        const string commentsSql = """
            WITH RECURSIVE root_ancestor AS (
                SELECT cc.id, cc.parent_id
                FROM content_comment cc
                WHERE cc.id = @CommentId

                UNION ALL

                SELECT parent.id, parent.parent_id
                FROM content_comment parent
                JOIN root_ancestor ra ON ra.parent_id = parent.id
            ),
            root_id AS (
                SELECT id
                FROM root_ancestor
                WHERE parent_id IS NULL
                LIMIT 1
            ),
            live_descendants AS (
                SELECT cc.id AS Id,
                       cc.content_item_id AS ContentItemId,
                       cc.user_id AS UserId,
                       u.full_name AS AuthorName,
                       u.avatar_url AS AvatarUrl,
                       cc.parent_id AS ParentId,
                       cc.body AS Body,
                       cc.is_deleted AS IsDeleted,
                       cc.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                       cc.created_at AS CreatedAt,
                       cc.updated_at AS UpdatedAt,
                       cc.is_public AS IsPublic,
                       cc.is_admin AS IsAdmin,
                       cc.is_edited AS IsEdited,
                       cc.is_pinned AS IsPinned,
                       cc.school_id AS SchoolId,
                       c.title AS ContentTitle,
                       s.name AS SchoolName,
                       0 AS Depth
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                JOIN user_account u ON u.id = cc.user_id
                LEFT JOIN school s ON s.id = cc.school_id
                JOIN root_id ri ON cc.id = ri.id
                WHERE cc.is_deleted = FALSE
                  AND cc.status = 'APPROVED'::comment_status

                UNION ALL

                SELECT child.id AS Id,
                       child.content_item_id AS ContentItemId,
                       child.user_id AS UserId,
                       child_user.full_name AS AuthorName,
                       child_user.avatar_url AS AvatarUrl,
                       child.parent_id AS ParentId,
                       child.body AS Body,
                       child.is_deleted AS IsDeleted,
                       child.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                       child.created_at AS CreatedAt,
                       child.updated_at AS UpdatedAt,
                       child.is_public AS IsPublic,
                       child.is_admin AS IsAdmin,
                       child.is_edited AS IsEdited,
                       child.is_pinned AS IsPinned,
                       child.school_id AS SchoolId,
                       child_content.title AS ContentTitle,
                       child_school.name AS SchoolName,
                       ld.Depth + 1 AS Depth
                FROM content_comment child
                JOIN live_descendants ld ON ld.Id = child.parent_id
                JOIN content_item child_content ON child_content.id = child.content_item_id
                JOIN user_account child_user ON child_user.id = child.user_id
                LEFT JOIN school child_school ON child_school.id = child.school_id
                WHERE child.is_deleted = FALSE
                  AND child.status = 'APPROVED'::comment_status
            ),
            deleted_admin_placeholders AS (
                SELECT cc.id AS Id,
                       cc.content_item_id AS ContentItemId,
                       cc.user_id AS UserId,
                       NULL AS AuthorName,
                       NULL AS AvatarUrl,
                       cc.parent_id AS ParentId,
                       NULL AS Body,
                       cc.is_deleted AS IsDeleted,
                       cc.status = 'DELETED'::comment_status AS IsDeletedByAdmin,
                       cc.created_at AS CreatedAt,
                       cc.updated_at AS UpdatedAt,
                       cc.is_public AS IsPublic,
                       cc.is_admin AS IsAdmin,
                       cc.is_edited AS IsEdited,
                       cc.is_pinned AS IsPinned,
                       cc.school_id AS SchoolId,
                       c.title AS ContentTitle,
                       s.name AS SchoolName,
                       COALESCE(ld.Depth + 1, 0) AS Depth
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                LEFT JOIN school s ON s.id = cc.school_id
                LEFT JOIN live_descendants ld ON ld.Id = cc.parent_id
                WHERE c.tenant_id = @TenantId
                  AND cc.status = 'DELETED'::comment_status
                  AND cc.is_deleted = TRUE
                  AND cc.parent_id IN (SELECT Id FROM live_descendants)
            ),
            all_visible AS (
                SELECT * FROM live_descendants
                UNION ALL
                SELECT * FROM deleted_admin_placeholders
            )
            SELECT Id,
                   ContentItemId,
                   UserId,
                   AuthorName,
                   AvatarUrl,
                   ParentId,
                   Body,
                   IsDeleted,
                   IsDeletedByAdmin,
                   CreatedAt,
                   UpdatedAt,
                   IsPublic,
                   IsAdmin,
                   IsEdited,
                   IsPinned,
                   SchoolId,
                   ContentTitle,
                   SchoolName
            FROM all_visible
            ORDER BY Depth ASC, CreatedAt ASC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var comments = await conn.QueryAsync<ContentCommentDto>(new CommandDefinition(commentsSql, new { TenantId = tenantId, CommentId = commentId }, cancellationToken: ct));

        return new ContentCommentDetailDto(comment, comments.AsList());
    }

    public async Task<Guid> CreateContentCommentAsync(CreateContentCommentCommand command, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO content_comment (
                content_item_id,
                user_id,
                parent_id,
                body,
                is_public,
                is_admin,
                is_edited,
                is_pinned,
                school_id,
                updated_by
            )
            VALUES (
                @ContentItemId,
                @UserId,
                @ParentId,
                @Body,
                @IsPublic,
                @IsAdmin,
                @IsEdited,
                @IsPinned,
                @SchoolId,
                @UpdatedBy
            )
            RETURNING id
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QuerySingleAsync<Guid>(new CommandDefinition(sql, command, cancellationToken: ct));
    }

    public async Task<bool> UpdateContentCommentAsync(UpdateContentCommentCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_comment
            SET body = @Body,
                is_edited = TRUE,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            WHERE id = @CommentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, command, cancellationToken: ct));
        return rows > 0;
    }

        public async Task<bool> SetContentCommentPinnedAsync(Guid tenantId, Guid commentId, bool isPinned, Guid updatedBy, CancellationToken ct = default)
        {
            const string sql = """
            UPDATE content_comment cc
            SET is_pinned = @IsPinned,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            FROM content_item c
            WHERE cc.id = @CommentId
              AND cc.content_item_id = c.id
              AND c.tenant_id = @TenantId
              AND cc.is_deleted = FALSE
              AND cc.parent_id IS NULL
            """;

            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, CommentId = commentId, IsPinned = isPinned, UpdatedBy = updatedBy }, cancellationToken: ct));
            return rows > 0;
        }

        public async Task<bool> SetContentCommentVisibilityAsync(Guid tenantId, Guid commentId, bool isPublic, Guid updatedBy, CancellationToken ct = default)
        {
            const string sql = """
            UPDATE content_comment cc
            SET is_public = @IsPublic,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            FROM content_item c
            WHERE cc.id = @CommentId
              AND cc.content_item_id = c.id
              AND c.tenant_id = @TenantId
              AND cc.is_deleted = FALSE
            """;

            await using var conn = new NpgsqlConnection(_connectionString);
            var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, CommentId = commentId, IsPublic = isPublic, UpdatedBy = updatedBy }, cancellationToken: ct));
            return rows > 0;
        }

    public async Task<bool> DeleteContentCommentAsync(Guid tenantId, Guid commentId, Guid updatedBy, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE comment_tree AS (
                SELECT cc.id
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                WHERE cc.id = @CommentId
                  AND c.tenant_id = @TenantId
                  AND cc.is_deleted = FALSE
                UNION ALL
                SELECT cc.id
                FROM content_comment cc
                JOIN comment_tree ct ON cc.parent_id = ct.id
                WHERE cc.is_deleted = FALSE
            )
            UPDATE content_comment cc
            SET is_deleted = TRUE,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            WHERE cc.id IN (SELECT id FROM comment_tree)
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, CommentId = commentId, UpdatedBy = updatedBy }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> DeleteContentCommentAsTenantAdminAsync(Guid tenantId, Guid commentId, Guid updatedBy, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE comment_tree AS (
                SELECT cc.id,
                       cc.id AS root_id,
                       cc.user_id AS root_user_id
                FROM content_comment cc
                JOIN content_item c ON c.id = cc.content_item_id
                WHERE cc.id = @CommentId
                  AND c.tenant_id = @TenantId
                  AND cc.is_deleted = FALSE
                UNION ALL
                SELECT cc.id,
                       ct.root_id,
                       ct.root_user_id
                FROM content_comment cc
                JOIN comment_tree ct ON cc.parent_id = ct.id
                WHERE cc.is_deleted = FALSE
            )
            UPDATE content_comment cc
            SET is_deleted = TRUE,
                status = CASE
                           WHEN ct.id = ct.root_id AND ct.root_user_id <> @UpdatedBy THEN 'DELETED'::comment_status
                           ELSE cc.status
                         END,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            FROM comment_tree ct
            WHERE cc.id = ct.id
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, CommentId = commentId, UpdatedBy = updatedBy }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(GetDashboardSummaryQuery query, CancellationToken ct = default)
    {
        if (query.AllowedNodeIds.Count == 0)
            return new DashboardSummaryDto(0, 0, 0, null, new List<ViewedThisWeekDetail>(), new List<FavoriteDetail>(), new List<FavoriteDetail>());

        const string countsSql = """
            WITH visible_content AS (
                SELECT c.id
                FROM content_item c
                WHERE c.tenant_id = @TenantId
                  AND c.is_deleted = FALSE
                  AND c.curriculum_node_id = ANY(@AllowedNodeIds)
                  AND c.publish_status = 'PUBLISHED'::publish_status
                  AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
                  AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ),
            latest_progress AS (
                SELECT DISTINCT ON (p.content_item_id)
                       p.content_item_id AS ContentId,
                       p.updated_at AS LastViewedAt
                FROM user_content_progress p
                JOIN visible_content vc ON vc.id = p.content_item_id
                WHERE p.tenant_id = @TenantId
                  AND p.user_id = @UserId
                  AND p.is_deleted = FALSE
                ORDER BY p.content_item_id, p.updated_at DESC
            ),
            favorite_items AS (
                SELECT f.content_item_id AS ContentId,
                       f.created_at AS FavoritedAt
                FROM user_favorite_content f
                JOIN visible_content vc ON vc.id = f.content_item_id
                WHERE f.user_id = @UserId
            )
            SELECT
                COALESCE((
                    SELECT COUNT(1)
                    FROM latest_progress lp
                    WHERE lp.LastViewedAt >= @WeekStart
                ), 0) AS ViewedThisWeekCount,
                COALESCE((
                    SELECT COUNT(1)
                    FROM favorite_items fi
                ), 0) AS FavoriteCount,
                COALESCE((
                    SELECT COUNT(1)
                    FROM favorite_items fi
                    WHERE fi.FavoritedAt >= @WeekStart
                ), 0) AS FavoriteAddedThisWeekCount,
                (
                    SELECT MAX(lp.LastViewedAt)
                    FROM latest_progress lp
                ) AS LastLearningAt
            """;
        const int maxItems = 50;

        await using var conn = new NpgsqlConnection(_connectionString);

        // small DTO to receive counts
        var counts = await conn.QuerySingleAsync<DashboardCounts>(new CommandDefinition(countsSql, new
        {
            query.TenantId,
            query.UserId,
            AllowedNodeIds = query.AllowedNodeIds.ToArray(),
            query.WeekStart,
            CurrentTime = query.CurrentTime
        }, cancellationToken: ct));

        // Viewed this week details
        const string viewedSql = """
            SELECT lp.ContentId AS ContentId,
                   c.title AS Title,
                   lp.LastViewedAt AS LastViewedAt
            FROM (
                SELECT DISTINCT ON (p.content_item_id)
                       p.content_item_id AS ContentId,
                       p.updated_at AS LastViewedAt
                FROM user_content_progress p
                WHERE p.tenant_id = @TenantId
                  AND p.user_id = @UserId
                  AND p.is_deleted = FALSE
                ORDER BY p.content_item_id, p.updated_at DESC
            ) lp
            JOIN content_item c ON c.id = lp.ContentId
            WHERE lp.LastViewedAt >= @WeekStart
              AND c.tenant_id = @TenantId
              AND c.is_deleted = FALSE
              AND c.curriculum_node_id = ANY(@AllowedNodeIds)
              AND c.publish_status = 'PUBLISHED'::publish_status
              AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
              AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ORDER BY lp.LastViewedAt DESC
            LIMIT @MaxItems;
        """;

        var viewedDetails = (await conn.QueryAsync<ViewedThisWeekDetail>(new CommandDefinition(viewedSql, new
        {
            query.TenantId,
            query.UserId,
            AllowedNodeIds = query.AllowedNodeIds.ToArray(),
            query.WeekStart,
            CurrentTime = query.CurrentTime,
            MaxItems = maxItems
        }, cancellationToken: ct))).AsList();

        // Favorite details
        const string favoriteSql = """
            SELECT f.content_item_id AS ContentId,
                   c.title AS Title,
                   f.created_at AS FavoritedAt
            FROM user_favorite_content f
            JOIN content_item c ON c.id = f.content_item_id
            WHERE f.user_id = @UserId
              AND c.tenant_id = @TenantId
              AND c.is_deleted = FALSE
              AND c.curriculum_node_id = ANY(@AllowedNodeIds)
              AND c.publish_status = 'PUBLISHED'::publish_status
              AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
              AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ORDER BY f.created_at DESC
            LIMIT @MaxItems;
        """;

        var favoriteDetails = (await conn.QueryAsync<FavoriteDetail>(new CommandDefinition(favoriteSql, new
        {
            query.TenantId,
            query.UserId,
            AllowedNodeIds = query.AllowedNodeIds.ToArray(),
            CurrentTime = query.CurrentTime,
            MaxItems = maxItems
        }, cancellationToken: ct))).AsList();

        // Favorite added this week
        const string favoriteWeekSql = """
            SELECT f.content_item_id AS ContentId,
                   c.title AS Title,
                   f.created_at AS FavoritedAt
            FROM user_favorite_content f
            JOIN content_item c ON c.id = f.content_item_id
            WHERE f.user_id = @UserId
              AND f.created_at >= @WeekStart
              AND c.tenant_id = @TenantId
              AND c.is_deleted = FALSE
              AND c.curriculum_node_id = ANY(@AllowedNodeIds)
              AND c.publish_status = 'PUBLISHED'::publish_status
              AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
              AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ORDER BY f.created_at DESC
            LIMIT @MaxItems;
        """;

        var favoriteAddedThisWeekDetails = (await conn.QueryAsync<FavoriteDetail>(new CommandDefinition(favoriteWeekSql, new
        {
            query.TenantId,
            query.UserId,
            AllowedNodeIds = query.AllowedNodeIds.ToArray(),
            query.WeekStart,
            CurrentTime = query.CurrentTime,
            MaxItems = maxItems
        }, cancellationToken: ct))).AsList();

        return new DashboardSummaryDto(
            counts.ViewedThisWeekCount,
            counts.FavoriteCount,
            counts.FavoriteAddedThisWeekCount,
            counts.LastLearningAt,
            viewedDetails,
            favoriteDetails,
            favoriteAddedThisWeekDetails);
    }

    public async Task<PagedResult<QuickAccessItem>> ListQuickAccessAsync(ListQuickAccessQuery query, CancellationToken ct = default)
    {
        if (query.AllowedNodeIds.Count == 0)
            return new PagedResult<QuickAccessItem>([], 0, query.Page, query.PageSize);

        var offset = (query.Page - 1) * query.PageSize;

        const string sql = """
            WITH latest_progress AS (
                SELECT DISTINCT ON (p.content_item_id)
                       p.content_item_id AS ContentId,
                       p.updated_at AS LastViewedAt,
                       p.progress_value AS ProgressValue,
                       p.progress_total AS TotalValue
                FROM user_content_progress p
                WHERE p.tenant_id = @TenantId
                  AND p.user_id = @UserId
                  AND p.is_deleted = FALSE
                ORDER BY p.content_item_id, p.updated_at DESC
            ),
            viewed_week AS (
                SELECT lp.ContentId,
                       lp.LastViewedAt,
                       lp.ProgressValue,
                       lp.TotalValue
                FROM latest_progress lp
                WHERE lp.LastViewedAt >= @WeekStart
            ),
            favorites AS (
                SELECT f.content_item_id AS ContentId,
                       f.created_at AS FavoritedAt
                FROM user_favorite_content f
                WHERE f.user_id = @UserId
            ),
            visible_content AS (
                SELECT c.id,
                       c.type::TEXT AS Type,
                       c.title,
                       c.curriculum_node_id AS CurriculumNodeId,
                       n.title AS CurriculumNodeTitle
                FROM content_item c
                JOIN curriculum_node n ON n.id = c.curriculum_node_id
                WHERE c.tenant_id = @TenantId
                  AND c.is_deleted = FALSE
                  AND c.curriculum_node_id = ANY(@AllowedNodeIds)
                  AND c.publish_status = 'PUBLISHED'::publish_status
                  AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
                  AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ),
            group_viewed AS (
                SELECT vc.id AS ContentId,
                       vc.Type,
                       vc.title,
                       vc.CurriculumNodeId,
                       vc.CurriculumNodeTitle,
                       FALSE AS IsFavorite,
                       vw.LastViewedAt,
                       NULL::timestamptz AS FavoritedAt,
                       vw.ProgressValue,
                       vw.TotalValue,
                       'VIEWED_THIS_WEEK'::text AS "Group",
                       1 AS RankGroup,
                       vw.LastViewedAt AS SortTime
                FROM viewed_week vw
                JOIN visible_content vc ON vc.id = vw.ContentId
                LEFT JOIN favorites f ON f.ContentId = vw.ContentId
                WHERE f.ContentId IS NULL
            ),
            group_favorite AS (
                SELECT vc.id AS ContentId,
                       vc.Type,
                       vc.title,
                       vc.CurriculumNodeId,
                       vc.CurriculumNodeTitle,
                       TRUE AS IsFavorite,
                       lp.LastViewedAt,
                       f.FavoritedAt,
                       COALESCE(lp.ProgressValue, 0) AS ProgressValue,
                       COALESCE(lp.TotalValue, 0) AS TotalValue,
                       'FAVORITE'::text AS "Group",
                       2 AS RankGroup,
                       f.FavoritedAt AS SortTime
                FROM favorites f
                JOIN visible_content vc ON vc.id = f.ContentId
                LEFT JOIN latest_progress lp ON lp.ContentId = f.ContentId
            ),
            combined AS (
                SELECT * FROM group_viewed
                UNION ALL
                SELECT * FROM group_favorite
            )
            SELECT ContentId,
                   Type,
                   title,
                   CurriculumNodeId,
                   CurriculumNodeTitle,
                   IsFavorite,
                   LastViewedAt,
                   FavoritedAt,
                   ProgressValue,
                   TotalValue,
                   "Group"
            FROM combined
            ORDER BY RankGroup ASC, SortTime DESC, ContentId
            LIMIT @PageSize OFFSET @Offset;

            WITH latest_progress AS (
                SELECT DISTINCT ON (p.content_item_id)
                       p.content_item_id AS ContentId,
                       p.updated_at AS LastViewedAt
                FROM user_content_progress p
                WHERE p.tenant_id = @TenantId
                  AND p.user_id = @UserId
                  AND p.is_deleted = FALSE
                ORDER BY p.content_item_id, p.updated_at DESC
            ),
            viewed_week AS (
                SELECT lp.ContentId
                FROM latest_progress lp
                WHERE lp.LastViewedAt >= @WeekStart
            ),
            favorites AS (
                SELECT f.content_item_id AS ContentId
                FROM user_favorite_content f
                WHERE f.user_id = @UserId
            ),
            visible_content AS (
                SELECT c.id
                FROM content_item c
                WHERE c.tenant_id = @TenantId
                  AND c.is_deleted = FALSE
                  AND c.curriculum_node_id = ANY(@AllowedNodeIds)
                  AND c.publish_status = 'PUBLISHED'::publish_status
                  AND (c.visibility_from IS NULL OR c.visibility_from <= @CurrentTime)
                  AND (c.visibility_to IS NULL OR c.visibility_to >= @CurrentTime)
            ),
            group_viewed AS (
                SELECT vc.id AS ContentId
                FROM viewed_week vw
                JOIN visible_content vc ON vc.id = vw.ContentId
                LEFT JOIN favorites f ON f.ContentId = vw.ContentId
                WHERE f.ContentId IS NULL
            ),
            group_favorite AS (
                SELECT vc.id AS ContentId
                FROM favorites f
                JOIN visible_content vc ON vc.id = f.ContentId
            ),
            combined AS (
                SELECT ContentId FROM group_viewed
                UNION ALL
                SELECT ContentId FROM group_favorite
            )
            SELECT COUNT(1)
            FROM combined;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await using var multi = await conn.QueryMultipleAsync(new CommandDefinition(sql, new
        {
            query.TenantId,
            query.UserId,
            AllowedNodeIds = query.AllowedNodeIds.ToArray(),
            query.WeekStart,
            CurrentTime = query.CurrentTime,
            query.PageSize,
            Offset = offset
        }, cancellationToken: ct));

        var items = (await multi.ReadAsync<QuickAccessItem>()).AsList();
        var total = await multi.ReadSingleAsync<int>();
        return new PagedResult<QuickAccessItem>(items, total, query.Page, query.PageSize);
    }

    public async Task<ContentProgressDto?> GetUserContentProgressAsync(Guid tenantId, Guid userId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT id,
                   tenant_id AS TenantId,
                   user_id AS UserId,
                   content_item_id AS ContentItemId,
                   progress_value AS ProgressValue,
                   progress_total AS TotalValue,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM user_content_progress
            WHERE tenant_id = @TenantId
              AND user_id = @UserId
              AND content_item_id = @ContentId
              AND is_deleted = FALSE
            LIMIT 1
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<ContentProgressDto>(
            new CommandDefinition(sql, new { TenantId = tenantId, UserId = userId, ContentId = contentId }, cancellationToken: ct));
    }

    public async Task<ContentProgressDto> UpsertUserContentProgressAsync(UpsertContentProgressCommand command, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO user_content_progress (
                tenant_id,
                user_id,
                content_item_id,
                progress_value,
                progress_total,
                is_deleted,
                created_by,
                updated_by,
                created_at,
                updated_at)
            VALUES (
                @TenantId,
                @UserId,
                @ContentItemId,
                @ProgressValue,
                @TotalValue,
                FALSE,
                @UpdatedBy,
                @UpdatedBy,
                NOW(),
                NOW())
            ON CONFLICT (tenant_id, user_id, content_item_id)
            WHERE is_deleted = FALSE
            DO UPDATE
            SET progress_value = EXCLUDED.progress_value,
                progress_total = EXCLUDED.progress_total,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING id,
                      tenant_id AS TenantId,
                      user_id AS UserId,
                      content_item_id AS ContentItemId,
                      progress_value AS ProgressValue,
                      progress_total AS TotalValue,
                      created_at AS CreatedAt,
                      updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QuerySingleAsync<ContentProgressDto>(new CommandDefinition(sql, new
        {
            command.TenantId,
            command.UserId,
            command.ContentItemId,
            command.ProgressValue,
            command.TotalValue,
            command.UpdatedBy
        }, cancellationToken: ct));
    }

    public async Task CreateContentAsync(Domain.ContentItem item, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO content_item (
                id, tenant_id, curriculum_node_id, type, title, description,
                file_name, file_path, source_url, mime_type, file_size_bytes,
                publish_status, visibility_from, visibility_to,
                is_downloadable, watermark_enabled, signed_url_ttl,
                is_deleted, created_by, created_at, updated_at)
            VALUES (
                @Id, @TenantId, @CurriculumNodeId, @Type::content_type, @Title, @Description,
                @FileName, @FilePath, @SourceUrl, @MimeType, @FileSizeBytes,
                @PublishStatus::publish_status, @VisibilityFrom, @VisibilityTo,
                @IsDownloadable, @WatermarkEnabled, @SignedUrlTtl,
                FALSE, @CreatedBy, NOW(), NOW())
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            item.Id,
            item.TenantId,
            item.CurriculumNodeId,
            item.Type,
            item.Title,
            item.Description,
            item.FileName,
            item.FilePath,
            item.SourceUrl,
            item.MimeType,
            item.FileSizeBytes,
            item.PublishStatus,
            item.VisibilityFrom,
            item.VisibilityTo,
            item.IsDownloadable,
            item.WatermarkEnabled,
            item.SignedUrlTtl,
            item.CreatedBy
        }, cancellationToken: ct));
    }

    public async Task<ContentItemDto?> UpdateContentAsync(UpdateContentCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET curriculum_node_id = @CurriculumNodeId,
                title              = @Title,
                description        = @Description,
                source_url         = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE @SourceUrl END,
                file_name          = COALESCE(@FileName, file_name),
                file_path          = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE file_path END,
                mime_type          = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE mime_type END,
                file_size_bytes    = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE file_size_bytes END,
                hls_url            = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE hls_url END,
                media_processing_status = CASE WHEN @IsUploadSessionRequested THEN 'NOT_REQUIRED' ELSE media_processing_status END,
                media_processing_error = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE media_processing_error END,
                media_processing_started_at = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE media_processing_started_at END,
                media_processing_completed_at = CASE WHEN @IsUploadSessionRequested THEN NULL ELSE media_processing_completed_at END,
                watermark_enabled  = @WatermarkEnabled,
                is_downloadable    = @IsDownloadable,
                visibility_from    = @VisibilityFrom,
                visibility_to      = @VisibilityTo,
                updated_by         = @UpdatedBy,
                updated_at         = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            RETURNING id,
                      tenant_id AS TenantId,
                      curriculum_node_id AS CurriculumNodeId,
                      type::TEXT AS Type,
                      title,
                      description,
                      file_name AS FileName,
                      file_path AS FilePath,
                      hls_url AS HlsUrl,
                      source_url AS SourceUrl,
                      mime_type AS MimeType,
                      file_size_bytes AS FileSizeBytes,
                      publish_status::TEXT AS PublishStatus,
                      visibility_from AS VisibilityFrom,
                      visibility_to AS VisibilityTo,
                      is_downloadable AS IsDownloadable,
                      watermark_enabled AS WatermarkEnabled,
                      signed_url_ttl AS SignedUrlTtl,
                      media_processing_status AS MediaProcessingStatus,
                      media_processing_error AS MediaProcessingError,
                      media_processing_started_at AS MediaProcessingStartedAt,
                      media_processing_completed_at AS MediaProcessingCompletedAt,
                      created_at AS CreatedAt,
                      updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<ContentItemDto>(
            new CommandDefinition(sql, new
            {
                command.TenantId,
                command.ContentId,
                command.CurriculumNodeId,
                command.Title,
                command.Description,
                command.FileName,
                command.SourceUrl,
                IsUploadSessionRequested = !string.IsNullOrWhiteSpace(command.FileName),
                command.WatermarkEnabled,
                command.IsDownloadable,
                command.VisibilityFrom,
                command.VisibilityTo,
                command.UpdatedBy
            }, cancellationToken: ct));
    }

    public async Task<UpdateContentStatusResult?> UpdateContentStatusAsync(UpdateContentStatusCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET publish_status = @PublishStatus::publish_status,
                updated_by     = @UpdatedBy,
                updated_at     = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            RETURNING id AS ContentId,
                      publish_status::TEXT AS PublishStatus,
                      updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<UpdateContentStatusResult>(
            new CommandDefinition(sql, new
            {
                command.TenantId,
                command.ContentId,
                PublishStatus = command.PublishStatus.ToUpperInvariant(),
                command.UpdatedBy
            }, cancellationToken: ct));
    }

    public async Task<ConfirmUploadResult?> ConfirmUploadAsync(ConfirmUploadCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET file_name       = @FileName,
                file_path       = @ObjectKey,
                mime_type       = @MimeType,
                file_size_bytes = @FileSizeBytes,
                updated_by      = @UpdatedBy,
                updated_at      = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
                        RETURNING id AS ContentId,
                                            type::TEXT AS Type,
                                            file_path AS FilePath,
                                            mime_type AS MimeType,
                                            COALESCE(file_size_bytes, 0)::BIGINT AS FileSizeBytes,
                                            updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
                return await conn.QueryFirstOrDefaultAsync<ConfirmUploadResult>(
            new CommandDefinition(sql, new
            {
                command.TenantId,
                command.ContentId,
                command.FileName,
                command.ObjectKey,
                command.MimeType,
                command.FileSizeBytes,
                command.UpdatedBy
            }, cancellationToken: ct));
    }

    public async Task<bool> DeleteContentAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET is_deleted = TRUE,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId, ContentId = contentId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> MarkMediaProcessingQueuedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET media_processing_status = 'QUEUED',
                media_processing_error = NULL,
                media_processing_started_at = NULL,
                media_processing_completed_at = NULL,
                hls_url = NULL,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, ContentId = contentId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> MarkMediaProcessingStartedAsync(Guid tenantId, Guid contentId, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET media_processing_status = 'PROCESSING',
                media_processing_error = NULL,
                media_processing_started_at = NOW(),
                media_processing_completed_at = NULL,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new { TenantId = tenantId, ContentId = contentId }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> MarkMediaProcessingReadyAsync(Guid tenantId, Guid contentId, string hlsMasterPath, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET media_processing_status = 'READY',
                media_processing_error = NULL,
                media_processing_completed_at = NOW(),
                hls_url = @HlsMasterPath,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            TenantId = tenantId,
            ContentId = contentId,
            HlsMasterPath = hlsMasterPath
        }, cancellationToken: ct));
        return rows > 0;
    }

    public async Task<bool> MarkMediaProcessingFailedAsync(Guid tenantId, Guid contentId, string error, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_item
            SET media_processing_status = 'FAILED',
                media_processing_error = @Error,
                media_processing_completed_at = NOW(),
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @ContentId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            TenantId = tenantId,
            ContentId = contentId,
            Error = error
        }, cancellationToken: ct));
        return rows > 0;
    }

    // ── Permission distribution ──────────────────────────────────────────────

    public async Task<bool> SchoolBelongsToTenantAsync(Guid tenantId, Guid schoolId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM school_tenant_mapping
            WHERE tenant_id = @TenantId
              AND school_id = @SchoolId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { TenantId = tenantId, SchoolId = schoolId }, cancellationToken: ct));
        return count > 0;
    }

    public async Task<bool> UserBelongsToTenantAsync(Guid tenantId, Guid userId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT COUNT(1)
            FROM user_tenant_role_assignment
            WHERE tenant_id = @TenantId
              AND user_id = @UserId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(sql, new { TenantId = tenantId, UserId = userId }, cancellationToken: ct));
        return count > 0;
    }

    public async Task<IReadOnlyList<ContentPermissionDto>> ListContentPermissionsAsync(ListContentPermissionsQuery query, CancellationToken ct = default)
    {
        var conditions = new List<string>
        {
            "tenant_id = @TenantId",
            "is_deleted = FALSE"
        };

        if (query.CurriculumNodeId.HasValue)
            conditions.Add("curriculum_node_id = @CurriculumNodeId");

        if (query.SchoolId.HasValue)
            conditions.Add("school_id = @SchoolId");

        if (query.UserId.HasValue)
            conditions.Add("user_id = @UserId");

        var where = "WHERE " + string.Join(" AND ", conditions);

        var sql = $"""
            SELECT id,
                   tenant_id AS TenantId,
                   curriculum_node_id AS CurriculumNodeId,
                   school_id AS SchoolId,
                   user_id AS UserId,
                   can_view AS CanView,
                   can_download AS CanDownload,
                   can_comment AS CanComment,
                   created_at AS CreatedAt,
                   updated_at AS UpdatedAt
            FROM content_permission
            {where}
            ORDER BY updated_at DESC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<ContentPermissionDto>(new CommandDefinition(sql, new
        {
            query.TenantId,
            query.CurriculumNodeId,
            query.SchoolId,
            query.UserId
        }, cancellationToken: ct));

        return rows.AsList();
    }

    public async Task<GrantContentPermissionResult> UpsertContentPermissionAsync(GrantContentPermissionCommand command, CancellationToken ct = default)
    {
        const string updateByUserSql = """
            UPDATE content_permission
            SET can_view     = @CanView,
                can_download = @CanDownload,
                can_comment  = @CanComment,
                is_deleted   = FALSE,
                updated_by   = @UpdatedBy,
                updated_at   = NOW()
            WHERE id = (
                SELECT id
                FROM content_permission
                WHERE tenant_id = @TenantId
                  AND curriculum_node_id = @CurriculumNodeId
                  AND user_id = @UserId
                ORDER BY created_at DESC
                LIMIT 1
            )
            RETURNING id AS PermissionId,
                      curriculum_node_id AS CurriculumNodeId,
                      school_id AS SchoolId,
                      user_id AS UserId,
                      can_view AS CanView,
                      can_download AS CanDownload,
                      can_comment AS CanComment,
                      updated_at AS UpdatedAt
            """;

        const string updateBySchoolSql = """
            UPDATE content_permission
            SET can_view     = @CanView,
                can_download = @CanDownload,
                can_comment  = @CanComment,
                is_deleted   = FALSE,
                updated_by   = @UpdatedBy,
                updated_at   = NOW()
            WHERE id = (
                SELECT id
                FROM content_permission
                WHERE tenant_id = @TenantId
                  AND curriculum_node_id = @CurriculumNodeId
                  AND school_id = @SchoolId
                ORDER BY created_at DESC
                LIMIT 1
            )
            RETURNING id AS PermissionId,
                      curriculum_node_id AS CurriculumNodeId,
                      school_id AS SchoolId,
                      user_id AS UserId,
                      can_view AS CanView,
                      can_download AS CanDownload,
                      can_comment AS CanComment,
                      updated_at AS UpdatedAt
            """;

        const string insertSql = """
            INSERT INTO content_permission (
                tenant_id, curriculum_node_id, school_id, user_id,
                can_view, can_download, can_comment,
                is_deleted, created_by, updated_by, created_at, updated_at)
            VALUES (
                @TenantId, @CurriculumNodeId, @SchoolId, @UserId,
                @CanView, @CanDownload, @CanComment,
                FALSE, @CreatedBy, @UpdatedBy, NOW(), NOW())
            RETURNING id AS PermissionId,
                      curriculum_node_id AS CurriculumNodeId,
                      school_id AS SchoolId,
                      user_id AS UserId,
                      can_view AS CanView,
                      can_download AS CanDownload,
                      can_comment AS CanComment,
                      updated_at AS UpdatedAt
            """;

        await using var conn = new NpgsqlConnection(_connectionString);

        var updateSql = command.UserId.HasValue ? updateByUserSql : updateBySchoolSql;
        var updated = await conn.QueryFirstOrDefaultAsync<GrantContentPermissionResult>(
            new CommandDefinition(updateSql, new
            {
                command.TenantId,
                command.CurriculumNodeId,
                command.SchoolId,
                command.UserId,
                command.CanView,
                command.CanDownload,
                command.CanComment,
                CreatedBy = command.CreatedBy,
                UpdatedBy = command.CreatedBy
            }, cancellationToken: ct));

        if (updated is not null)
            return updated;

        return await conn.QuerySingleAsync<GrantContentPermissionResult>(
            new CommandDefinition(insertSql, new
            {
                command.TenantId,
                command.CurriculumNodeId,
                command.SchoolId,
                command.UserId,
                command.CanView,
                command.CanDownload,
                command.CanComment,
                CreatedBy = command.CreatedBy,
                UpdatedBy = command.CreatedBy
            }, cancellationToken: ct));
    }

    public async Task<bool> DeleteContentPermissionAsync(DeleteContentPermissionCommand command, CancellationToken ct = default)
    {
        const string sql = """
            UPDATE content_permission
            SET is_deleted = TRUE,
                updated_by = @UpdatedBy,
                updated_at = NOW()
            WHERE tenant_id = @TenantId
              AND id = @PermissionId
              AND is_deleted = FALSE
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            command.TenantId,
            command.PermissionId,
            command.UpdatedBy
        }, cancellationToken: ct));

        return rows > 0;
    }

    public async Task<IReadOnlyList<NodePermissionViewDto>> ListPermissionsForNodeAsync(NodePermissionViewQuery query, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE ancestors AS (
                SELECT id, parent_id
                FROM curriculum_node
                WHERE tenant_id = @TenantId
                  AND id = @NodeId
                  AND is_deleted = FALSE

                UNION ALL

                SELECT p.id, p.parent_id
                FROM curriculum_node p
                JOIN ancestors a ON a.parent_id = p.id
                WHERE p.tenant_id = @TenantId
                  AND p.is_deleted = FALSE
            )
            SELECT cp.id AS Id,
                   cp.curriculum_node_id AS SourceNodeId,
                   (cp.curriculum_node_id <> @NodeId) AS IsInherited,
                   cp.school_id AS SchoolId,
                   cp.can_view AS CanView,
                   cp.can_download AS CanDownload,
                   cp.can_comment AS CanComment,
                   cp.created_at AS CreatedAt,
                   cp.updated_at AS UpdatedAt
            FROM content_permission cp
            JOIN ancestors a ON a.id = cp.curriculum_node_id
            WHERE cp.tenant_id = @TenantId
              AND cp.is_deleted = FALSE
            ORDER BY IsInherited ASC, cp.updated_at DESC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<NodePermissionViewDto>(
            new CommandDefinition(sql, new { query.TenantId, query.NodeId }, cancellationToken: ct));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<NodePermissionsViewDto>> ListPermissionsForNodesAsync(NodePermissionsViewQuery query, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE selected_nodes AS (
                SELECT unnest(@NodeIds::uuid[]) AS selected_node_id
            ),
            ancestors AS (
                SELECT cn.id AS node_id,
                       cn.parent_id,
                       sn.selected_node_id
                FROM curriculum_node cn
                JOIN selected_nodes sn ON cn.id = sn.selected_node_id
                WHERE cn.tenant_id = @TenantId
                  AND cn.is_deleted = FALSE

                UNION ALL

                SELECT cn.id AS node_id,
                       cn.parent_id,
                       a.selected_node_id
                FROM curriculum_node cn
                JOIN ancestors a ON cn.id = a.parent_id
                WHERE cn.tenant_id = @TenantId
                  AND cn.is_deleted = FALSE
            )
            SELECT a.selected_node_id AS NodeId,
                   cp.id AS Id,
                   cp.curriculum_node_id AS SourceNodeId,
                   (cp.curriculum_node_id <> a.selected_node_id) AS IsInherited,
                   cp.school_id AS SchoolId,
                   cp.can_view AS CanView,
                   cp.can_download AS CanDownload,
                   cp.can_comment AS CanComment,
                   cp.created_at AS CreatedAt,
                   cp.updated_at AS UpdatedAt
            FROM content_permission cp
            JOIN ancestors a ON a.node_id = cp.curriculum_node_id
            WHERE cp.tenant_id = @TenantId
              AND cp.is_deleted = FALSE
            ORDER BY a.selected_node_id, IsInherited ASC, cp.updated_at DESC
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<NodePermissionsViewRow>(
            new CommandDefinition(sql, new { query.TenantId, query.NodeIds }, cancellationToken: ct));

        return rows
            .GroupBy(row => row.NodeId)
            .Select(group => new NodePermissionsViewDto(
                group.Key,
                group.Select(row => new NodePermissionDetailDto(
                    row.Id,
                    row.SourceNodeId,
                    row.IsInherited,
                    row.SchoolId,
                    row.CanView,
                    row.CanDownload,
                    row.CanComment,
                    row.CreatedAt,
                    row.UpdatedAt))
                    .ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<UserEffectiveNodePermissionDto>> ListEffectivePermissionsForUserAsync(UserEffectivePermissionsQuery query, CancellationToken ct = default)
    {
        const string sql = """
            WITH RECURSIVE user_school AS (
                SELECT home_school_id AS school_id
                FROM user_account
                WHERE id = @UserId
                  AND is_deleted = FALSE
            ),
            ancestors AS (
                SELECT cn.id AS node_id,
                       cn.id AS selected_node_id,
                       cn.parent_id
                FROM curriculum_node cn
                WHERE cn.tenant_id = @TenantId
                  AND cn.is_deleted = FALSE

                UNION ALL

                SELECT cn.id AS node_id,
                       a.selected_node_id,
                       cn.parent_id
                FROM curriculum_node cn
                JOIN ancestors a ON cn.id = a.parent_id
                WHERE cn.tenant_id = @TenantId
                  AND cn.is_deleted = FALSE
            ),
            matching_permissions AS (
                SELECT cp.*
                FROM content_permission cp
                WHERE cp.tenant_id = @TenantId
                  AND cp.is_deleted = FALSE
                  AND cp.user_id = @UserId

                UNION ALL

                SELECT cp.*
                FROM content_permission cp
                JOIN user_school us ON cp.school_id = us.school_id
                WHERE cp.tenant_id = @TenantId
                  AND cp.is_deleted = FALSE
                  AND cp.user_id IS NULL
                  AND cp.school_id IS NOT NULL
            )
            SELECT a.selected_node_id AS CurriculumNodeId,
                   BOOL_OR(mp.can_view) AS CanView,
                   BOOL_OR(mp.can_download) AS CanDownload,
                   BOOL_OR(mp.can_comment) AS CanComment
            FROM ancestors a
            JOIN matching_permissions mp ON mp.curriculum_node_id = a.node_id
            GROUP BY a.selected_node_id
            ORDER BY a.selected_node_id
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        var rows = await conn.QueryAsync<UserEffectiveNodePermissionDto>(
            new CommandDefinition(sql, new { query.TenantId, query.UserId }, cancellationToken: ct));
        return rows.AsList();
    }

    private sealed record NodePermissionsViewRow(
        Guid NodeId,
        Guid Id,
        Guid SourceNodeId,
        bool IsInherited,
        Guid? SchoolId,
        bool CanView,
        bool CanDownload,
        bool CanComment,
        DateTime CreatedAt,
        DateTime UpdatedAt);
}
