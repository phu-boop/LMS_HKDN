using Aig.Lms.Modules.ContentManagement.Application.Curriculum;

namespace Aig.Lms.Modules.ContentManagement.Application.Permissions;

public sealed class ListContentPermissionsQueryHandler(IContentManagementRepository repository)
{
    public Task<IReadOnlyList<ContentPermissionDto>> HandleAsync(ListContentPermissionsQuery query, CancellationToken ct = default)
        => repository.ListContentPermissionsAsync(query, ct);
}

public sealed class GrantContentPermissionCommandHandler(IContentManagementRepository repository)
{
    public async Task<GrantContentPermissionResult> HandleAsync(GrantContentPermissionCommand command, CancellationToken ct = default)
    {
        if (!command.SchoolId.HasValue && !command.UserId.HasValue)
            throw new InvalidOperationException("Either schoolId or userId must be provided.");

        if (command.SchoolId.HasValue && command.UserId.HasValue)
            throw new InvalidOperationException("Only one grantee is allowed: schoolId or userId.");

        if (!command.CanView && !command.CanDownload && !command.CanComment)
            throw new InvalidOperationException("At least one permission must be granted.");

        var node = await repository.GetNodeAsync(command.TenantId, command.CurriculumNodeId, ct);
        if (node is null)
            throw new InvalidOperationException("Curriculum node not found.");

        if (command.SchoolId.HasValue)
        {
            var schoolExists = await repository.SchoolBelongsToTenantAsync(command.TenantId, command.SchoolId.Value, ct);
            if (!schoolExists)
                throw new InvalidOperationException("School does not belong to tenant.");
        }

        if (command.UserId.HasValue)
        {
            var userExists = await repository.UserBelongsToTenantAsync(command.TenantId, command.UserId.Value, ct);
            if (!userExists)
                throw new InvalidOperationException("User does not belong to tenant.");
        }

        return await repository.UpsertContentPermissionAsync(command, ct);
    }
}

public sealed class DeleteContentPermissionCommandHandler(IContentManagementRepository repository)
{
    public Task<bool> HandleAsync(DeleteContentPermissionCommand command, CancellationToken ct = default)
        => repository.DeleteContentPermissionAsync(command, ct);
}

public sealed class NodePermissionViewQueryHandler(IContentManagementRepository repository)
{
    public async Task<IReadOnlyList<NodePermissionViewDto>> HandleAsync(NodePermissionViewQuery query, CancellationToken ct = default)
    {
        var node = await repository.GetNodeAsync(query.TenantId, query.NodeId, ct);
        if (node is null)
            throw new InvalidOperationException("Curriculum node not found.");

        return await repository.ListPermissionsForNodeAsync(query, ct);
    }
}

public sealed class NodePermissionsViewQueryHandler(IContentManagementRepository repository)
{
    public async Task<IReadOnlyList<NodePermissionsViewDto>> HandleAsync(NodePermissionsViewQuery query, CancellationToken ct = default)
    {
        if (query.NodeIds is null || query.NodeIds.Length == 0)
            throw new InvalidOperationException("At least one nodeId must be provided.");

        foreach (var nodeId in query.NodeIds)
        {
            var node = await repository.GetNodeAsync(query.TenantId, nodeId, ct);
            if (node is null)
                throw new InvalidOperationException($"Curriculum node not found: {nodeId}.");
        }

        return await repository.ListPermissionsForNodesAsync(query, ct);
    }
}

public sealed class UserEffectivePermissionsQueryHandler(IContentManagementRepository repository)
{
    public async Task<IReadOnlyList<UserEffectiveNodePermissionDto>> HandleAsync(UserEffectivePermissionsQuery query, CancellationToken ct = default)
    {
        var userExists = await repository.UserBelongsToTenantAsync(query.TenantId, query.UserId, ct);
        if (!userExists)
            throw new InvalidOperationException("User does not belong to tenant.");

        return await repository.ListEffectivePermissionsForUserAsync(query, ct);
    }
}
