import * as Yup from 'yup';
import { useMemo, useEffect } from 'react';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Box, Stack, Dialog, Button, DialogTitle, DialogContent, DialogActions } from '@mui/material';
// components
import { FormProvider, RHFTextField, RHFSwitch } from '@/components/hook-form';
// types
import { CatalogItem } from '@/types/admin';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  isEdit?: boolean;
  currentCatalog?: CatalogItem;
  type: string;
  adminReq: any;
};

export default function CatalogNewEditForm({
  open,
  onClose,
  onSuccess,
  isEdit,
  currentCatalog,
  type,
  adminReq,
}: Props) {
  const NewCatalogSchema = Yup.object().shape({
    name: Yup.string().required('Tên là bắt buộc'),
    code: Yup.string().required('Mã là bắt buộc'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentCatalog?.name || '',
      code: currentCatalog?.code || '',
      description: currentCatalog?.description || '',
      isActive: currentCatalog?.isActive ?? true,
    }),
    [currentCatalog]
  );

  const methods = useForm({
    resolver: yupResolver(NewCatalogSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (isEdit && currentCatalog) {
      reset(defaultValues);
    }
    if (!isEdit) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, currentCatalog]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && currentCatalog) {
        await adminReq.updateCatalog(type, currentCatalog.id, data);
      } else {
        await adminReq.createCatalog(type, data);
      }
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}</DialogTitle>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={3}>
            <RHFTextField name="name" label="Tên danh mục" />
            <RHFTextField name="code" label="Mã (Code)" disabled={isEdit} />
            <RHFTextField name="description" label="Mô tả" multiline rows={3} />
            <RHFSwitch name="isActive" label="Kích hoạt" labelPlacement="start" sx={{ mx: 0, width: 1, justifyContent: 'space-between' }} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            Hủy
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Cập nhật' : 'Thêm mới'}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
