import { capitalCase } from 'change-case';
import { ReactElement } from 'react';
import { Container, Tab, Box, Tabs } from '@mui/material';
import { PATH_CLIENT } from '../../../routes/paths';
import useTabs from '../../../hooks/useTabs';
import useSettings from '../../../hooks/useSettings';
import Layout from '../../../layouts';
import Page from '../../../components/Page';
import Iconify from '../../../components/Iconify';
import HeaderBreadcrumbs from '../../../components/HeaderBreadcrumbs';
import { AccountGeneral, AccountChangePassword } from '../../../sections/@dashboard/user/account';

ClientUserAccountPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER', 'STUDENT']}>{page}</Layout>;
};

export default function ClientUserAccountPage() {
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
          links={[
            { name: 'Bảng điều khiển', href: PATH_CLIENT.dashboard },
            { name: 'Người dùng', href: PATH_CLIENT.dashboard },
            { name: 'Cài đặt tài khoản' },
          ]}
        />

        <Tabs
          value={currentTab}
          onChange={onChangeTab}
        >
          {ACCOUNT_TABS.map((tab) => (
            <Tab disableRipple key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
          ))}
        </Tabs>

        <Box sx={{ mb: 5 }} />

        {ACCOUNT_TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}
