// icons
import { Icon, IconifyIcon } from '@iconify/react';
// @mui
import { Box, BoxProps, SxProps } from '@mui/material';

// ----------------------------------------------------------------------

interface Props extends BoxProps {
  sx?: SxProps;
  icon: IconifyIcon | string;
  width?: number | string;
  height?: number | string;
}

export default function Iconify({ icon, sx, width, height, ...other }: Props) {
  return <Box component={Icon} icon={icon} sx={{ width, height, ...sx }} {...other} />;
}
