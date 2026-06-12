import { capitalCase } from 'change-case';
import { useState, ReactElement, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Tab, Box, Card, Tabs, Container, Typography } from '@mui/material';
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
import FavoriteLessonList from '../../../sections/client/user/FavoriteLessonList';

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

ClientUserProfilePage.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER', 'STUDENT']}>{page}</Layout>;
};

export default function ClientUserProfilePage() {
  const { themeStretch } = useSettings();
  const { user, getProfile } = useAuth();
  useEffect(() => {
    if (getProfile) {
      getProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const myProfile = {
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
  };

  return (
    <Page title="Profile">
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <HeaderBreadcrumbs
          heading="Profile"
          links={[{ name: 'Dashboard', href: '/client/dashboard' }, { name: user?.displayName || 'Profile' }]}
        />
        <Card
          sx={{
            mb: 3,
            height: 280,
            position: 'relative',
          }}
        >
          <ProfileCover myProfile={myProfile} />
        </Card>

        <Box sx={{ mt: 3 }}>
          <Profile myProfile={myProfile} />
        </Box>
      </Container>
    </Page>
  );
}
