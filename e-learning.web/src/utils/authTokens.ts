import jwtDecode from 'jwt-decode';
// @types
import type { AuthUser } from '../@types/auth';
import buildAuthenticatedUser from './buildAuthenticatedUser';
import { pickPrimaryJwtRole } from './roleLanding';

// ----------------------------------------------------------------------

type JwtClaims = {
  sub?: string;
  email?: string;
  name?: string;
  unique_name?: string;
  full_name?: string;
  jti?: string;
  tenant_id?: string;
  school_id?: string;
  subdomain?: string;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  exp?: number;
  iss?: string;
  aud?: string;
};

function deepCloneRecord(source: Record<string, any>): Record<string, any> {
  if (typeof structuredClone === 'function') {
    return structuredClone(source);
  }
  return JSON.parse(JSON.stringify(source));
}

/** Parse access / refresh from common JSON shapes (camelCase or snake_case). */
export function extractAuthTokens(data: unknown): { accessToken: string; refreshToken?: string } {
  const d = data as Record<string, unknown> | null;
  if (!d || typeof d !== 'object') {
    throw new Error('Invalid login response body');
  }
  const access = (d.accessToken as string) ?? (d.access_token as string) ?? (d.token as string);
  if (!access || typeof access !== 'string') {
    throw new Error('Login response missing access token');
  }
  const refresh = (d.refreshToken as string) ?? (d.refresh_token as string) ?? undefined;
  return { accessToken: access, refreshToken: refresh };
}

/** User from response body or JWT decode fallback */
export function resolveAuthUser(data: unknown, accessToken: string): AuthUser {
  const d = data as Record<string, any> | null;
  const nested = d?.data as Record<string, any> | undefined;
  const raw =
    (d?.user as Record<string, any>) ??
    (nested?.user as Record<string, any>) ??
    (typeof nested === 'object' && nested && 'id' in nested ? nested : undefined);

  if (raw && typeof raw === 'object') {
    const rawCloned = deepCloneRecord(raw);
    const mapped = buildAuthenticatedUser({
      ...rawCloned,
      id: rawCloned.id ?? rawCloned.userId ?? rawCloned.sub,
      email: rawCloned.email ?? '',
      role: pickPrimaryJwtRole(
        rawCloned.role ?? rawCloned['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      ),
      photoURL: rawCloned.photoURL ?? rawCloned.avatarUrl ?? null,
      username: rawCloned.username,
      tenantId: rawCloned.tenantId,
      schoolId: rawCloned.schoolId,
      subdomain: rawCloned.subdomain,
      jti: rawCloned.jti,
      exp: rawCloned.exp,
      iss: rawCloned.iss,
      aud: rawCloned.aud,
    });
    return mapped;
  }

  return userFromAccessToken(accessToken);
}

/** Combined token + user parse for login/register */
export function parseLoginResponse(data: unknown) {
  const { accessToken, refreshToken } = extractAuthTokens(data);
  const user = resolveAuthUser(data, accessToken);
  return { accessToken, refreshToken, user };
}

export function userFromAccessToken(accessToken: string): AuthUser {
  try {
    const decoded = jwtDecode<JwtClaims>(accessToken);
    const role = pickPrimaryJwtRole(
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? decoded.role
    );

    return buildAuthenticatedUser({
      ...decoded,
      id: decoded.sub,
      email: decoded.email ?? '',
      displayName: decoded.full_name ?? decoded.name ?? decoded.email ?? '',
      role,
      tenantId: decoded.tenant_id,
      schoolId: decoded.school_id,
      subdomain: decoded.subdomain ?? (decoded as any).tenantSubdomain,
      username: decoded.unique_name,
      jti: decoded.jti,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: decoded.aud,
    });
  } catch {
    return null;
  }
}
