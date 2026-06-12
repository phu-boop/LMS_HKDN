import { ReactElement } from 'react';
import Head from 'next/head';
// layouts
import DashboardLayout from '../../../layouts/dashboard';
// components
import RoleBasedGuard from '../../../guards/RoleBasedGuard';
// sections
import CommentManagement from '../../../sections/tenant-admin/comments/CommentManagement';

// ----------------------------------------------------------------------

TenantCommentsPage.getLayout = (page: ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

// ----------------------------------------------------------------------

export default function TenantCommentsPage() {
  return (
    <>
      <Head>
        <title> Quản lý Bình luận | Tenant Admin Dashboard</title>
      </Head>

      <RoleBasedGuard hasContent roles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
        <CommentManagement />
      </RoleBasedGuard>
    </>
  );
}
