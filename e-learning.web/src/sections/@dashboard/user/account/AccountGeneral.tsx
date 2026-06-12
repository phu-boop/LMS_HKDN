import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect } from 'react';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Box, Grid, Card, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// hooks
import useAuth from '../../../../hooks/useAuth';
// utils
import { fData } from '../../../../utils/formatNumber';
import { CustomFile } from '../../../../components/upload';
import {
  FormProvider,
  RHFTextField,
  RHFUploadAvatar,
} from '../../../../components/hook-form';

// ----------------------------------------------------------------------

type FormValuesProps = {
  displayName: string;
  email: string;
  photoURL: CustomFile | string | null;
  accountType: string;
};

export default function AccountGeneral() {
  const { enqueueSnackbar } = useSnackbar();

  const { user, updateProfile, getProfile } = useAuth();

  const UpdateUserSchema = Yup.object().shape({
    displayName: Yup.string().required('Tên là bắt buộc'),
  });

  const defaultValues = {
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    photoURL: user?.photoURL ?? '',
    accountType: user?.role ?? '',
  };

  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (getProfile) {
      getProfile().then((profileUser) => {
        if (profileUser) {
          reset({
            displayName: profileUser.displayName ?? '',
            email: profileUser.email ?? '',
            photoURL: profileUser.photoURL ?? (profileUser as any).avatarUrl ?? '',
            accountType: (profileUser as any).accountType ?? (profileUser as any).role ?? '',
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: FormValuesProps) => {
    try {
      if (updateProfile) {
        let avatarUrl: string | null | undefined = undefined;
        if (data.photoURL instanceof File) {
          avatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve(event.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(data.photoURL as File);
          });
        }
        await updateProfile(data.displayName, data.email || '', avatarUrl);
      }
      enqueueSnackbar('Cập nhật thành công!');
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Cập nhật thất bại!', { variant: 'error' });
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (file) {
        setValue(
          'photoURL',
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        );
      }
    },
    [setValue]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <RHFUploadAvatar
              name="photoURL"
              maxSize={3145728}
              onDrop={handleDrop}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  Cho phép *.jpeg, *.jpg, *.png, *.gif
                  <br /> kích thước tối đa {fData(3145728)}
                </Typography>
              }
            />

          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'grid',
                rowGap: 3,
                columnGap: 2,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <RHFTextField name="displayName" label="Tên hiển thị" />
              <RHFTextField name="email" label="Địa chỉ Email" />
              <RHFTextField name="accountType" label="Loại tài khoản" disabled />
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>

              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Lưu thay đổi
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}
