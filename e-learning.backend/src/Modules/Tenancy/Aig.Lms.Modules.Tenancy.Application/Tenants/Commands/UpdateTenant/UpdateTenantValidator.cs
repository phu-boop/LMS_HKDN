using System.Text.Json;

namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;

public sealed class UpdateTenantValidator
{
    public UpdateTenantValidationResult Validate(UpdateTenantCommand command)
    {
        var errors = new List<string>();

        if (command.Id == Guid.Empty)
            errors.Add("Id is required.");

        if (string.IsNullOrWhiteSpace(command.Name))
            errors.Add("Name is required.");
        else if (command.Name.Trim().Length > 255)
            errors.Add("Name must not exceed 255 characters.");

        if (string.IsNullOrWhiteSpace(command.Code))
            errors.Add("Code is required.");

        if (string.IsNullOrWhiteSpace(command.Subdomain))
            errors.Add("Subdomain is required.");

        if (!string.IsNullOrWhiteSpace(command.WatermarkSettings))
        {
            try
            {
                JsonDocument.Parse(command.WatermarkSettings);
            }
            catch (JsonException)
            {
                errors.Add("WatermarkSettings must be valid JSON.");
            }
        }

        return new UpdateTenantValidationResult(errors);
    }
}

public sealed record UpdateTenantValidationResult(IReadOnlyList<string> Errors)
{
    public bool IsValid => Errors.Count == 0;
}