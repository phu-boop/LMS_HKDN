using Aig.Lms.Modules.Schools.Domain;

namespace Aig.Lms.Modules.Schools.Application;

public interface ISchoolRepository
{
    // ── Schools ──────────────────────────────────────────────────────────────
    Task<bool> CodeExistsAsync(string code, CancellationToken ct = default);
    Task<bool> SchoolExistsAsync(Guid id, CancellationToken ct = default);
    Task CreateAsync(School school, CancellationToken ct = default);
    Task<School?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<School>> ListAsync(int page, int pageSize, string? status, string? search, CancellationToken ct = default);
    Task<IReadOnlyList<School>> ListAsync(int page, int pageSize, string? status, string? search, Guid? tenantId, CancellationToken ct = default);
    Task<int> CountAsync(string? status, string? search, CancellationToken ct = default);
    Task<int> CountAsync(string? status, string? search, Guid? tenantId, CancellationToken ct = default);
    Task<UpdateSchoolResult?> UpdateAsync(UpdateSchoolCommand command, CancellationToken ct = default);
    Task<bool> ChangeStatusAsync(Guid id, string status, CancellationToken ct = default);

    // ── Subscriptions (school_tenant_mapping) ─────────────────────────────────
    Task<IReadOnlyList<SubscriptionDto>> ListSubscriptionsAsync(Guid schoolId, CancellationToken ct = default);
    Task<IReadOnlyList<SubscriptionDto>> ListSubscriptionsAsync(Guid? schoolId, Guid? tenantId, string? status, IReadOnlyList<Guid>? allowedTenantIds, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountSubscriptionsAsync(Guid? schoolId, Guid? tenantId, string? status, IReadOnlyList<Guid>? allowedTenantIds, CancellationToken ct = default);
    Task<int> CountSubscriptionsExpiringSoonAsync(Guid tenantId, DateTime currentTime, DateTime threshold, CancellationToken ct = default);
    Task<IReadOnlyList<Guid>> GetTenantAdminTenantIdsAsync(Guid userId, CancellationToken ct = default);
    Task<bool> SubscriptionExistsAsync(Guid schoolId, Guid tenantId, Guid? excludeId, CancellationToken ct = default);
    Task CreateSubscriptionAsync(SchoolSubscription subscription, CancellationToken ct = default);
    Task<UpdateSubscriptionResult?> UpdateSubscriptionAsync(UpdateSubscriptionCommand command, CancellationToken ct = default);
    Task<bool> DeleteSubscriptionAsync(Guid id, Guid schoolId, CancellationToken ct = default);
}
