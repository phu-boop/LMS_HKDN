using Aig.Lms.Modules.Tenancy.Domain.Entities;
using Aig.Lms.Modules.Tenancy.Domain.Repositories;
using Aig.Lms.Modules.Tenancy.Domain.Services;

namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.CreateTenant;

public sealed class CreateTenantHandler
{
    private readonly ITenantRepository _tenantRepository;
    private readonly SubdomainPolicy _subdomainPolicy;

    public CreateTenantHandler(
        ITenantRepository tenantRepository,
        SubdomainPolicy subdomainPolicy)
    {
        _tenantRepository = tenantRepository;
        _subdomainPolicy = subdomainPolicy;
    }

    public async Task<CreateTenantResult> HandleAsync(
        CreateTenantCommand command,
        CancellationToken ct = default)
    {
        var validator = new CreateTenantValidator();
        var validation = validator.Validate(command);
        if (!validation.IsValid)
            throw new InvalidOperationException(string.Join("; ", validation.Errors));

        if (_subdomainPolicy.IsReserved(command.Subdomain))
            throw new InvalidOperationException($"Subdomain '{command.Subdomain}' is reserved.");

        if (await _tenantRepository.ExistsByCodeAsync(command.Code, ct: ct))
            throw new InvalidOperationException(
                $"A tenant with code '{command.Code.ToUpperInvariant()}' already exists.");

        if (await _tenantRepository.ExistsBySubdomainAsync(command.Subdomain, ct: ct))
            throw new InvalidOperationException(
                $"A tenant with subdomain '{command.Subdomain.ToLowerInvariant()}' already exists.");

        var tenant = Tenant.Create(
            command.Name,
            command.Code,
            command.Subdomain,
            command.LogoUrl,
            command.AvatarUrl,
            command.Description,
            command.WatermarkSettings);

        await _tenantRepository.AddAsync(tenant, ct);

        return new CreateTenantResult(
            tenant.Id,
            tenant.Code.Value,
            tenant.Subdomain.Value,
            tenant.Status);
    }
}