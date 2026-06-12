using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Domain.Services;

namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;

public sealed class UpdateTenantHandler
{
    private readonly ITenantRepository _tenantRepository;
    private readonly SubdomainPolicy _subdomainPolicy;

    public UpdateTenantHandler(
        ITenantRepository tenantRepository,
        SubdomainPolicy subdomainPolicy)
    {
        _tenantRepository = tenantRepository;
        _subdomainPolicy = subdomainPolicy;
    }

    public async Task<UpdateTenantResult> HandleAsync(
        UpdateTenantCommand command,
        CancellationToken ct = default)
    {
        var validator = new UpdateTenantValidator();
        var validation = validator.Validate(command);
        if (!validation.IsValid)
            throw new InvalidOperationException(string.Join("; ", validation.Errors));

        if (_subdomainPolicy.IsReserved(command.Subdomain))
            throw new InvalidOperationException($"Subdomain '{command.Subdomain}' is reserved.");

        var tenant = await _tenantRepository.GetByIdAsync(command.Id, ct)
            ?? throw new InvalidOperationException($"Tenant with id '{command.Id}' not found.");

        if (await _tenantRepository.ExistsByCodeAsync(command.Code, command.Id, ct))
            throw new InvalidOperationException(
                $"A tenant with code '{command.Code.ToUpperInvariant()}' already exists.");

        if (await _tenantRepository.ExistsBySubdomainAsync(command.Subdomain, command.Id, ct))
            throw new InvalidOperationException(
                $"A tenant with subdomain '{command.Subdomain.ToLowerInvariant()}' already exists.");

        tenant.UpdateDetails(
            command.Name,
            command.Code,
            command.Subdomain,
            command.LogoUrl,
            command.AvatarUrl,
            command.Description,
            command.WatermarkSettings);

        await _tenantRepository.UpdateAsync(tenant, ct);

        return new UpdateTenantResult(
            tenant.Id,
            tenant.Code.Value,
            tenant.Name,
            tenant.Subdomain.Value,
            tenant.LogoUrl,
            tenant.AvatarUrl,
            tenant.Description,
            tenant.WatermarkSettings,
            tenant.Status);
    }
}