import { ReactElement } from 'react';
import { Container } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '../../routes/paths';
import SchoolManagement from '../../sections/admin/schools/SchoolManagement';

AdminSchoolsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminSchoolsPage() {
  return (
    <Page title="Khách hàng (Trường học)">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <HeaderBreadcrumbs
          heading="Quản lý khách hàng/trường học"
          links={[{ name: 'Admin', href: PATH_ADMIN.root }, { name: 'Khách hàng (Trường học)' }]}
        />
        <SchoolManagement />
      </Container>
    </Page>
  );
}
