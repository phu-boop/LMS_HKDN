// next
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
// @mui
import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material';
// routes
import { PATH_AUTH } from '@/routes/paths';
import { ROOT_DOMAIN } from '@/config';
import { roleToPostLoginLanding } from '@/utils/roleLanding';
import { buildPortalUrl } from '@/utils/domainRouting';
// hooks
import useAuth from '@/hooks/useAuth';
// utils
import { setSession } from '@/utils/jwt';
import { getToken, getRefreshToken } from '@/utils/cacheStorage';
import { extractAuthTokens, userFromAccessToken } from '@/utils/authTokens';
import { setAuthState } from '@/redux/slices/auth';
import { setBranding } from '@/redux/slices/tenantBranding';
import { dispatch as reduxDispatch } from '@/redux/store';
// guards
import AuthGuard from '@/guards/AuthGuard';
// components
import Page from '@/components/Page';
import Logo from '@/components/Logo';
// requests
import RequestFactory from '@/requests/RequestFactory';
import type { Workspace } from '@/requests/factory/IdentityRequest';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  padding: '2rem',
}));

// redux
import { useSelector } from '@/redux/store';

// ----------------------------------------------------------------------

const identityRequest = RequestFactory.getRequest('IdentityRequest');

// ----------------------------------------------------------------------

export default function SelectWorkspace() {
  const { logout, user } = useAuth();
  const { push } = useRouter();

  const reduxWorkspaces = useSelector((state) => state.auth.workspaces);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelect = async (tenantId: string) => {
    setSelecting(tenantId);
    setErrorMsg('');
    try {
      const list = (reduxWorkspaces && reduxWorkspaces.length > 0) ? reduxWorkspaces : workspaces;
      const selectedWs = list.find((w) => w.tenantId === tenantId);
      if (!selectedWs) throw new Error('Không tìm thấy thông tin workspace.');

      const refreshToken = getRefreshToken() ?? '';

      // Call select workspace API
      const selectRes = await identityRequest.selectWorkspace(tenantId, refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, tenantBranding } = selectRes.data;

      // Update tokens in local storage/cookies
      setSession(newAccessToken, newRefreshToken);
      
      // Update redux state
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
      setErrorMsg(err?.message || 'Không thể chọn workspace này.');
    } finally {
      setSelecting(null);
    }
  };

  useEffect(() => {
    if (reduxWorkspaces && reduxWorkspaces.length > 0) {
      setWorkspaces(reduxWorkspaces);
    } else {
      setErrorMsg('Không tìm thấy danh sách workspace. Vui lòng đăng nhập lại.');
    }
    setIsLoading(false);
  }, [reduxWorkspaces]);

  const handleLogout = async () => {
    await logout();
    push(PATH_AUTH.login);
  };

  return (
    <AuthGuard>
      <Page title="Chọn Workspace">
        <RootStyle>
          <Container maxWidth="sm">
            <Stack alignItems="center" sx={{ mb: 5 }}>
              <Logo disabledLink withText withColor sx={{ mb: 3 }} />
              <Typography variant="h4" gutterBottom>
                Chọn Không gian làm việc
              </Typography>
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
                Xin chào <strong>{user?.displayName || user?.email}</strong>! Bạn có quyền truy cập
                nhiều mảng. Hãy chọn mảng bạn muốn làm việc:
              </Typography>
            </Stack>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMsg}
              </Alert>
            )}

            {isLoading ? (
              <Stack alignItems="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : workspaces.length === 0 ? (
              <Alert severity="warning">
                Không có workspace nào khả dụng. Vui lòng liên hệ quản trị viên.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {workspaces.map((ws) => (
                  <Grid item xs={12} sm={workspaces.length > 2 ? 6 : 12} key={ws.tenantId}>
                    <Card
                      onClick={() => !selecting && handleSelect(ws.tenantId)}
                      sx={{
                        p: 4,
                        cursor: selecting ? 'default' : 'pointer',
                        border: (theme) =>
                          `2px solid ${selecting === ws.tenantId ? theme.palette.primary.main : 'transparent'
                          }`,
                        bgcolor: 'background.paper',
                        boxShadow: (theme) => theme.customShadows.z12,
                        transition: (theme) =>
                          theme.transitions.create(['all'], {
                            duration: theme.transitions.duration.shorter,
                          }),
                        opacity: selecting && selecting !== ws.tenantId ? 0.6 : 1,
                        '&:hover': !selecting
                          ? {
                            transform: 'translateY(-4px)',
                            borderColor: 'primary.main',
                            boxShadow: (theme) => theme.customShadows.z24,
                          }
                          : {},
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 1.5,
                          bgcolor: 'background.neutral',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {ws.logoUrl ? (
                          <Box
                            component="img"
                            src={ws.logoUrl}
                            alt={ws.name}
                            sx={{ width: 1, height: 1, objectFit: 'contain' }}
                          />
                        ) : (
                          <Logo disabledLink />
                        )}
                      </Box>

                      <Box>
                        <Typography variant="h6" noWrap>
                          {ws.name}
                        </Typography>
                        {ws.subdomain && (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {ws.subdomain}.{ROOT_DOMAIN}
                          </Typography>
                        )}
                      </Box>

                      {selecting === ws.tenantId && (
                        <CircularProgress
                          size={24}
                          sx={{ position: 'absolute', top: 12, right: 12 }}
                        />
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </Box>
          </Container>
        </RootStyle>
      </Page>
    </AuthGuard>
  );
}
