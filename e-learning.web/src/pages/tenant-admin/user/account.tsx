import { ReactElement } from 'react';
import { capitalCase } from 'change-case';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';
import Layout from '../../../layouts';
import Page from '../../../components/Page';
import HeaderBreadcrumbs from '../../../components/HeaderBreadcrumbs';
import Iconify from '../../../components/Iconify';
import useTabs from '../../../hooks/useTabs';
import useSettings from '../../../hooks/useSettings';
import {
  AccountChangePassword,
  AccountGeneral,
} from '../../../sections/@dashboard/user/account';

const TabsStyle = styled(Tabs)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 'auto',
  },
}));

TenantUserAccountPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['TENANT_ADMIN']}>{page}</Layout>;
};

export default function TenantUserAccountPage() {
  const { themeStretch } = useSettings();
  const { currentTab, onChangeTab } = useTabs('general');

  const ACCOUNT_TABS = [
    {
      value: 'general',
      label: 'Thông tin chung',
      icon: <Iconify icon={'ic:round-account-box'} width={20} height={20} />,
      component: <AccountGeneral />,
    },
    {
      value: 'change_password',
      label: 'Đổi mật khẩu',
      icon: <Iconify icon={'ic:round-vpn-key'} width={20} height={20} />,
      component: <AccountChangePassword />,
    },
  ];

  return (
    <Page title="Cài đặt tài khoản">
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <HeaderBreadcrumbs
          heading="Tài khoản"
          links={[{ name: 'Admin Chương trình', href: '/tenant-admin/dashboard' }, { name: 'Cài đặt tài khoản' }]}
        />

        <TabsStyle value={currentTab} onChange={onChangeTab} variant="standard">
          {ACCOUNT_TABS.map((tab) => (
            <Tab
              disableRipple
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              value={tab.value}
            />
          ))}
        </TabsStyle>

        <Box sx={{ mb: 5 }} />

        {ACCOUNT_TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}
