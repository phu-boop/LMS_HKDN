// ----------------------------------------------------------------------
import Cookies from 'js-cookie';

// Define
const TOKEN_NAME = 'elearning.auth.accessToken.v2';
const REFRESH_NAME = '_w.rt.v2';
const LEGACY_TOKEN_NAME = 'elearning.auth.accessToken';
const LEGACY_REFRESH_NAME = '_w.rt';

// ----------------------------------------------------------------------

/**
 * Cookie domain scoped to root domain so all subdomains share the same token.
 * - Local:      .lvh.me or configured local root host
 * - Production: .daihoc.io.vn  (derived from NEXT_PUBLIC_ROOT_DOMAIN)
 */
function cookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  const localRootHost = (process.env.NEXT_PUBLIC_LOCAL_ROOT_HOST || '').trim().toLowerCase();

  if (localRootHost && (hostname.toLowerCase() === localRootHost || hostname.toLowerCase().endsWith(`.${localRootHost}`))) {
    return `.${localRootHost}`;
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return undefined;

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (!root || root === 'localhost') return undefined;

  return `.${root}`;
}

// Cookies
export const saveRefreshToken = (token: string, exp?: number): void => {
  const date = new Date();
  exp = exp || 7;
  const domain = cookieDomain();

  // Cleanup old keys first to avoid duplicate-name collisions across old/new auth schemes.
  Cookies.remove(LEGACY_REFRESH_NAME, { path: '/', domain });
  Cookies.remove(LEGACY_REFRESH_NAME, { path: '/' });

  Cookies.set(REFRESH_NAME, token, {
    expires: new Date(date.setDate(date.getDate() + exp)),
    path: '/',
    sameSite: 'lax',
    domain,
  });
};
export const getRefreshToken = (): string | undefined =>
  Cookies.get(REFRESH_NAME) ?? Cookies.get(LEGACY_REFRESH_NAME);
export const removeRefreshToken = (): void => {
  Cookies.remove(REFRESH_NAME, { path: '/', domain: cookieDomain() });
  Cookies.remove(REFRESH_NAME, { path: '/' });
  Cookies.remove(LEGACY_REFRESH_NAME, { path: '/', domain: cookieDomain() });
  Cookies.remove(LEGACY_REFRESH_NAME, { path: '/' });
};

export const saveToken = (token: string, exp?: number): void => {
  const date = new Date();
  exp = exp || 1;
  const domain = cookieDomain();

  // Cleanup old keys first to avoid duplicate-name collisions across old/new auth schemes.
  Cookies.remove(LEGACY_TOKEN_NAME, { path: '/', domain });
  Cookies.remove(LEGACY_TOKEN_NAME, { path: '/' });

  Cookies.set(TOKEN_NAME, token, {
    expires: new Date(date.setDate(date.getDate() + exp)),
    path: '/',
    sameSite: 'lax',
    domain,
  });
};
export const getToken = (): string | undefined =>
  Cookies.get(TOKEN_NAME) ?? Cookies.get(LEGACY_TOKEN_NAME);
export const removeToken = (): void => {
  Cookies.remove(TOKEN_NAME, { path: '/', domain: cookieDomain() });
  Cookies.remove(TOKEN_NAME, { path: '/' });
  Cookies.remove(LEGACY_TOKEN_NAME, { path: '/', domain: cookieDomain() });
  Cookies.remove(LEGACY_TOKEN_NAME, { path: '/' });
};

// returnTo helpers
const RETURN_TO_NAME = 'returnTo';
export const saveReturnTo = (url: string): void => {
  Cookies.set(RETURN_TO_NAME, url, {
    path: '/',
    domain: cookieDomain(),
    expires: 1 / 24, // 1 hour
  });
};
export const getReturnTo = (): string | undefined => Cookies.get(RETURN_TO_NAME);
export const removeReturnTo = (): void => {
  Cookies.remove(RETURN_TO_NAME, { path: '/', domain: cookieDomain() });
  Cookies.remove(RETURN_TO_NAME, { path: '/' });
};

// ----------------------------------------------------------------------
