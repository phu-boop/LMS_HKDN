import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
// form
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import { Stack, Card } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// components
import { FormProvider, RHFTextField } from '../../../../components/hook-form';
// utils
import axios from '../../../../utils/axios';
import { API_ENDPOINTS } from '../../../../constants/apiEndpoints';

// ----------------------------------------------------------------------

type FormValuesProps = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export default function AccountChangePassword() {
  const { enqueueSnackbar } = useSnackbar();

  const ChangePassWordSchema = Yup.object().shape({
    oldPassword: Yup.string().required('Mật khẩu cũ là bắt buộc'),
    newPassword: Yup.string()
      .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
      .required('Mật khẩu mới là bắt buộc'),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Mật khẩu nhập lại không khớp')
      .required('Vui lòng nhập lại mật khẩu mới'),
  });

  const defaultValues = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  const methods = useForm({
    resolver: yupResolver(ChangePassWordSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: FormValuesProps) => {
    try {
      await axios.post(API_ENDPOINTS.authChangePassword, {
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
        refreshToken: null,
      });
      reset();
      enqueueSnackbar('Đổi mật khẩu thành công!');
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'Có lỗi xảy ra khi đổi mật khẩu', { variant: 'error' });
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3} alignItems="flex-end">
          <RHFTextField name="oldPassword" type="password" label="Mật khẩu cũ" />

          <RHFTextField name="newPassword" type="password" label="Mật khẩu mới" />

          <RHFTextField name="confirmNewPassword" type="password" label="Nhập lại mật khẩu mới" />

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Lưu thay đổi
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
}
