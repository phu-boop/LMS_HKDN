namespace Aig.Lms.Modules.Schools.Application;

public sealed record CreateSchoolCommand(
    string Code,
    string Name,
    string? TaxId = null,
    string? Province = null,
    string? District = null,
    string? Address = null,
    string? ContactName = null,
    string? ContactEmail = null,
    string? ContactPhone = null,
    DateOnly? ContractStartDate = null,
    DateOnly? ContractEndDate = null);

public sealed record CreateSchoolResult(Guid SchoolId, string Code, string Name);
