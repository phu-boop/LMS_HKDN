namespace Aig.Lms.Api.Endpoints;

public sealed record ContentCommentResponse(
    Guid Id,
    Guid ContentItemId,
    Guid UserId,
    string? AuthorName,
    string? AvatarUrl,
    Guid? ParentId,
    string? Body,
    bool IsDeletedByAdmin,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsPublic,
    bool IsAdmin,
    bool IsEdited,
    bool IsPinned,
    Guid? SchoolId);
