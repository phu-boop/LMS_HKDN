import { ReactElement } from 'react';
import { Container, Tabs, Tab, Box } from '@mui/material';
import Layout from '@/layouts';
import Page from '@/components/Page';
import HeaderBreadcrumbs from '@/components/HeaderBreadcrumbs';
import { PATH_ADMIN } from '@/routes/paths';
import useTabs from '@/hooks/useTabs';
import LearningStructureManagement from '@/sections/admin/master-data/LearningStructureManagement';
import CatalogManagement from '@/sections/admin/master-data/CatalogManagement';

AdminMasterDataPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminMasterDataPage() {
  const { currentTab, onChangeTab } = useTabs('catalog');

  const TABS = [
    // {
    //   value: 'structure',
    //   label: 'Cấu trúc học tập',
    //   component: <LearningStructureManagement />,
    // },
    {
      value: 'catalog',
      label: 'Danh mục dùng chung',
      component: <CatalogManagement />,
    },
  ];

  return (
    <Page title="Quản lý Master Data">
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading="Quản lý Master Data"
          links={[
            { name: 'Admin', href: PATH_ADMIN.root },
            { name: 'Master data' }
          ]}
        />

        <Tabs
          value={currentTab}
          onChange={onChangeTab}
          sx={{ mb: 3 }}
        >
          {TABS.map((tab) => (
            <Tab disableRipple key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        {TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}
