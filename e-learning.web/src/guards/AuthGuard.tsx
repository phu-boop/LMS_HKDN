import { useState, ReactNode, useEffect } from 'react';
// next
import { useRouter } from 'next/router';
// config
import { LOGIN_DOMAIN } from '@/config';
// hooks
import useAuth from '../hooks/useAuth';
import { PATH_AUTH } from '../routes/paths';
// utils
import { saveReturnTo } from '../utils/cacheStorage';
import { buildPortalUrl, switchSubdomain } from '../utils/domainRouting';
// components
import LoadingScreen from '../components/LoadingScreen';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const { isAuthenticated, isInitialized } = useAuth();

  const { asPath, pathname, push } = useRouter();

  const [requestedLocation, setRequestedLocation] = useState<string | null>(null);

  useEffect(() => {
    if (requestedLocation && pathname !== requestedLocation) {
      push(requestedLocation);
    }
    if (isAuthenticated) {
      setRequestedLocation(null);
    }
  }, [isAuthenticated, pathname, push, requestedLocation]);

  useEffect(() => {
    if (!isInitialized || isAuthenticated || typeof window === 'undefined') {
      return;
    }

    const loginUrl = switchSubdomain('id', PATH_AUTH.login);
    const requestedUrl = `${window.location.origin}${asPath}`;

    // On plain 'localhost', subdomains cannot share cookies.
    // Fallback to query param in that case to avoid redirect loops.
    const isPlainLocalhost = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost');

    if (isPlainLocalhost) {
      const targetUrl = `${loginUrl}?returnTo=${encodeURIComponent(requestedUrl)}`;
      if (window.location.href !== targetUrl) {
        window.location.replace(targetUrl);
      }
    } else {
      saveReturnTo(requestedUrl);
      if (window.location.href !== loginUrl) {
        window.location.replace(loginUrl);
      }
    }
  }, [asPath, isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    if (pathname !== requestedLocation) {
      setRequestedLocation(pathname);
    }
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
