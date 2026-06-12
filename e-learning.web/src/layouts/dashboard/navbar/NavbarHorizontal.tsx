import { memo } from 'react';
import { useRouter } from 'next/router';
// @mui
import { styled } from '@mui/material/styles';
import { Container, AppBar } from '@mui/material';
// config
import { HEADER } from '../../../config';
// components
import { NavSectionHorizontal } from '../../../components/nav-section';
//
import dashboardNavConfig from './NavConfig';
import adminNavConfig from './AdminNavConfig';
import tenantNavConfig from './NavConfigTenant';
import { NavSectionProps } from '../../../components/nav-section/type';

// ----------------------------------------------------------------------

const RootStyle = styled(AppBar)(({ theme }) => ({
  transition: theme.transitions.create('top', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  width: '100%',
  position: 'fixed',
  zIndex: theme.zIndex.appBar,
  padding: theme.spacing(1, 0),
  boxShadow: theme.customShadows.z8,
  top: HEADER.DASHBOARD_DESKTOP_OFFSET_HEIGHT,
  backgroundColor: theme.palette.background.default,
}));

// ----------------------------------------------------------------------

function NavbarHorizontal() {
  const { pathname } = useRouter();

  const isTenantAdminPortal = pathname.startsWith('/tenant-admin');

  let navConfig: NavSectionProps['navConfig'] = dashboardNavConfig;
  if (pathname.startsWith('/admin')) {
    navConfig = adminNavConfig;
  } else if (isTenantAdminPortal) {
    navConfig = tenantNavConfig;
  }

  return (
    <RootStyle
      sx={{
        ...(isTenantAdminPortal && {
          bgcolor: '#064e3b',
          '& .MuiTypography-root': { color: '#fff' },
          '& .MuiListItemIcon-root': { color: '#a7f3d0' },
          '& .MuiListItemButton-root': {
            '&.active': {
              bgcolor: '#059669 !important',
              color: '#fff !important',
              '& .MuiListItemIcon-root': { color: '#fff !important' },
              '& .MuiTypography-root': { color: '#fff !important' },
            },
            '&:hover': {
              bgcolor: '#065f46 !important',
            },
          },
        }),
      }}
    >
      <Container maxWidth={false}>
        <NavSectionHorizontal navConfig={navConfig} />
      </Container>
    </RootStyle>
  );
}

export default memo(NavbarHorizontal);
