// i18n
import '../locales/i18n';

// highlight
import '../utils/highlight';

// scroll bar
import 'simplebar/src/simplebar.css';

// lightbox
import 'react-image-lightbox/style.css';

// map
import 'mapbox-gl/dist/mapbox-gl.css';

// editor
import 'react-quill/dist/quill.snow.css';

// slick-carousel
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// lazy image
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import 'react-lazy-load-image-component/src/effects/black-and-white.css';

// fullcalendar
import '@fullcalendar/common/main.min.css';
import '@fullcalendar/daygrid/main.min.css';

import cookie from 'cookie';
import { ReactElement, ReactNode, useEffect } from 'react';
// next
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import App, { AppProps, AppContext } from 'next/app';
//
import { Provider as ReduxProvider } from 'react-redux';
// @mui
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
// redux
import { store } from '../redux/store';
// utils
import { getSettings } from '../utils/getSettings';
// contexts
import { SettingsProvider } from '../contexts/SettingsContext';
import { CollapseDrawerProvider } from '../contexts/CollapseDrawerContext';
// theme
import ThemeProvider from '../theme';
// components
import ThemeSettings from '../components/settings';
import { SettingsValueProps } from '../components/settings/type';
import { ChartStyle } from '../components/chart';
import ProgressBar from '../components/ProgressBar';
import NotistackProvider from '../components/NotistackProvider';
import MotionLazyContainer from '../components/animate/MotionLazyContainer';

// Check our docs
// https://docs-minimals.vercel.app/authentication/ts-version

import { AuthProvider } from '../contexts/JWTContext';
import useAuth from '../hooks/useAuth';
// import { AuthProvider } from '../contexts/Auth0Context';
// import { AuthProvider } from '../contexts/FirebaseContext';
// import { AuthProvider } from '../contexts/AwsCognitoContext';

// ----------------------------------------------------------------------

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

interface MyAppProps extends AppProps {
  settings: SettingsValueProps;
  Component: NextPageWithLayout;
}

export default function MyApp(props: MyAppProps) {
  const { Component, pageProps, settings } = props;

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <AuthProvider>
        <DevToolsBlocker />
        <ReduxProvider store={store}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CollapseDrawerProvider>
              <SettingsProvider defaultSettings={settings}>
                <MotionLazyContainer>
                  <ThemeProvider>
                    <ThemeSettings>
                      <NotistackProvider>
                        <ChartStyle />
                        <ProgressBar />
                        {getLayout(<Component {...pageProps} />)}
                      </NotistackProvider>
                    </ThemeSettings>
                  </ThemeProvider>
                </MotionLazyContainer>
              </SettingsProvider>
            </CollapseDrawerProvider>
          </LocalizationProvider>
        </ReduxProvider>
      </AuthProvider>
    </>
  );
}

// ----------------------------------------------------------------------

MyApp.getInitialProps = async (context: AppContext) => {
  const appProps = await App.getInitialProps(context);

  const cookies = cookie.parse(
    context.ctx.req ? context.ctx.req.headers.cookie || '' : document.cookie
  );

  const settings = getSettings(cookies);

  return {
    ...appProps,
    settings,
  };
};

function DevToolsBlocker() {
  const { user } = useAuth();

  const router = useRouter();

  useEffect(() => {
    const isViewerPage = router.pathname.includes('/client/viewer') || router.pathname.includes('/client/library');
    if (process.env.NODE_ENV === 'production' && (user?.role === 'CLIENT' || isViewerPage)) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Chặn F12 và Inspect
        if (
          e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
          (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c' || e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'U') ||
          (e.ctrlKey && e.key === 'u') ||
          (e.metaKey && e.key === 'U') ||
          (e.metaKey && e.key === 'u')
        ) {
          e.preventDefault();
        }

        // Chặn PrintScreen
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          try { navigator.clipboard.writeText(''); } catch(err) {}
        }

        // Chặn Cmd+Shift+4 và Cmd+Shift+5 (chụp màn hình Mac)
        if (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) {
          e.preventDefault();
          try { navigator.clipboard.writeText(''); } catch(err) {}
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen') {
          try { navigator.clipboard.writeText(''); } catch(err) {}
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [user?.role, router.pathname]);

  return null;
}
