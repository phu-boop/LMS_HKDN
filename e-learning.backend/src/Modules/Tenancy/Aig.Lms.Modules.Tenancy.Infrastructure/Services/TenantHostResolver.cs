namespace Aig.Lms.Modules.Tenancy.Infrastructure.Services;

public sealed class TenantHostResolver
{
    public TenancyOptions Options { get; }

    public TenantHostResolver(TenancyOptions options)
    {
        Options = options;
    }

    public TenantHostResolution Resolve(string? rawDomain)
    {
        var host = NormalizeHost(rawDomain);
        if (string.IsNullOrWhiteSpace(host))
            return new TenantHostResolution(string.Empty, null, false, false, false);

        if (Options.LocalHosts.Any(local => string.Equals(local, host, StringComparison.OrdinalIgnoreCase)))
            return new TenantHostResolution(host, null, false, true, false);

        if (Options.AdminDomains.Any(admin => string.Equals(admin, host, StringComparison.OrdinalIgnoreCase)))
            return new TenantHostResolution(host, Options.AdminSubdomain, true, false, true);

        if (!host.Contains('.'))
            return new TenantHostResolution(host, host, false, false, true);

        foreach (var baseDomain in Options.TenantBaseDomains)
        {
            var suffix = "." + baseDomain.ToLowerInvariant();
            if (!host.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
                continue;

            var prefix = host[..^suffix.Length];
            if (string.IsNullOrWhiteSpace(prefix) || prefix.Contains('.'))
                return new TenantHostResolution(host, null, false, false, false);

            return new TenantHostResolution(host, prefix, false, false, true);
        }

        return new TenantHostResolution(host, null, false, false, false);
    }

    public string BuildCanonicalDomain(string subdomain)
    {
        if (string.Equals(subdomain, Options.AdminSubdomain, StringComparison.OrdinalIgnoreCase) && Options.AdminDomains.Length > 0)
            return Options.AdminDomains[0];

        if (Options.TenantBaseDomains.Length == 0)
            return subdomain;

        return $"{subdomain}.{Options.TenantBaseDomains[0]}";
    }

    private static string NormalizeHost(string? rawDomain)
    {
        if (string.IsNullOrWhiteSpace(rawDomain))
            return string.Empty;

        var trimmed = rawDomain.Trim();

        // Accept full URL, host-only, and host:port input consistently.
        var uriCandidate = trimmed.Contains("://", StringComparison.Ordinal)
            ? trimmed
            : $"http://{trimmed}";

        if (Uri.TryCreate(uriCandidate, UriKind.Absolute, out var uri) && !string.IsNullOrWhiteSpace(uri.Host))
            trimmed = uri.Host;
        else if (trimmed.Contains(':'))
            trimmed = trimmed.Split(':', 2, StringSplitOptions.TrimEntries)[0];

        return trimmed.Trim().Trim('.').ToLowerInvariant();
    }
}