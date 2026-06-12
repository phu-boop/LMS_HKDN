import { ReactElement } from 'react';
import { Container } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '../../routes/paths';
import ProgramTenantManagement from '../../sections/admin/program-tenants/ProgramTenantManagement';

AdminProgramTenantsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminProgramTenantsPage() {
  return (
    <Page title="Chương trình">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <HeaderBreadcrumbs
          heading="Khởi tạo chương trình"
          links={[{ name: 'Admin', href: PATH_ADMIN.root }, { name: 'Chương trình' }]}
        />
        <ProgramTenantManagement />
      </Container>
    </Page>
  );
}
