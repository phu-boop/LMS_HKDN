using Aig.Lms.Modules.Schools.Domain;

namespace Aig.Lms.Modules.Schools.Application;

public sealed class CreateSchoolCommandHandler
{
    private readonly ISchoolRepository _repository;

    public CreateSchoolCommandHandler(ISchoolRepository repository) => _repository = repository;

    public async Task<CreateSchoolResult> HandleAsync(CreateSchoolCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Code))
            throw new InvalidOperationException("School code is required.");
        if (string.IsNullOrWhiteSpace(command.Name))
            throw new InvalidOperationException("School name is required.");
        if (command.Code.Trim().Length > 50)
            throw new InvalidOperationException("School code must not exceed 50 characters.");
        if (command.Name.Trim().Length > 255)
            throw new InvalidOperationException("School name must not exceed 255 characters.");

        if (command.ContractStartDate.HasValue && command.ContractEndDate.HasValue
            && command.ContractEndDate.Value < command.ContractStartDate.Value)
            throw new InvalidOperationException("School contract end date must not be before start date.");

        var code = command.Code.Trim().ToUpperInvariant();

        if (await _repository.CodeExistsAsync(code, ct))
            throw new InvalidOperationException($"School code '{code}' already exists.");

        var school = new School
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = command.Name.Trim(),
            TaxId = command.TaxId?.Trim(),
            Province = command.Province?.Trim(),
            District = command.District?.Trim(),
            Address = command.Address?.Trim(),
            ContactName = command.ContactName?.Trim(),
            ContactEmail = command.ContactEmail?.Trim(),
            ContactPhone = command.ContactPhone?.Trim(),
            ContractStartDate = command.ContractStartDate,
            ContractEndDate = command.ContractEndDate,
            Status = "ACTIVE"
        };

        await _repository.CreateAsync(school, ct);
        return new CreateSchoolResult(school.Id, school.Code, school.Name);
    }
}
