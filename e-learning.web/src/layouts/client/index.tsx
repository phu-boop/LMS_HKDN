import { useEffect, useState, ReactNode } from 'react';
// next
import { useRouter } from 'next/router';
// @mui
import {
  Box,
  Drawer,
  AppBar,
  Stack,
  Toolbar,
  IconButton,
  Typography,
  Container,
} from '@mui/material';
import { styled } from '@mui/material/styles';
// hooks
import useAuth from '../../hooks/useAuth';
import useResponsive from '../../hooks/useResponsive';
import useCollapseDrawer from '../../hooks/useCollapseDrawer';
import useSettings from '../../hooks/useSettings';
// routes
import { PATH_AUTH } from '../../routes/paths';
// config
import { NAVBAR } from '../../config';
// components
import Logo from '../../components/Logo';
import Iconify from '../../components/Iconify';
import Scrollbar from '../../components/Scrollbar';
import AccountPopover from '../dashboard/header/AccountPopover';
import LanguagePopover from '../dashboard/header/LanguagePopover';
import { NavSectionVertical, NavSectionHorizontal } from '../../components/nav-section';
import CollapseButton from '../dashboard/navbar/CollapseButton';
//
import navConfig from './NavConfig';

const NAV_WIDTH = 280;
const HEADER_HEIGHT = 72;

const MainStyle = styled('main', {
  shouldForwardProp: (prop) => prop !== 'collapseClick' && prop !== 'isHorizontal',
})<{ collapseClick?: boolean; isHorizontal?: boolean }>(({ collapseClick, isHorizontal, theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  padding: theme.spacing(1.5),
  paddingTop: HEADER_HEIGHT + 8,
  transition: theme.transitions.create(['margin-left', 'padding-top'], {
    duration: theme.transitions.duration.shorter,
  }),
  [theme.breakpoints.up('lg')]: {
    marginLeft: isHorizontal ? 0 : collapseClick ? NAVBAR.DASHBOARD_COLLAPSE_WIDTH : NAVBAR.DASHBOARD_WIDTH,
    ...(isHorizontal && {
      paddingTop: HEADER_HEIGHT + 64, // Extra space for horizontal nav
    }),
  },
}));

type Props = {
  children: ReactNode;
};

export default function ClientLayout({ children }: Props) {
  const { pathname, push } = useRouter();
  const isDesktop = useResponsive('up', 'lg');
  const { user } = useAuth();
  const { themeLayout } = useSettings();
  const [open, setOpen] = useState(false);

  const isNavHorizontal = themeLayout === 'horizontal';

  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const displayName = user?.displayName ?? user?.name;
  const userRole = user?.role;

  const {
    isCollapse,
    collapseClick,
    collapseHover,
    onToggleCollapse,
    onHoverEnter,
    onHoverLeave,
  } = useCollapseDrawer();

  const isCollapseDesktop = isDesktop && isCollapse;

  const renderSidebar = (
    <Box
      sx={{
        height: 1,
        overflowY: 'auto',
        display: 'flex', 
        flexDirection: 'column',
        ...(isCollapseDesktop && { alignItems: 'center' }) 
      }}
    >
      <Stack
        sx={{
          pt: 1.5,
          pb: 1,
          px: isCollapseDesktop ? 0 : 2.5,
          width: 1,
          alignItems: 'center',
        }}
      >
        {!isCollapseDesktop ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 1 }}>
            <Logo withText />
            {isDesktop && (
              <CollapseButton onToggleCollapse={onToggleCollapse} collapseClick={collapseClick} />
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: 1 }}>
            <Logo />
          </Box>
        )}
      </Stack>

      <Box
        sx={{
          pb: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: 1,
          ...(isCollapseDesktop && {
            alignItems: 'center',
            '& .MuiList-root': {
              width: 1,
              px: 0,
            },
            '& .MuiListItemButton-root': {
              width: NAVBAR.DASHBOARD_COLLAPSE_WIDTH,
              justifyContent: 'center',
              px: 0,
              mx: 0,
              borderRadius: 0,
              '&.active': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
              }
            },
            '& .MuiListItemIcon-root': {
              mr: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 1,
            },
          }),
          ...(!isCollapseDesktop && {
            px: 1,
            alignItems: 'stretch',
          }),
        }}
      >
        <NavSectionVertical navConfig={navConfig} isCollapse={isCollapseDesktop} />
      </Box>

      {!isDesktop && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2.5}
            sx={{
              py: 2,
              borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
            }}
          >
            {/* <LanguagePopover /> */}
            <AccountPopover />
          </Stack>
      )}
    </Box>
  );

  const renderHorizontalNav = (
    <AppBar
      color="default"
      sx={{
        top: HEADER_HEIGHT,
        zIndex: (theme) => theme.zIndex.appBar - 1,
        bgcolor: 'background.default',
        boxShadow: (theme) => theme.customShadows.z8,
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Container maxWidth={false}>
        <NavSectionHorizontal navConfig={navConfig} />
      </Container>
    </AppBar>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        color="transparent"
        elevation={0}
        sx={{
          height: HEADER_HEIGHT,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              duration: theme.transitions.duration.shorter,
            }),
          ...(isDesktop && {
            width: isNavHorizontal
              ? '100%'
              : `calc(100% - ${
                  collapseClick ? NAVBAR.DASHBOARD_COLLAPSE_WIDTH : NAVBAR.DASHBOARD_WIDTH
                }px)`,
          }),
        }}
      >
        <Toolbar sx={{ height: 1, px: { xs: 2, lg: 3 } }}>
          {(!isDesktop || !isNavHorizontal) && (
            <IconButton onClick={() => setOpen(true)} sx={{ mr: 1.5 }}>
              <Iconify icon="eva:menu-2-fill" width={22} height={22} />
            </IconButton>
          )}
          <Logo sx={{ mr: 2, display: isNavHorizontal ? 'block' : 'none' }} />
          <Typography variant="subtitle1">Cổng học liệu trường học</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }} sx={{ display: { xs: 'none', lg: 'flex' } }}>
            {/* <LanguagePopover /> */}
            <AccountPopover />
          </Stack>
        </Toolbar>
      </AppBar>

      {isNavHorizontal && isDesktop ? (
        renderHorizontalNav
      ) : (
        <>
          {isDesktop ? (
            <Box
              onMouseEnter={onHoverEnter}
              onMouseLeave={onHoverLeave}
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                width: NAVBAR.DASHBOARD_WIDTH,
                position: 'fixed',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                borderRight: (theme) => `1px dashed ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                pt: 1, // Bắt đầu sát lên trên hơn thay vì cách 72px
                transition: (theme) =>
                  theme.transitions.create('width', {
                    duration: theme.transitions.duration.standard,
                  }),
                ...(isCollapse && {
                  width: NAVBAR.DASHBOARD_COLLAPSE_WIDTH,
                }),
                ...(collapseHover && {
                  boxShadow: (theme) => theme.customShadows.z24,
                }),
              }}
            >
              {renderSidebar}
            </Box>
          ) : (
            <Drawer
              open={open}
              onClose={() => setOpen(false)}
              PaperProps={{ sx: { width: NAVBAR.DASHBOARD_WIDTH } }}
            >
              {renderSidebar}
            </Drawer>
          )}
        </>
      )}

      <MainStyle collapseClick={collapseClick} isHorizontal={isNavHorizontal && isDesktop}>
        {children}
      </MainStyle>
    </Box>
  );
}
