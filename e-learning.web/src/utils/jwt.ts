import jwtDecode from 'jwt-decode';
// routes
import { PATH_AUTH } from '../routes/paths';
import { removeRefreshToken, removeToken, saveRefreshToken, saveToken } from './cacheStorage';

// ----------------------------------------------------------------------

let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;

const clearTokenExpiryTimer = () => {
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer);
    tokenExpiryTimer = null;
  }
};

const isValidToken = (accessToken: string) => {
  if (!accessToken) {
    return false;
  }
  const decoded = jwtDecode<{ exp: number }>(accessToken);

  const currentTime = Date.now() / 1000;

  return decoded.exp > currentTime;
};

const handleTokenExpired = (exp: number) => {
  clearTokenExpiryTimer();
  // We no longer forcefully log out the user on the frontend timer.
  // Instead, we allow the request to fail with a 401, which the axios interceptor
  // will catch, auto-refresh the token, and retry the request seamlessly.
};

/** Persist tokens; Authorization header is set by `utils/axios` interceptors */
const setSession = (accessToken: string | null, refreshToken?: string | null) => {
  clearTokenExpiryTimer();

  if (accessToken) {
    saveToken(accessToken);
    if (refreshToken) {
      saveRefreshToken(refreshToken);
    }

    const { exp } = jwtDecode<{ exp: number }>(accessToken);
    handleTokenExpired(exp);
  } else {
    removeToken();
    removeRefreshToken();
  }
};

export { isValidToken, setSession };
