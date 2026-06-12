import { ROOT_DOMAIN } from '@/config';

type BuildPortalUrlInput = {
  targetDomain?: string | null;
  fallbackSubdomain?: string | null;
  path: string;
};

function stripSchemeAndPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withScheme).host;
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
}

function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1' || h === '::1';
}

function configuredLocalRootHost(): string {
  return (process.env.NEXT_PUBLIC_LOCAL_ROOT_HOST || 'localhost').trim().toLowerCase();
}

function isConfiguredLocalHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  const localRootHost = configuredLocalRootHost();

  if (!localRootHost) return isLocalHost(normalizedHostname);

  return (
    isLocalHost(normalizedHostname) ||
    normalizedHostname === localRootHost ||
    normalizedHostname.endsWith(`.${localRootHost}`)
  );
}

function extractSubdomainFromDomain(host: string): string | null {
  const normalizedHost = stripSchemeAndPath(host).toLowerCase();
  const normalizedRoot = ROOT_DOMAIN.toLowerCase();

  if (!normalizedHost || !normalizedRoot) return null;

  if (normalizedHost === normalizedRoot) return null;
  if (normalizedHost.endsWith(`.${normalizedRoot}`)) {
    return normalizedHost.slice(0, -(normalizedRoot.length + 1));
  }

  const first = normalizedHost.split('.')[0];
  return first || null;
}

export function buildPortalUrl({
  targetDomain,
  fallbackSubdomain,
  path,
}: BuildPortalUrlInput): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;

  if (typeof window === 'undefined') return safePath;

  const protocol = window.location.protocol;
  const currentHost = window.location.host;
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port;

  const normalizedTargetHost = targetDomain ? stripSchemeAndPath(targetDomain) : '';

  if (isConfiguredLocalHost(currentHostname)) {
    // Local dev subdomains (e.g. *.lvh.me:8081) are served over HTTP only.
    // Keep redirects stable even if browser/current URL is accidentally HTTPS.
    const localProtocol = 'http:';
    const localRoot = configuredLocalRootHost();
    const localPort = process.env.NEXT_PUBLIC_LOCAL_PORT || currentPort;
    const localSubdomain =
      (fallbackSubdomain || '').trim() ||
      (normalizedTargetHost ? extractSubdomainFromDomain(normalizedTargetHost) : null) ||
      '';

    const localHost = localSubdomain ? `${localSubdomain}.${localRoot}` : localRoot;
    const portSegment = localPort ? `:${localPort}` : '';

    return `${localProtocol}//${localHost}${portSegment}${safePath}`;
  }

  if (!normalizedTargetHost || normalizedTargetHost === currentHost) {
    return `${protocol}//${currentHost}${safePath}`;
  }

  return `${protocol}//${normalizedTargetHost}${safePath}`;
}

/**
 * Robustly switches the subdomain of the current URL.
 * Example: lms-admin.localhost:3000 -> id.localhost:3000
 */
export function switchSubdomain(newSubdomain: string, path: string = ''): string {
  if (typeof window === 'undefined') return path;

  const { hostname, port, protocol } = window.location;
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const portSegment = port ? `:${port}` : '';

  // 1. Handle Localhost / Local Dev
  if (isConfiguredLocalHost(hostname)) {
    const localRoot = configuredLocalRootHost();
    const targetHost = newSubdomain ? `${newSubdomain}.${localRoot}` : localRoot;
    return `http://${targetHost}${portSegment}${safePath}`;
  }

  // 2. Handle Production with ROOT_DOMAIN
  const normalizedRoot = ROOT_DOMAIN.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
  const targetHost = newSubdomain ? `${newSubdomain}.${normalizedRoot}` : normalizedRoot;

  return `${protocol}//${targetHost}${portSegment}${safePath}`;
}
