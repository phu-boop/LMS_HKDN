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
import AuditLogList from '../../sections/admin/audit-logs/AuditLogList';

// ----------------------------------------------------------------------

AdminAuditLogsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function AdminAuditLogsPage() {
  return (
    <Page title="Audit logs">
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading="Audit logs"
          links={[
            { name: 'Admin', href: PATH_ADMIN.root },
            { name: 'Audit logs' },
          ]}
        />
        <AuditLogList />
      </Container>
    </Page>
  );
}
