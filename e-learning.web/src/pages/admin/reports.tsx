import { ReactElement } from 'react';
import { Container } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '../../routes/paths';
import SystemReportsDashboard from '../../sections/admin/reports/SystemReportsDashboard';

AdminReportsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminReportsPage() {
  return (
    <Page title="Báo cáo thống kê">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <HeaderBreadcrumbs
          heading="Báo cáo thống kê vận hành"
          links={[{ name: 'Admin', href: PATH_ADMIN.root }, { name: 'Báo cáo thống kê' }]}
        />
        <SystemReportsDashboard />
      </Container>
    </Page>
  );
}
