namespace Aig.Lms.Modules.Schools.Application;

public sealed record UpdateSchoolCommand(
    Guid SchoolId,
    string Name,
    string? TaxId,
    string? Province,
    string? District,
    string? Address,
    string? ContactName,
    string? ContactEmail,
    string? ContactPhone,
    DateOnly? ContractStartDate,
    DateOnly? ContractEndDate);

public sealed record UpdateSchoolResult(
    Guid SchoolId,
    string Code,
    string Name,
    string? TaxId,
    string? Province,
    string? District,
    string? Address,
    string? ContactName,
    string? ContactEmail,
    string? ContactPhone,
    DateOnly? ContractStartDate,
    DateOnly? ContractEndDate,
    string Status);
