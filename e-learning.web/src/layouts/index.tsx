import { ReactNode } from 'react';
// guards
import AuthGuard from '../guards/AuthGuard';
import RoleBasedGuard from '../guards/RoleBasedGuard';
// components
import MainLayout from './main';
import DashboardLayout from './dashboard';
import LogoOnlyLayout from './LogoOnlyLayout';
import ClientLayout from './client';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
  variant?: 'main' | 'dashboard' | 'logoOnly' | 'client';
  roles?: string[];
};

export default function Layout({ variant = 'dashboard', roles, children }: Props) {
  if (variant === 'logoOnly') {
    return <LogoOnlyLayout> {children} </LogoOnlyLayout>;
  }

  if (variant === 'main') {
    return <MainLayout>{children}</MainLayout>;
  }

  if (variant === 'client') {
    return (
      <AuthGuard>
        <RoleBasedGuard roles={roles} hasContent>
          <ClientLayout>{children}</ClientLayout>
        </RoleBasedGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <RoleBasedGuard roles={roles} hasContent>
        <DashboardLayout> {children} </DashboardLayout>
      </RoleBasedGuard>
    </AuthGuard>
  );
}
