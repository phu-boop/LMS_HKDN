import { forwardRef } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
// @mui
import { Box, BoxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAuth from '../hooks/useAuth';
import useCollapseDrawer from '../hooks/useCollapseDrawer';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  disabledLink?: boolean;
  withText?: boolean;
  withColor?: boolean;
}

const Logo = forwardRef<any, Props>(
  ({ disabledLink = false, withText = true, withColor = false, sx }, ref) => {
    const theme = useTheme();
    const { pathname } = useRouter();
    const { isCollapse } = useCollapseDrawer();
    const { user } = useAuth();

    const isTenantAdminPortal = pathname.startsWith('/tenant-admin');
    const isDarkBackground = isTenantAdminPortal || theme.palette.mode === 'dark';

    // Resolve the appropriate image path based on layout state and background mode
    let logoSrc = '';
    if (isDarkBackground) {
      logoSrc = isCollapse ? '/logo/logo_single_dark.png' : '/logo/logo_full_dark.png';
    } else {
      logoSrc = isCollapse ? '/logo/logo_single_light.png' : '/logo/logo_full_light.png';
    }

    const isTenantAdmin = user?.role === 'TENANT_ADMIN';
    const isAdmin = user?.role === 'LMS_ADMIN';

    const path = isTenantAdmin ? '/tenant-admin/dashboard' : isAdmin ? '/admin/dashboard' : '/';

    const logo = (
      <Box
        ref={ref}
        component="img"
        src={logoSrc}
        alt="AIG Logo"
        sx={{
          height: isCollapse ? 40 : 36,
          width: 'auto',
          objectFit: 'contain',
          cursor: 'pointer',
          ...sx,
        }}
      />
    );

    if (disabledLink) {
      return <>{logo}</>;
    }

    return <NextLink href={path}>{logo}</NextLink>;
  }
);

export default Logo;
