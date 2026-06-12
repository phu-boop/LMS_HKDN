import { capitalCase } from 'change-case';
// @mui
import { Box, Tooltip } from '@mui/material';
// components
import Iconify from '../../components/Iconify';

const ICONS: Record<string, string> = {
  jwt: 'solar:shield-user-bold-duotone',
  firebase: 'logos:firebase',
  auth0: 'logos:auth0',
  cognito: 'cib:amazon-aws',
};

type Props = {
  method: string;
};

export default function AuthMethodIcon({ method }: Props) {
  return (
    <Tooltip title={capitalCase(method)}>
      <Box
        sx={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify
          icon={ICONS[method] ?? 'solar:user-id-bold'}
          sx={{ width: 32, height: 32 }}
        />
      </Box>
    </Tooltip>
  );
}
