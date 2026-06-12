// next
import NextLink from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
// @mui
import { styled } from '@mui/material/styles';
import {
  Box,
  Card,
  Stack,
  Link,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// routes
import { PATH_AUTH } from '../../routes/paths';
// hooks
import useAuth from '../../hooks/useAuth';
import useResponsive from '../../hooks/useResponsive';
// guards
import GuestGuard from '../../guards/GuestGuard';
// requests
import RequestFactory from '../../requests/RequestFactory';
import type { TenantBranding, IdentifyResponse } from '../../requests/factory/IdentityRequest';
// components
import Page from '../../components/Page';
import Logo from '../../components/Logo';
import Image from '../../components/Image';
// sections
import AuthMethodIcon from '../../sections/auth/AuthMethodIcon';
import { LoginForm } from '../../sections/auth/login';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

const HeaderStyle = styled('header')(({ theme }) => ({
  top: 0,
  zIndex: 9,
  lineHeight: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  padding: theme.spacing(3),
  justifyContent: 'space-between',
  [theme.breakpoints.up('md')]: {
    alignItems: 'flex-start',
    padding: theme.spacing(7, 5, 0, 7),
  },
}));

const SectionStyle = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 464,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  margin: theme.spacing(2, 0, 2, 2),
}));

const ContentStyle = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

const identityRequest = RequestFactory.getRequest('IdentityRequest');

// ----------------------------------------------------------------------

export default function Login() {
  const { query } = useRouter();
  const { method } = useAuth();
  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  // step 1 = nhập identifier, step 2 = nhập password (LoginForm cũ)
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tenantBranding được set khi API trả về (chỉ SINGLE_TENANT)
  const [branding, setBranding] = useState<TenantBranding | null>(null);

  // ── Step 1: gọi POST /identity/identify ─────────────────────────────
  const handleIdentify = async () => {
    const identifier = email.trim();
    if (!identifier) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data } = await identityRequest.identify(identifier);

      // AC: Nếu user thuộc 1 tenant → áp branding white-label
      // AC: Super Admin / multi-tenant → tenantBranding là null/undefined → giữ default
      setBranding((data as IdentifyResponse).tenantBranding ?? null);
      setStep(2);
    } catch (err: any) {
      // AC: Email không tồn tại → lỗi generic (không tiết lộ user có tồn tại không)
      // Luôn hiển thị lỗi chung để bảo mật, trừ khi có lỗi hệ thống cụ thể cần thông báo
      const isNetworkError = !err.response;
      if (isNetworkError) {
        setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      } else {
        setErrorMsg('Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại Email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setBranding(null);
    setErrorMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleIdentify();
  };

  // White-label: chỉ áp khi branding có giá trị (SINGLE_TENANT)
  const logoText = branding?.name || 'LMS';
  const logoColor = branding?.primaryColor || 'inherit';
  const subtitleText = branding
    ? 'Đăng nhập vào không gian làm việc'
    : 'Hệ thống quản lý học tập đa mảng';

  const returnTo = typeof query.returnTo === 'string' ? query.returnTo : null;

  return (
    <GuestGuard>
      <Page title="Login">
        <RootStyle>
          <HeaderStyle>
            <Logo />
          </HeaderStyle>

          {mdUp && (
            <SectionStyle>
              <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 5 }}>
                Chào mừng trở lại
              </Typography>
              <Image
                visibleByDefault
                disabledEffect
                src="/assets/illustrations/illustration_login.png"
                alt="login"
              />
            </SectionStyle>
          )}

          <Container maxWidth="sm">
            <ContentStyle>
              {/* ── STEP 1: Identifier First ─────────────────────────── */}
              {step === 1 && (
                <>
                  <Stack alignItems="center" sx={{ mb: 5, textAlign: 'center' }}>
                    <Typography variant="h3" gutterBottom sx={{ color: logoColor }}>
                      {logoText}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>{subtitleText}</Typography>
                  </Stack>

                  {errorMsg && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {errorMsg}
                    </Alert>
                  )}

                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      autoFocus
                      label="Email đăng nhập"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ví dụ: name@school.edu"
                    />
                    <LoadingButton
                      fullWidth
                      size="large"
                      variant="contained"
                      loading={isLoading}
                      onClick={handleIdentify}
                    >
                      Tiếp tục
                    </LoadingButton>
                  </Stack>
                </>
              )}

              {/* ── STEP 2: Form đăng nhập (LoginForm cũ, email đã điền sẵn) ── */}
              {step === 2 && (
                <>
                  <Stack direction="row" alignItems="center" sx={{ mb: 5 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" gutterBottom>
                        Đăng nhập
                      </Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        Nhập thông tin của bạn bên dưới.
                      </Typography>
                    </Box>
                    <AuthMethodIcon method={method} />
                  </Stack>

                  {/* Email đã identify được truyền vào để điền sẵn */}
                  <LoginForm defaultEmail={email} onBack={handleGoBack} returnTo={returnTo} />
                </>
              )}
            </ContentStyle>
          </Container>
        </RootStyle>
      </Page>
    </GuestGuard>
  );
}
