using Aig.Lms.Modules.Users.Domain;

namespace Aig.Lms.Modules.Users.Application.Users;

public interface IUsersRepository
{
    Task<bool> ExistsAsync(Guid? schoolId, string username, CancellationToken ct = default);
    Task CreateAsync(User user, string passwordHash, CancellationToken ct = default);
    Task<User?> GetByIdAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<User>> ListUsersAsync(Guid? schoolId, Guid? tenantId, Guid? roleId, int page, int pageSize, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default);
    Task<int> CountUsersAsync(Guid? schoolId, Guid? tenantId, Guid? roleId, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default);
    Task<UpdateUserResult?> UpdateAsync(UpdateUserCommand command, CancellationToken ct = default);
    Task<bool> ChangeStatusAsync(Guid userId, string status, CancellationToken ct = default);
    Task<bool> SoftDeleteAsync(Guid userId, CancellationToken ct = default);
    Task<bool> UpdateAvatarAsync(Guid userId, string avatarUrl, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(Guid userId, string passwordHash, CancellationToken ct = default);

    // 2.6 — User-Tenant management
    Task<IReadOnlyList<UserTenantDto>> GetUserTenantsAsync(Guid userId, CancellationToken ct = default);
    Task<bool> AssignUserTenantAsync(Guid userId, Guid tenantId, string roleCode, CancellationToken ct = default);
    Task<bool> RemoveUserTenantAsync(Guid userId, Guid tenantId, CancellationToken ct = default);

    // 2.7 — Users filtered by school
    Task<IReadOnlyList<User>> GetSchoolUsersAsync(Guid schoolId, int page, int pageSize, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default);
    Task<int> CountSchoolUsersAsync(Guid schoolId, string? status = null, string? search = null, string? accountType = null, CancellationToken ct = default);

    // Tenant members (user + role in one query)
    Task<IReadOnlyList<TenantMemberDto>> GetTenantMembersAsync(Guid tenantId, string? search, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountTenantMembersAsync(Guid tenantId, string? search, CancellationToken ct = default);
}
