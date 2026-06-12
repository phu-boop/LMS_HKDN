import { capitalCase } from 'change-case';
import { useState, ReactElement, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Tab, Box, Card, Tabs, Container } from '@mui/material';
import useTabs from '../../../hooks/useTabs';
import useAuth from '../../../hooks/useAuth';
import useSettings from '../../../hooks/useSettings';
import Layout from '../../../layouts';
import Page from '../../../components/Page';
import Iconify from '../../../components/Iconify';
import HeaderBreadcrumbs from '../../../components/HeaderBreadcrumbs';
import {
  Profile,
  ProfileCover,
} from '../../../sections/@dashboard/user/profile';

const TabsWrapperStyle = styled('div')(({ theme }) => ({
  zIndex: 9,
  bottom: 0,
  width: '100%',
  display: 'flex',
  position: 'absolute',
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.up('sm')]: {
    justifyContent: 'center',
  },
  [theme.breakpoints.up('md')]: {
    justifyContent: 'flex-end',
    paddingRight: theme.spacing(3),
  },
}));

const TabsStyle = styled(Tabs)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 'auto',
  },
}));

TenantUserProfilePage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['TENANT_ADMIN']}>{page}</Layout>;
};

export default function TenantUserProfilePage() {
  const { themeStretch } = useSettings();
  const { user, getProfile } = useAuth();
  const { currentTab, onChangeTab } = useTabs('profile');

  const PROFILE_TABS = [
    {
      value: 'profile',
      icon: <Iconify icon={'ic:round-account-box'} width={20} height={20} />,
      component: <Profile myProfile={{
        id: user?.id || '',
        email: user?.email || '',
        displayName: user?.displayName || '',
        role: user?.role || '',
        quote: user?.about || 'Chưa có giới thiệu.',
        country: user?.country || 'Vietnam',
        company: 'STEM App',
        school: 'University of Science',
        position: 'Member',
        cover: 'https://minimal-assets-api-dev.vercel.app/assets/images/covers/cover_1.jpg',
        follower: 0,
        following: 0,
        facebookLink: '',
        instagramLink: '',
        linkedinLink: '',
        twitterLink: '',
      }} />,
    },
  ];

  useEffect(() => {
    if (getProfile) {
      getProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title="Profile">
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <HeaderBreadcrumbs
          heading="Profile"
          links={[{ name: 'Tenant Admin', href: '/tenant-admin/dashboard' }, { name: user?.displayName || 'Profile' }]}
        />
        <Card
          sx={{
            mb: 3,
            height: 280,
            position: 'relative',
          }}
        >
          <ProfileCover myProfile={{
            id: user?.id || '',
            email: user?.email || '',
            displayName: user?.displayName || '',
            role: user?.role || '',
            quote: user?.about || '',
            country: user?.country || '',
            company: '',
            school: '',
            position: user?.role || 'Member',
            cover: 'https://minimal-assets-api-dev.vercel.app/assets/images/covers/cover_1.jpg',
            follower: 0,
            following: 0,
            facebookLink: '',
            instagramLink: '',
            linkedinLink: '',
            twitterLink: '',
          }} />

          <TabsWrapperStyle>
            <TabsStyle value={currentTab} onChange={onChangeTab} variant="standard">
              {PROFILE_TABS.map((tab) => (
                <Tab
                  disableRipple
                  key={tab.value}
                  value={tab.value}
                  icon={tab.icon}
                  label={capitalCase(tab.value)}
                />
              ))}
            </TabsStyle>
          </TabsWrapperStyle>
        </Card>

        {PROFILE_TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}
