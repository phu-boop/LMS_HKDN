// next
import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
// redux
import { useDispatch as useReduxDispatch } from '../../../redux/store';
import { setBranding } from '../../../redux/slices/tenantBranding';
import { setWorkspaces } from '../../../redux/slices/auth';
// @mui
import { Link, Stack, Alert, IconButton, InputAdornment, Button } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// config
import { HOST_API_URL, ADMIN_DOMAIN, ROOT_DOMAIN } from '@/config';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
// routes
import { PATH_AUTH } from '../../../routes/paths';
import { roleToPostLoginLanding } from '../../../utils/roleLanding';
import { buildPortalUrl } from '../../../utils/domainRouting';
import { resolveSafeReturnTo } from '../../../utils/returnTo';
// hooks
import useAuth from '../../../hooks/useAuth';
import useIsMountedRef from '../../../hooks/useIsMountedRef';
// utils — đọc user từ token ngay sau login (context chưa re-render kịp)
import { setSession } from '../../../utils/jwt';
import { getToken, getReturnTo, removeReturnTo, getRefreshToken } from '../../../utils/cacheStorage';
import { extractAuthTokens, resolveAuthUser, parseLoginResponse } from '../../../utils/authTokens';
// requests
import RequestFactory from '../../../requests/RequestFactory';
// components
import Iconify from '../../../components/Iconify';
import { FormProvider, RHFTextField, RHFCheckbox } from '../../../components/hook-form';

// ----------------------------------------------------------------------

type LoginErrorPayload = { message?: string; title?: string; error?: string; detail?: string };

function firstNonEmpty(...values: Array<unknown>): string | undefined {
  return values.find((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

function loginErrorMessage(error: unknown): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!axios.isAxiosError(error)) {
    if (isProduction) return 'Service is temporarily unavailable.';
    return (
      firstNonEmpty(error instanceof Error ? error.message : undefined) || 'Login request failed.'
    );
  }

  const data = error.response?.data as LoginErrorPayload | string | undefined;
  const beMessage =
    typeof data === 'string'
      ? data
      : firstNonEmpty(data?.message, data?.title, data?.error, data?.detail);

  if (isProduction) return firstNonEmpty(beMessage) || 'Service is temporarily unavailable.';
  return firstNonEmpty(beMessage, error.message) || 'Login request failed.';
}

// ----------------------------------------------------------------------

type FormValuesProps = {
  email: string;
  password: string;
  remember: boolean;
  afterSubmit?: string;
};

export default function LoginForm({
  defaultEmail = '',
  onBack,
  returnTo,
}: {
  defaultEmail?: string;
  onBack?: VoidFunction;
  returnTo?: string | null;
}) {
  const { login } = useAuth();
  const reduxDispatch = useReduxDispatch();
  const isMountedRef = useIsMountedRef();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const defaultValues = {
    email: defaultEmail,
    password: '',
    remember: true,
  };

  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data: FormValuesProps) => {
    try {
      const responseData = await login(data.email, data.password);

      const { accessToken, refreshToken } = extractAuthTokens(responseData);
      const freshUser = resolveAuthUser(responseData, accessToken);

      const role = freshUser?.role ?? '';

      if (role === 'LMS_ADMIN' || role === 'SUPER_ADMIN') {
        setSession(accessToken, refreshToken ?? null);
        let targetUrl = buildPortalUrl({
          targetDomain: ADMIN_DOMAIN,
          fallbackSubdomain: (freshUser as any)?.subdomain || 'lms-admin',
          path: roleToPostLoginLanding(role),
        });
        if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
          const connector = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${connector}accessToken=${accessToken}${refreshToken ? `&refreshToken=${refreshToken}` : ''}`;
        }
        window.location.href = targetUrl;
        return;
      }

      try {
        const identityRequest = RequestFactory.getRequest('IdentityRequest');
        const wsRes = await identityRequest.getWorkspaces(accessToken);
        
        const wsData = wsRes.data;
        const list: any[] = Array.isArray(wsData)
          ? wsData
          : (wsData as any)?.items ?? (wsData as any)?.data ?? [];
        
        reduxDispatch(setWorkspaces(list));
        setSession(accessToken, refreshToken ?? null);

        if (list.length === 1) {
          const ws = list[0];
          let targetUrl = buildPortalUrl({
            targetDomain: ws.domain || (ws.subdomain ? `${ws.subdomain}.${ROOT_DOMAIN}` : null),
            fallbackSubdomain: ws.subdomain,
            path: roleToPostLoginLanding(role),
          });

          if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
            const connector = targetUrl.includes('?') ? '&' : '?';
            targetUrl = `${targetUrl}${connector}accessToken=${accessToken}${refreshToken ? `&refreshToken=${refreshToken}` : ''}`;
          }
          window.location.href = targetUrl;
          return;
        }
      } catch (wsErr) {
        console.error('[LoginForm] Workspace flow failed:', wsErr);
        // Nếu lỗi lấy workspace, vẫn setSession để user ko bị kẹt
        setSession(accessToken, refreshToken ?? null);
      }

      router.push(PATH_AUTH.selectWorkspace);
    } catch (error) {
      console.error(error);
      reset();
      if (isMountedRef.current) {
        setError('afterSubmit', {
          type: 'manual',
          message: loginErrorMessage(error),
        });
      }
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {!HOST_API_URL && (
          <Alert severity="warning">
            Chưa có URL backend (NEXT_PUBLIC_HOST_API_URL trong .env, rồi restart dev). Khi thiếu
            biến này, bấm Login sẽ không có request trên tab Network (XHR = 0).
          </Alert>
        )}

        {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}

        <RHFTextField
          name="email"
          label="Email"
          disabled
          InputProps={{
            readOnly: true,
            endAdornment: onBack && (
              <InputAdornment position="end">
                <Button size="small" onClick={onBack} sx={{ fontWeight: 'bold' }}>
                  Thay đổi
                </Button>
              </InputAdornment>
            ),
          }}
        />

        <RHFTextField
          name="password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* Hidden Remember me and Forgot password
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
        <RHFCheckbox name="remember" label="Remember me" />
        <Link component={NextLink} href={PATH_AUTH.resetPassword} variant="subtitle2">
          Forgot password?
        </Link>
      </Stack>
      */}

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{ mt: 3 }}
      >
        Đăng nhập
      </LoadingButton>
    </FormProvider>
  );
}
