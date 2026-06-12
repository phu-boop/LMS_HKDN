import { m } from 'framer-motion';
// @mui
import { Container, Typography } from '@mui/material';
// hooks
import useAuth from '../hooks/useAuth';
// pages
import Page404 from '../pages/404';

// ----------------------------------------------------------------------

type RoleBasedGuardProp = {
  hasContent?: boolean;
  roles?: string[];
  children: React.ReactNode;
};

export default function RoleBasedGuard({ hasContent, roles, children }: RoleBasedGuardProp) {
  // Logic here to get current user role
  const { user } = useAuth();

  const currentRole = user?.role ?? null;

  if (typeof roles !== 'undefined' && (!currentRole || !roles.includes(currentRole))) {
    return hasContent ? <Page404 /> : null;
  }

  return <>{children}</>;
}
