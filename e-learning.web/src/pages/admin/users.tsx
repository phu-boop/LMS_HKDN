import { ReactElement } from 'react';
// @mui
import { Container } from '@mui/material';
// routes
import { PATH_ADMIN } from '../../routes/paths';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
// sections
import SuperAdminUserManagement from '../../sections/admin/super-admin-users/SuperAdminUserManagement';

// ----------------------------------------------------------------------

AdminUsersPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function AdminUsersPage() {
  return (
    <Page title="Tài khoản người dùng">
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading="Quản lý tài khoản"
          links={[
            { name: 'Admin', href: PATH_ADMIN.root },
            { name: 'Tài khoản người dùng' },
          ]}
        />
        <SuperAdminUserManagement />
      </Container>
    </Page>
  );
}
