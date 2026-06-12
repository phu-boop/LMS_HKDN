namespace Aig.Lms.Api.Endpoints;

public sealed record TenantContentCommentDetailResponse(
    Guid CommentId,
    Guid ContentItemId,
    string? ContentTitle,
    Guid? SchoolId,
    string? SchoolName,
    IReadOnlyList<ContentCommentResponse> Comments);
