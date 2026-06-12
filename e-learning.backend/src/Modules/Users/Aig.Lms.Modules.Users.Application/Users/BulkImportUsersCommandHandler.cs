using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Aig.Lms.Modules.Users.Domain;

namespace Aig.Lms.Modules.Users.Application.Users;

public sealed class BulkImportUsersCommandHandler
{
    private readonly IUsersRepository _repository;
    private readonly IUserRoleAssignmentService _roleAssignment;
    private readonly IAuditLogService _auditLog;

    public BulkImportUsersCommandHandler(
        IUsersRepository repository,
        IUserRoleAssignmentService roleAssignment,
        IAuditLogService auditLog)
    {
        _repository     = repository;
        _roleAssignment = roleAssignment;
        _auditLog       = auditLog;
    }

    public async Task<BulkImportUsersResult> HandleAsync(BulkImportUsersCommand command, CancellationToken ct = default)
    {
        var results = new List<BulkImportRowResult>(command.Rows.Count);
        int successCount = 0;

        foreach (var row in command.Rows)
        {
            var error = Validate(row);
            if (error is not null)
            {
                results.Add(new BulkImportRowResult(row.RowNumber, false, row.Username, error));
                continue;
            }

            try
            {
                // Duplicate check
                var exists = await _repository.ExistsAsync(command.SchoolId, row.Username!, ct);
                if (exists)
                {
                    results.Add(new BulkImportRowResult(row.RowNumber, false, row.Username,
                        $"Username '{row.Username}' already exists in this school."));
                    continue;
                }

                var user = new User
                {
                    Id          = Guid.NewGuid(),
                    SchoolId    = command.SchoolId,
                    Username    = row.Username!,
                    Email       = row.Email,
                    FullName    = row.FullName!,
                    AvatarUrl   = row.AvatarUrl,
                    AccountType = "SCHOOL",  // Default client account type for bulk import
                    Status      = "ACTIVE"
                };

                var passwordHash = BCrypt.Net.BCrypt.HashPassword(row.Password!);
                await _repository.CreateAsync(user, passwordHash, ct);

                // Assign role if provided
                if (!string.IsNullOrWhiteSpace(row.RoleCode) && command.TenantId.HasValue)
                {
                    await _roleAssignment.AssignRoleByCodeAsync(
                        user.Id, row.RoleCode, command.TenantId.Value, ct);
                }

                // Auto-inherit client role for all active tenants from school contracts
                await _roleAssignment.InheritSchoolTenantsAsync(
                    user.Id, command.SchoolId, user.AccountType, ct);

                // Audit log per-user
                await _auditLog.LogAsync(new AuditLogEntry(
                    Action:      "USER_CREATED",
                    EntityType:  "user_account",
                    EntityId:    user.Id,
                    TenantId:    command.TenantId,
                    SchoolId:    command.SchoolId,
                    ActorUserId: command.ActorUserId,
                    IpAddress:   command.IpAddress,
                    UserAgent:   command.UserAgent,
                    Metadata:    "{\"source\":\"bulk_import\"}"), ct);

                results.Add(new BulkImportRowResult(row.RowNumber, true, user.Username, null));
                successCount++;
            }
            catch (Exception ex)
            {
                results.Add(new BulkImportRowResult(row.RowNumber, false, row.Username, ex.Message));
            }
        }

        return new BulkImportUsersResult(
            TotalRows:    command.Rows.Count,
            SuccessCount: successCount,
            FailureCount: command.Rows.Count - successCount,
            Rows:         results);
    }

    private static string? Validate(ImportUserRow row)
    {
        if (string.IsNullOrWhiteSpace(row.Username))
            return "Username is required.";
        if (string.IsNullOrWhiteSpace(row.Password))
            return "Password is required.";
        if (string.IsNullOrWhiteSpace(row.FullName))
            return "FullName is required.";
        if (row.Username.Length > 100)
            return "Username must not exceed 100 characters.";
        return null;
    }
}
