namespace Aig.Lms.Modules.Authorization.Domain;

public sealed class Role
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}
