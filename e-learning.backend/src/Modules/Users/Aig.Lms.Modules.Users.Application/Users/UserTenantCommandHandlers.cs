using Aig.Lms.BuildingBlocks.Application.Abstractions;

namespace Aig.Lms.Modules.Users.Application.Users;

// ---------------------------------------------------------------------------
// GetUserTenantsQueryHandler
// ---------------------------------------------------------------------------

public sealed class GetUserTenantsQueryHandler
{
    private readonly IUsersRepository _repository;

    public GetUserTenantsQueryHandler(IUsersRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<UserTenantDto>> HandleAsync(GetUserTenantsQuery query, CancellationToken ct = default)
        => _repository.GetUserTenantsAsync(query.UserId, ct);
}

// ---------------------------------------------------------------------------
// AssignUserTenantCommandHandler
// ---------------------------------------------------------------------------

public sealed class AssignUserTenantCommandHandler
{
    private readonly IUsersRepository   _repository;
    private readonly IAuditLogService   _auditLog;

    public AssignUserTenantCommandHandler(IUsersRepository repository, IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog   = auditLog;
    }

    public async Task<bool> HandleAsync(AssignUserTenantCommand command, CancellationToken ct = default)
    {
        var assigned = await _repository.AssignUserTenantAsync(command.UserId, command.TenantId, command.RoleCode, ct);

        if (assigned)
        {
            await _auditLog.LogAsync(new AuditLogEntry(
                Action:      "USER_TENANT_ASSIGNED",
                EntityType:  "user_tenant_role_assignment",
                EntityId:    command.UserId,
                TenantId:    command.TenantId,
                SchoolId:    null,
                ActorUserId: command.ActorUserId,
                IpAddress:   command.IpAddress,
                UserAgent:   command.UserAgent), ct);
        }

        return assigned;
    }
}

// ---------------------------------------------------------------------------
// RemoveUserTenantCommandHandler
// ---------------------------------------------------------------------------

public sealed class RemoveUserTenantCommandHandler
{
    private readonly IUsersRepository _repository;
    private readonly IAuditLogService _auditLog;

    public RemoveUserTenantCommandHandler(IUsersRepository repository, IAuditLogService auditLog)
    {
        _repository = repository;
        _auditLog   = auditLog;
    }

    public async Task<bool> HandleAsync(RemoveUserTenantCommand command, CancellationToken ct = default)
    {
        var removed = await _repository.RemoveUserTenantAsync(command.UserId, command.TenantId, ct);

        if (removed)
        {
            await _auditLog.LogAsync(new AuditLogEntry(
                Action:      "USER_TENANT_REMOVED",
                EntityType:  "user_tenant_role_assignment",
                EntityId:    command.UserId,
                TenantId:    command.TenantId,
                SchoolId:    null,
                ActorUserId: command.ActorUserId,
                IpAddress:   command.IpAddress,
                UserAgent:   command.UserAgent), ct);
        }

        return removed;
    }
}

// ---------------------------------------------------------------------------
// GetSchoolUsersQueryHandler  (2.7)
// ---------------------------------------------------------------------------

public sealed record GetSchoolUsersQuery(
    Guid    SchoolId,
    int     Page        = 1,
    int     PageSize    = 20,
    string? Status      = null,
    string? Search      = null,
    string? AccountType = null);

public sealed class GetSchoolUsersQueryHandler
{
    private readonly IUsersRepository _repository;

    public GetSchoolUsersQueryHandler(IUsersRepository repository)
    {
        _repository = repository;
    }

    public async Task<(IReadOnlyList<Aig.Lms.Modules.Users.Domain.User> Items, int Total)> HandleAsync(
        GetSchoolUsersQuery query, CancellationToken ct = default)
    {
        var items = await _repository.GetSchoolUsersAsync(
            query.SchoolId, query.Page, query.PageSize,
            query.Status, query.Search, query.AccountType, ct);

        var total = await _repository.CountSchoolUsersAsync(
            query.SchoolId, query.Status, query.Search, query.AccountType, ct);

        return (items, total);
    }
}

// ---------------------------------------------------------------------------
// GetTenantMembersQueryHandler
// ---------------------------------------------------------------------------

public sealed class GetTenantMembersQueryHandler
{
    private readonly IUsersRepository _repository;

    public GetTenantMembersQueryHandler(IUsersRepository repository)
    {
        _repository = repository;
    }

    public async Task<(IReadOnlyList<TenantMemberDto> Items, int Total)> HandleAsync(
        GetTenantMembersQuery query, CancellationToken ct = default)
    {
        var page     = query.Page     < 1   ? 1   : query.Page;
        var pageSize = query.PageSize < 1   ? 20  : query.PageSize > 100 ? 100 : query.PageSize;

        var items = await _repository.GetTenantMembersAsync(query.TenantId, query.Search, page, pageSize, ct);
        var total = await _repository.CountTenantMembersAsync(query.TenantId, query.Search, ct);

        return (items, total);
    }
}
