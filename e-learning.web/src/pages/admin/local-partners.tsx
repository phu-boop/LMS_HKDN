import { ReactElement } from 'react';
import { Container } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '../../routes/paths';
import LocalPartnerManagement from '../../sections/admin/local-partners/LocalPartnerManagement';

AdminLocalPartnersPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminLocalPartnersPage() {
  return (
    <Page title="Local Partner">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <HeaderBreadcrumbs
          heading="Quản lý Local Partner"
          links={[{ name: 'Admin', href: PATH_ADMIN.root }, { name: 'Local Partner' }]}
        />
        <LocalPartnerManagement />
      </Container>
    </Page>
  );
}
