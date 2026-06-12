namespace Aig.Lms.Modules.Schools.Domain;

public sealed class School
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? TaxId { get; init; }
    public string? Province { get; init; }
    public string? District { get; init; }
    public string? Address { get; init; }
    public string? ContactName { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public DateOnly? ContractStartDate { get; init; }
    public DateOnly? ContractEndDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
}
