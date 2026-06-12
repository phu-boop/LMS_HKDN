import { ReactElement } from 'react';
// @mui
import { Box } from '@mui/material';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';
// sections
import ClientLibraryTree from '../../sections/client/library/ClientLibraryTree';
import ClientLibraryContentList from '../../sections/client/library/ClientLibraryContentList';

ClientLibrary.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

export default function ClientLibrary() {
  return (
    <Page title="Client - Thư viện học liệu">
      <ClientExperienceTemplate
        title="Thư viện học liệu"
        subtitle="Duyệt cây học liệu và tìm kiếm bài giảng theo chương trình, lớp, môn học."
        primaryAction={{ label: 'Truy cập nhanh', href: '/client/quick-access' }}
        secondaryAction={{ label: 'Lịch sử học', href: '/client/history' }}
      >
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
          <Box sx={{ width: { xs: '100%', md: 280, lg: 320 }, flexShrink: 0 }}>
            <ClientLibraryTree />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <ClientLibraryContentList />
          </Box>
        </Box>
      </ClientExperienceTemplate>
    </Page>
  );
}
