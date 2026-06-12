import { HOST_API_URL } from '@/config';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { extractAuthTokens } from '@/utils/authTokens';
import { getRefreshToken } from '@/utils/cacheStorage';
import { setSession } from '@/utils/jwt';
import { notifyAccessTokenRefreshed, notifySessionCleared } from '@/utils/authRefreshHooks';

let refreshInFlight: Promise<string | null> | null = null;

function parseRefreshResponse(data: unknown): { accessToken: string; refreshToken?: string } | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const candidate = d.data && typeof d.data === 'object' ? d.data : data;
  try {
    return extractAuthTokens(candidate);
  } catch {
    return null;
  }
}

/**
 * POST /api/identity/auth/refresh with refresh cookie value.
 * Single-flight: concurrent 401s share one refresh.
 * On failure: clears session + notifies `onSessionCleared`.
 */
export function refreshAccessTokenWithMutex(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<string | null> => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setSession(null);
        notifySessionCleared();
        return null;
      }

      const base = HOST_API_URL?.replace(/\/$/, '');
      if (!base) {
        setSession(null);
        notifySessionCleared();
        return null;
      }

      try {
        const res = await fetch(`${base}${API_ENDPOINTS.authRefresh}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const body = (await res.json().catch(() => null)) as unknown;

        if (!res.ok || !body) {
          setSession(null);
          notifySessionCleared();
          return null;
        }

        const tokens = parseRefreshResponse(body);
        if (!tokens) {
          setSession(null);
          notifySessionCleared();
          return null;
        }

        setSession(tokens.accessToken, tokens.refreshToken ?? null);
        notifyAccessTokenRefreshed(tokens.accessToken);
        return tokens.accessToken;
      } catch {
        setSession(null);
        notifySessionCleared();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}
