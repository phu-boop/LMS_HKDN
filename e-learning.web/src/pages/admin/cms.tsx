import { ReactElement } from 'react';
import { Container } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '../../routes/paths';
import ContentManagement from '../../sections/admin/cms/ContentManagement';

AdminCmsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminCmsPage() {
  return (
    <Page title="CMS nội dung">
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <HeaderBreadcrumbs
          heading="CMS nội dung học liệu"
          links={[{ name: 'Admin', href: PATH_ADMIN.root }, { name: 'CMS nội dung' }]}
        />
        <ContentManagement />
      </Container>
    </Page>
  );
}
