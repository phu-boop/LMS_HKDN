import { useEffect } from 'react';
// next
import { useRouter } from 'next/router';
// @mui
import { styled, useTheme } from '@mui/material/styles';
import { Box, Stack, Drawer, Typography } from '@mui/material';
// hooks
import useResponsive from '../../../hooks/useResponsive';
import useCollapseDrawer from '../../../hooks/useCollapseDrawer';
// utils
import cssStyles from '../../../utils/cssStyles';
// config
import { NAVBAR } from '../../../config';
// components
import Logo from '../../../components/Logo';
import Scrollbar from '../../../components/Scrollbar';
import { NavSectionVertical } from '../../../components/nav-section';
//
import dashboardNavConfig from './NavConfig';
import adminNavConfig from './AdminNavConfig';
import tenantNavConfig from './NavConfigTenant';
import NavbarDocs from './NavbarDocs';
import NavbarAccount from './NavbarAccount';
import CollapseButton from './CollapseButton';
import { useSelector } from '../../../redux/store';
// import useAuth from '../../../hooks/useAuth';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('lg')]: {
    flexShrink: 0,
    transition: theme.transitions.create('width', {
      duration: theme.transitions.duration.shorter,
    }),
  },
}));

// ----------------------------------------------------------------------

type Props = {
  isOpenSidebar: boolean;
  onCloseSidebar: VoidFunction;
};

export default function NavbarVertical({ isOpenSidebar, onCloseSidebar }: Props) {
  const theme = useTheme();

  const { pathname } = useRouter();

  const isDesktop = useResponsive('up', 'lg');

  const { isCollapse, collapseClick, collapseHover, onToggleCollapse, onHoverEnter, onHoverLeave } =
    useCollapseDrawer();

  const { branding } = useSelector((state) => state.tenantBranding);

  let workspaceTitle = branding?.domain || branding?.subdomain || 'stem.daihoc.io.vn';
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      workspaceTitle = host;
    }
  }

  useEffect(() => {
    if (isOpenSidebar) {
      onCloseSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isAdminPortal = pathname.startsWith('/admin');
  const isTenantAdminPortal = pathname.startsWith('/tenant-admin');

  let navConfig: any = dashboardNavConfig;
  if (isAdminPortal) navConfig = adminNavConfig;
  if (isTenantAdminPortal) navConfig = tenantNavConfig;

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        '& .simplebar-content': { height: 1, display: 'flex', flexDirection: 'column' },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          pt: 3,
          pb: 2,
          px: 2.5,
          flexShrink: 0,
          ...(isCollapse && { alignItems: 'center' }),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Logo />

          {isDesktop && !isCollapse && (
            <CollapseButton onToggleCollapse={onToggleCollapse} collapseClick={collapseClick} />
          )}
        </Stack>

        <NavbarAccount isCollapse={isCollapse} />
      </Stack>

      <NavSectionVertical navConfig={navConfig as any} isCollapse={isCollapse} />

      <Box sx={{ flexGrow: 1 }} />

      {!isCollapse && !isAdminPortal && !isTenantAdminPortal && <NavbarDocs />}

      {isTenantAdminPortal && !isCollapse && (
        <Box sx={{ px: 2.5, pb: 3, mt: 'auto' }}>
          <Stack
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#a7f3d0', opacity: 0.6, mb: 0.5 }}>
              Không gian làm việc
            </Typography>
            <Typography variant="subtitle2" noWrap sx={{ color: '#fff' }}>
              {workspaceTitle}
            </Typography>
          </Stack>
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <RootStyle
      sx={{
        width: {
          lg: isCollapse ? NAVBAR.DASHBOARD_COLLAPSE_WIDTH : NAVBAR.DASHBOARD_WIDTH,
        },
        ...(collapseClick && {
          position: 'absolute',
        }),
      }}
    >
      {!isDesktop && (
        <Drawer
          open={isOpenSidebar}
          onClose={onCloseSidebar}
          PaperProps={{ sx: { width: NAVBAR.DASHBOARD_WIDTH } }}
        >
          {renderContent}
        </Drawer>
      )}

      {isDesktop && (
        <Drawer
          open
          variant="persistent"
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
          PaperProps={{
            sx: {
              width: NAVBAR.DASHBOARD_WIDTH,
              borderRightStyle: 'dashed',
              bgcolor: isTenantAdminPortal ? '#064e3b' : 'background.default',
              color: isTenantAdminPortal ? '#fff' : 'text.primary',
              transition: (theme) =>
                theme.transitions.create('width', {
                  duration: theme.transitions.duration.standard,
                }),
              ...(isCollapse && {
                width: NAVBAR.DASHBOARD_COLLAPSE_WIDTH,
              }),
              ...(collapseHover && {
                ...cssStyles(theme).bgBlur(),
                boxShadow: (theme) => theme.customShadows.z24,
              }),
              // Overrides for Tenant Admin Nav Section
              ...(isTenantAdminPortal && {
                '& .MuiTypography-root': { color: '#fff' },
                '& .MuiListItemIcon-root': { color: '#a7f3d0' },
                '& .MuiListItemButton-root.active': {
                  bgcolor: '#059669',
                  color: '#fff',
                  '& .MuiListItemIcon-root': { color: '#fff' },
                },
                '& .MuiListItemButton-root:hover': {
                  bgcolor: '#065f46',
                }
              }),
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </RootStyle>
  );
}
