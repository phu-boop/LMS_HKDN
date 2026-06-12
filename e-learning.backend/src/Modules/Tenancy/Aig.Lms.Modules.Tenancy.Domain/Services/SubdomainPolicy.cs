namespace Aig.Lms.Modules.Tenancy.Domain.Services;

public sealed class SubdomainPolicy
{
    private static readonly IReadOnlySet<string> ReservedSubdomains =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "www", "mail", "api", "admin", "app", "static",
            "cdn", "assets", "ftp", "smtp", "pop", "imap"
        };

    public bool IsReserved(string subdomain) =>
        ReservedSubdomains.Contains(subdomain);
}