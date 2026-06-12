namespace Aig.Lms.Modules.Authorization.Domain;

public sealed class Permission
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Module { get; init; } = string.Empty;
    public string? Description { get; init; }
}
