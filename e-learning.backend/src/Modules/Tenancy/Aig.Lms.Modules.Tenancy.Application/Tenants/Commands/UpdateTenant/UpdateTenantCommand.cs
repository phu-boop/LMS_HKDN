namespace Aig.Lms.Modules.Tenancy.Application.Tenants.Commands.UpdateTenant;

public sealed record UpdateTenantCommand(
    Guid Id,
    string Name,
    string Code,
    string Subdomain,
    string? LogoUrl,
    string? AvatarUrl,
    string? Description,
    string? WatermarkSettings);

public sealed record UpdateTenantResult(
    Guid TenantId,
    string Code,
    string Name,
    string Subdomain,
    string? LogoUrl,
    string? AvatarUrl,
    string? Description,
    string? WatermarkSettings,
    string Status);