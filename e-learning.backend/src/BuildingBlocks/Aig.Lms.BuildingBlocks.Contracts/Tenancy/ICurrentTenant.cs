namespace Aig.Lms.BuildingBlocks.Contracts.Tenancy;

public interface ICurrentTenant
{
    Guid? TenantId { get; }
    string? TenantCode { get; }
    string? Subdomain { get; }
    bool IsResolved { get; }
}
