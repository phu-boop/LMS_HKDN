function configuredLocalRootHost(): string {
  return (process.env.NEXT_PUBLIC_LOCAL_ROOT_HOST || 'localhost').trim().toLowerCase();
}

function configuredRootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').trim().toLowerCase();
}

function isAllowedReturnToHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  const localRootHost = configuredLocalRootHost();
  const rootDomain = configuredRootDomain();

  if (h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '::1') {
    return true;
  }

  if (localRootHost && (h === localRootHost || h.endsWith(`.${localRootHost}`))) {
    return true;
  }

  if (
    rootDomain &&
    rootDomain !== 'localhost' &&
    (h === rootDomain || h.endsWith(`.${rootDomain}`))
  ) {
    return true;
  }

  return false;
}

/**
 * Resolve and validate `returnTo` to avoid open redirects.
 * Accepts:
 * - absolute same-ecosystem URLs (local root host or configured root domain)
 * - relative paths (resolved against current origin)
 */
export function resolveSafeReturnTo(rawReturnTo?: string | null): string | null {
  if (!rawReturnTo || typeof window === 'undefined') return null;

  const value = rawReturnTo.trim();
  if (!value) return null;

  try {
    if (value.startsWith('/')) {
      return `${window.location.origin}${value}`;
    }

    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    if (!isAllowedReturnToHost(parsed.hostname)) return null;

    const localRootHost = configuredLocalRootHost();
    const isConfiguredLocal =
      localRootHost &&
      (parsed.hostname.toLowerCase() === localRootHost ||
        parsed.hostname.toLowerCase().endsWith(`.${localRootHost}`));

    // Local dev subdomains don't terminate TLS, always downgrade to HTTP.
    if (isConfiguredLocal && parsed.protocol.toLowerCase() === 'https:') {
      parsed.protocol = 'http:';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
