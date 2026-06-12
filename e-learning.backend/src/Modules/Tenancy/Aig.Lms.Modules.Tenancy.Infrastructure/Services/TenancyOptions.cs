namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    public string AdminSubdomain { get; set; } = "admin";
    public string[] AdminDomains { get; set; } = ["id.daihoc.io.vn", "admin.daihoc.io.vn"];
    public string[] TenantBaseDomains { get; set; } = ["daihoc.io.vn"];
    public string[] LocalHosts { get; set; } = ["localhost", "127.0.0.1", "::1"];
}