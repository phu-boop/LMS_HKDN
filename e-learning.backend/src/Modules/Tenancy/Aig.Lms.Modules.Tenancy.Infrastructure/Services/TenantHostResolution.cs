namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public sealed record TenantHostResolution(
    string Host,
    string? Subdomain,
    bool IsAdminDomain,
    bool IsLocalHost,
    bool IsResolvable);