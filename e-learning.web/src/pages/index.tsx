import { useEffect } from 'react';
import { useRouter } from 'next/router';
// @mui
import { styled } from '@mui/material/styles';
// layouts
import Layout from '../layouts';
// hooks
import useAuth from '../hooks/useAuth';
// routes
import { PATH_AUTH } from '../routes/paths';
import { roleToPostLoginLanding } from '../utils/roleLanding';
// components
import LoadingScreen from '../components/LoadingScreen';
import Page from '../components/Page';
// sections
import {
  HomeHero,
  HomeMinimal,
  HomeDarkMode,
  HomeLookingFor,
  HomeColorPresets,
  HomePricingPlans,
  HomeAdvertisement,
  HomeCleanInterfaces,
  HomeHugePackElements,
} from '../sections/home';

const ContentStyle = styled('div')(({ theme }) => ({
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: theme.palette.background.default,
}));

HomePage.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout variant="main">{page}</Layout>;
};

export default function HomePage() {
  const router = useRouter();
  const { isInitialized, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace(PATH_AUTH.login);
      return;
    }
    router.replace(roleToPostLoginLanding(user?.role));
  }, [isInitialized, isAuthenticated, user?.role, router]);

  /*
   * Legacy landing page (kept for reference only):
   *
   * return (
   *   <Page title="The starting point for your next project">
   *     <HomeHero />
   *     <ContentStyle>
   *       <HomeMinimal />
   *       <HomeHugePackElements />
   *       <HomeDarkMode />
   *       <HomeColorPresets />
   *       <HomeCleanInterfaces />
   *       <HomePricingPlans />
   *       <HomeLookingFor />
   *       <HomeAdvertisement />
   *     </ContentStyle>
   *   </Page>
   * );
   */
  void Page;
  void HomeHero;
  void ContentStyle;
  void HomeMinimal;
  void HomeHugePackElements;
  void HomeDarkMode;
  void HomeColorPresets;
  void HomeCleanInterfaces;
  void HomePricingPlans;
  void HomeLookingFor;
  void HomeAdvertisement;

  return <LoadingScreen />;
}
