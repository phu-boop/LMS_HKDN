namespace Aig.Lms.Modules.Schools.Application;

public sealed class UpdateSchoolCommandHandler
{
    private readonly ISchoolRepository _repository;

    public UpdateSchoolCommandHandler(ISchoolRepository repository) => _repository = repository;

    public async Task<UpdateSchoolResult?> HandleAsync(UpdateSchoolCommand command, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
            throw new InvalidOperationException("School name is required.");
        if (command.Name.Trim().Length > 255)
            throw new InvalidOperationException("School name must not exceed 255 characters.");

        if (command.ContractStartDate.HasValue && command.ContractEndDate.HasValue
            && command.ContractEndDate.Value < command.ContractStartDate.Value)
            throw new InvalidOperationException("School contract end date must not be before start date.");

        return await _repository.UpdateAsync(command, ct);
    }
}
