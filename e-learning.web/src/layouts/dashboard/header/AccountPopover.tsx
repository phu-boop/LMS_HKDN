import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
// next
import NextLink from 'next/link';
import { useRouter } from 'next/router';
// @mui
import { alpha } from '@mui/material/styles';
import { Box, Divider, Typography, Stack, MenuItem } from '@mui/material';
// routes
import { PATH_DASHBOARD, PATH_AUTH, PATH_ADMIN } from '../../../routes/paths';
// hooks
import useAuth from '../../../hooks/useAuth';
import useIsMountedRef from '../../../hooks/useIsMountedRef';
// components
import MyAvatar from '../../../components/MyAvatar';
import MenuPopover from '../../../components/MenuPopover';
import { IconButtonAnimate } from '../../../components/animate';

// redux & requests
import { dispatch as reduxDispatch, useSelector } from '../../../redux/store';
import { setWorkspaces } from '../../../redux/slices/auth';
import { ROOT_DOMAIN } from '../../../config';
import { roleToPostLoginLanding } from '../../../utils/roleLanding';
import { buildPortalUrl } from '../../../utils/domainRouting';
import { setSession } from '../../../utils/jwt';
import { getRefreshToken } from '../../../utils/cacheStorage';
import { userFromAccessToken } from '../../../utils/authTokens';
import { setBranding } from '../../../redux/slices/tenantBranding';
import RequestFactory from '../../../requests/RequestFactory';

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMountedRef = useIsMountedRef();
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState<HTMLElement | null>(null);

  const isTenantAdmin = user?.role === 'TENANT_ADMIN';
  const isAdmin = user?.role === 'LMS_ADMIN';
  const isClient = !isTenantAdmin && !isAdmin;

  // Workspaces logic
  const reduxWorkspaces = useSelector((state) => state.auth.workspaces);
  const [workspaces, setLocalWorkspaces] = useState<any[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    if (reduxWorkspaces && reduxWorkspaces.length > 0) {
      setLocalWorkspaces(reduxWorkspaces);
    } else {
      const identityRequest = RequestFactory.getRequest('IdentityRequest');
      identityRequest
        .getWorkspaces()
        .then((res) => {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.items ?? (res.data as any)?.data ?? [];
          setLocalWorkspaces(list);
          reduxDispatch(setWorkspaces(list));
        })
        .catch((err) => {
          console.error('Failed to fetch workspaces in AccountPopover', err);
        });
    }
  }, [reduxWorkspaces, user]);

  const handleSelectWorkspace = async (tenantId: string) => {
    setSwitching(tenantId);
    try {
      const selectedWs = workspaces.find((w) => w.tenantId === tenantId);
      if (!selectedWs) throw new Error('Không tìm thấy thông tin không gian làm việc.');

      const refreshToken = getRefreshToken() ?? '';
      const identityRequest = RequestFactory.getRequest('IdentityRequest');
      
      const selectRes = await identityRequest.selectWorkspace(tenantId, refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, tenantBranding } = selectRes.data;

      setSession(newAccessToken, newRefreshToken);

      if (tenantBranding) {
        reduxDispatch(setBranding(tenantBranding));
      }

      const rawRole = user?.role || (newAccessToken ? userFromAccessToken(newAccessToken)?.role : '');
      const dashboardPath = roleToPostLoginLanding(rawRole);
      const fallbackSub = selectedWs.subdomain || null;
      const targetDomain = selectedWs.domain || (fallbackSub ? `${fallbackSub}.${ROOT_DOMAIN}` : null);

      let targetUrl = buildPortalUrl({
        targetDomain,
        fallbackSubdomain: fallbackSub,
        path: dashboardPath,
      });

      if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
        const connector = targetUrl.includes('?') ? '&' : '?';
        targetUrl = `${targetUrl}${connector}accessToken=${newAccessToken}${newRefreshToken ? `&refreshToken=${newRefreshToken}` : ''}`;
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(err?.message || 'Không thể chuyển đổi không gian làm việc này.', { variant: 'error' });
      setSwitching(null);
    }
  };

  const MENU_OPTIONS = [
    {
      label: 'Cài đặt',
      linkTo: isTenantAdmin ? '/tenant-admin/user/account' : isAdmin ? PATH_ADMIN.userAccount : '/client/user/account',
    },
  ];

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace(PATH_AUTH.login);

      if (isMountedRef.current) {
        handleClose();
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Không thể đăng xuất!', { variant: 'error' });
    }
  };

  return (
    <>
      <IconButtonAnimate
        onClick={handleOpen}
        sx={{
          p: 0,
          ...(open && {
            '&:before': {
              zIndex: 1,
              content: "''",
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              position: 'absolute',
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.8),
            },
          }),
        }}
      >
        <MyAvatar />
      </IconButtonAnimate>

      <MenuPopover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        sx={{
          p: 0,
          mt: 1.5,
          ml: 0.75,
          '& .MuiMenuItem-root': {
            typography: 'body2',
            borderRadius: 0.75,
          },
        }}
      >
        <Box sx={{ my: 1.5, px: 2.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack sx={{ p: 1 }}>
          {MENU_OPTIONS.map((option) => (
            <MenuItem
              key={option.label}
              component={NextLink}
              href={option.linkTo}
              onClick={handleClose}
              sx={{ color: 'text.primary' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Stack>

        {workspaces.length > 1 && (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ px: 2.5, py: 1 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', fontSize: 10 }}>
                Không gian làm việc
              </Typography>
            </Box>
            <Stack sx={{ p: 1, maxWidth: 260 }}>
              {workspaces.map((ws) => {
                const isCurrent = ws.tenantId === user?.tenantId;
                const isSelecting = switching === ws.tenantId;

                return (
                  <MenuItem
                    key={ws.tenantId}
                    disabled={isCurrent || isSelecting || Boolean(switching)}
                    onClick={() => handleSelectWorkspace(ws.tenantId)}
                    sx={{
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 1,
                      ...(isCurrent && {
                        bgcolor: 'action.selected',
                      }),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: 1 }}>
                      {ws.logoUrl ? (
                        <Box
                          component="img"
                          src={ws.logoUrl}
                          sx={{ width: 20, height: 20, borderRadius: '4px', objectFit: 'contain' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '4px',
                            bgcolor: 'primary.lighter',
                            color: 'primary.darker',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 'bold',
                          }}
                        >
                          {ws.name.charAt(0)}
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontSize: 12, fontWeight: isCurrent ? 'bold' : 'regular' }}>
                          {ws.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 10 }} noWrap>
                          {ws.domain || (ws.subdomain ? `${ws.subdomain}.${ROOT_DOMAIN}` : '')}
                        </Typography>
                      </Box>
                      {isCurrent && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                      )}
                    </Stack>
                  </MenuItem>
                );
              })}
            </Stack>
          </>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem onClick={handleLogout} sx={{ m: 1 }}>
          Đăng xuất
        </MenuItem>
      </MenuPopover>
    </>
  );
}
