import { ReactNode, useEffect } from 'react';
// next
import { useRouter } from 'next/router';
// hooks
import useAuth from '../hooks/useAuth';
// routes
import { PATH_AUTH } from '../routes/paths';
import { roleToPostLoginLanding, isAdminLandingRole } from '../utils/roleLanding';
import { buildPortalUrl } from '../utils/domainRouting';
import { resolveSafeReturnTo } from '../utils/returnTo';
// config
import { ADMIN_DOMAIN, ROOT_DOMAIN } from '@/config';
import { getReturnTo, removeReturnTo, getToken, getRefreshToken } from '../utils/cacheStorage';
// components
import LoadingScreen from '../components/LoadingScreen';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
};

export default function GuestGuard({ children }: Props) {
  const { push, query } = useRouter();

  const { isAuthenticated, isInitialized, user } = useAuth();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        // Not a bug: valid token in storage → skip login form; no POST /auth/login on this visit.
        // eslint-disable-next-line no-console
        console.info(
          '[auth] GuestGuard: already signed in (JWT in storage) → redirect to dashboard; login API is not called until you sign out or clear the token.'
        );
      }

      const role = user?.role ?? '';
      const jwtSubdomain = (user as any)?.subdomain ?? null;

      const landingPath = roleToPostLoginLanding(role);
      const normalizedRole = role.toUpperCase().trim();
      const isSystemAdmin = normalizedRole === 'LMS_ADMIN' || normalizedRole === 'SUPER_ADMIN';

      const returnTo = typeof query.returnTo === 'string' ? query.returnTo : null;
      const cookieReturnTo = getReturnTo();
      const safeReturnTo = resolveSafeReturnTo(returnTo || cookieReturnTo);

      if (safeReturnTo) {
        const isAdmin = isAdminLandingRole(role);
        const isClientPath = safeReturnTo.includes('/client/');
        
        if (!(isAdmin && isClientPath)) {
          removeReturnTo();
          let finalUrl = safeReturnTo;
          if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
            const accessToken = getToken();
            const refreshToken = getRefreshToken();
            const connector = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${connector}accessToken=${accessToken}${refreshToken ? `&refreshToken=${refreshToken}` : ''}`;
          }

          if (window.location.href !== finalUrl) {
            window.location.href = finalUrl;
            return;
          }
        }
      }

      // Xác định Domain đích
      let targetDomain: string | null = null;
      let fallbackSub: string | null = null;

      if (isSystemAdmin) {
        targetDomain = ADMIN_DOMAIN;
        fallbackSub = jwtSubdomain || 'lms-admin';
      } else if (jwtSubdomain) {
        targetDomain = `${jwtSubdomain}.${ROOT_DOMAIN}`;
        fallbackSub = jwtSubdomain;
      }

      if (targetDomain || isSystemAdmin) {
        let targetUrl = buildPortalUrl({
          targetDomain,
          fallbackSubdomain: fallbackSub,
          path: landingPath,
        });

        if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
          const accessToken = getToken();
          const refreshToken = getRefreshToken();
          const connector = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${connector}accessToken=${accessToken}${refreshToken ? `&refreshToken=${refreshToken}` : ''}`;
        }

        const currentUrl = new URL(window.location.href);
        const nextUrl = new URL(targetUrl);
        
        if (currentUrl.host === nextUrl.host && currentUrl.pathname === nextUrl.pathname) {
           return;
        }

        window.location.href = targetUrl;
        return;
      }

      push(PATH_AUTH.selectWorkspace);
    }
  }, [isInitialized, isAuthenticated, user?.role, query.returnTo, push]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
