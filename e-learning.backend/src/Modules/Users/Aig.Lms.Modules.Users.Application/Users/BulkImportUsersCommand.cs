namespace Aig.Lms.Modules.Users.Application.Users;

/// <summary>A single row parsed from the Excel import file.</summary>
public sealed record ImportUserRow(
    int RowNumber,
    string? Username,
    string? Password,
    string? FullName,
    string? Email,
    string? AvatarUrl,
    string? RoleCode);

public sealed record BulkImportUsersCommand(
    IReadOnlyList<ImportUserRow> Rows,
    Guid SchoolId,
    Guid? TenantId = null,
    Guid? ActorUserId = null,
    string? IpAddress = null,
    string? UserAgent = null);

public sealed record BulkImportUsersResult(
    int TotalRows,
    int SuccessCount,
    int FailureCount,
    IReadOnlyList<BulkImportRowResult> Rows);

public sealed record BulkImportRowResult(
    int RowNumber,
    bool Success,
    string? Username,
    string? Error);
