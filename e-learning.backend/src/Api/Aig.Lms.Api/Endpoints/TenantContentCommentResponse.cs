namespace Aig.Lms.Api.Endpoints;

public sealed record TenantContentCommentResponse(
    Guid Id,
    Guid ContentItemId,
    Guid UserId,
    string? AuthorName,
    string? AvatarUrl,
    Guid? ParentId,
    string? Body,
    bool IsDeleted,
    bool IsDeletedByAdmin,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsPublic,
    bool IsAdmin,
    bool IsEdited,
    bool IsPinned,
    Guid? SchoolId,
    string? ContentTitle,
    string? SchoolName);
