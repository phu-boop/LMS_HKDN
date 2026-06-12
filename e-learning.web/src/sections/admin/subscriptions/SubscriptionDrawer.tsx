import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/router';
// @mui
import {
  Box,
  Stack,
  Drawer,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  useRadioGroup,
  Radio,
  RadioGroup,
  styled,
  alpha,
  FormHelperText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { fetchProgramTenants } from '../../../redux/slices/programTenant';
import { 
  createSubscription, 
  updateSubscription,
  fetchSubscriptions,
  fetchSubscriptionsBySchool 
} from '../../../redux/slices/subscription';
// utils
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { extractSchoolsFromListResponse } from '../schools/schoolApiHelpers';
// components
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import { useGetSchoolsQuery } from '../../../redux/api/schoolApi';

// ----------------------------------------------------------------------

const RadioCardStyle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'checked',
})<{ checked: boolean }>(({ checked, theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 1.5,
  border: `1px solid ${checked ? theme.palette.primary.main : theme.palette.divider}`,
  transition: theme.transitions.create(['all']),
  backgroundColor: checked ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
}));

const RadioIndicator = styled('div', {
  shouldForwardProp: (prop) => prop !== 'checked',
})<{ checked: boolean }>(({ checked, theme }) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: checked ? '5px solid' : '2px solid',
  borderColor: checked ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: theme.palette.common.white,
  transition: theme.transitions.create(['all']),
  flexShrink: 0,
  marginTop: theme.spacing(0.5),
}));

function RoleOption({ value, label, description }: { value: string; label: string; description: string }) {
  const radioGroup = useRadioGroup();
  const checked = radioGroup ? radioGroup.value === value : false;

  return (
    <FormControlLabel
      value={value}
      control={<Radio sx={{ display: 'none' }} />}
      label={
        <RadioCardStyle checked={checked}>
          <RadioIndicator checked={checked} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: checked ? 'primary.main' : 'text.primary', fontWeight: 'bold' }}>
              {label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              {description}
            </Typography>
          </Box>
        </RadioCardStyle>
      }
      sx={{ m: 0, width: 1, '& .MuiFormControlLabel-label': { width: 1 } }}
    />
  );
}

// ----------------------------------------------------------------------


type Props = {
  open: boolean;
  onClose: VoidFunction;
  editingItem?: any;
  preselectedSchoolId?: string;
};

export default function SubscriptionDrawer({ open, onClose, editingItem, preselectedSchoolId }: Props) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { schoolId: querySchoolId } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const { items: tenants } = useSelector((state) => state.programTenant);
  const { isLoading: isSubmitting } = useSelector((state) => state.subscription);

  const { data: schools = [], isLoading: isLoadingSchools } = useGetSchoolsQuery(undefined, {
    skip: !open,
  });

  const [form, setForm] = useState<{
    schoolId: string;
    tenantIds: string[];
    startDate: string;
    endDate: string;
    maxSessions: number | '';
    loginPolicy: 'BLOCK_NEW' | 'KICK_OLDEST';
    strictExpiry: boolean;
    status: 'active' | 'inactive';
  }>({
    schoolId: '',
    tenantIds: [] as string[],
    startDate: '',
    endDate: '',
    maxSessions: 500,
    loginPolicy: 'BLOCK_NEW',
    strictExpiry: true,
    status: 'active',
  });

  useEffect(() => {
    if (open) {
      dispatch(fetchProgramTenants());
    }
  }, [dispatch, open]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingItem) {
      setForm({
        schoolId: editingItem.schoolId,
        tenantIds: [editingItem.tenantId],
        startDate: editingItem.startDate,
        endDate: editingItem.endDate,
        maxSessions: editingItem.maxSessions,
        loginPolicy: editingItem.loginPolicy,
        strictExpiry: editingItem.strictExpiry,
        status: editingItem.status === 'expired' ? 'active' : editingItem.status,
      });
    } else {
      setForm({
        schoolId: preselectedSchoolId || '',
        tenantIds: [],
        startDate: '',
        endDate: '',
        maxSessions: 500,
        loginPolicy: 'BLOCK_NEW',
        strictExpiry: true,
        status: 'active',
      });
    }
    setErrors({});
  }, [editingItem, open]);

  const onSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.schoolId) newErrors.schoolId = 'Vui lòng chọn Trường học';
    if (form.tenantIds.length === 0) newErrors.tenantIds = 'Vui lòng chọn Chương trình';
    if (!form.startDate) newErrors.startDate = 'Vui lòng chọn Ngày bắt đầu';
    if (!form.endDate) newErrors.endDate = 'Vui lòng chọn Ngày kết thúc';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      newErrors.endDate = 'Ngày kết thúc không được nhỏ hơn Ngày bắt đầu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      // Map form fields to backend expectations
      const payload: any = {
        contractStart: form.startDate,
        contractEnd: form.endDate,
        maxConcurrentSessions: form.maxSessions || 1,
        loginPolicy: form.loginPolicy,
        enforceExpiry: form.strictExpiry,
      };

      if (editingItem) {
        payload.tenantId = form.tenantIds[0];
        await dispatch(updateSubscription(form.schoolId, editingItem.id, payload));
        enqueueSnackbar('Đã cập nhật hợp đồng thành công', { variant: 'success' });
      } else {
        payload.tenantIds = form.tenantIds;
        await dispatch(createSubscription(form.schoolId, payload));
        enqueueSnackbar('Đã tạo hợp đồng mới thành công', { variant: 'success' });
      }

      // Refetch logic to make changes visible instantly
      dispatch(fetchSubscriptions());
      const targetSchoolId = preselectedSchoolId || querySchoolId || form.schoolId;
      if (targetSchoolId) {
        dispatch(fetchSubscriptionsBySchool(targetSchoolId as string));
      }

      onClose();
    } catch (err) {
      console.error('Subscription save error:', err);
      enqueueSnackbar('Có lỗi xảy ra khi lưu hợp đồng', { variant: 'error' });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{
        sx: { width: { xs: '100%', sm: 520 } },
      }}
    >
      <Box sx={{ p: 3, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: 'background.neutral' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">{editingItem ? 'Cập nhật Hợp đồng' : 'Thiết lập Hợp đồng mới'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {editingItem 
                ? `Chỉnh sửa giới hạn truy cập cho trường ${editingItem.schoolName}`
                : 'Cấp phép truy cập chương trình cho Trường'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </Box>

      <Scrollbar sx={{ flexGrow: 1 }}>
        <Stack spacing={4} sx={{ p: 3 }}>
          {/* Step 1 */}
          <Stack spacing={2.5}>
            <SectionHeader number={1} title="Đối tượng áp dụng" />
            <FormControl fullWidth disabled={!!editingItem || !!preselectedSchoolId} error={!!errors.schoolId}>
              <InputLabel>Chọn Trường học</InputLabel>
              <Select 
                label="Chọn Trường học" 
                value={form.schoolId}
                onChange={(e) => { setForm({ ...form, schoolId: e.target.value }); setErrors({ ...errors, schoolId: '' }); }}
              >
                {isLoadingSchools && (
                  <MenuItem disabled value="">
                    Đang tải danh sách trường học...
                  </MenuItem>
                )}
                {!isLoadingSchools && schools.length === 0 && (
                  <MenuItem disabled value="">
                    Không tìm thấy trường học nào
                  </MenuItem>
                )}
                {schools.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.schoolName}</MenuItem>
                ))}
              </Select>
              {errors.schoolId && <FormHelperText>{errors.schoolId}</FormHelperText>}
            </FormControl>
            <FormControl fullWidth disabled={!!editingItem} error={!!errors.tenantIds}>
              <InputLabel>Gắn vào Chương trình</InputLabel>
              <Select 
                multiple
                label="Gắn vào Chương trình" 
                value={form.tenantIds}
                onChange={(e) => { setForm({ ...form, tenantIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }); setErrors({ ...errors, tenantIds: '' }); }}
                renderValue={(selected) => (
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {selected.map((value) => {
                      const tenant = tenants.find(t => t.id === value);
                      return (
                        <Box key={value} sx={{ bgcolor: 'info.lighter', px: 1, py: 0.5, borderRadius: 1, fontSize: 12, color: 'info.darker', fontWeight: 'bold' }}>
                          {tenant?.name || value}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              >
                {tenants.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
              {errors.tenantIds && <FormHelperText>{errors.tenantIds}</FormHelperText>}
            </FormControl>
          </Stack>

          <Box sx={{ borderTop: (theme) => `1px dashed ${theme.palette.divider}` }} />

          {/* Step 2 */}
          <Stack spacing={2.5}>
            <SectionHeader number={2} title="Thời hạn Hợp đồng" />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: '' }); }}
                error={!!errors.startDate}
                helperText={errors.startDate}
              />
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: form.startDate }}
                value={form.endDate}
                onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: '' }); }}
                error={!!errors.endDate}
                helperText={errors.endDate}
              />
            </Stack>
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1.5, border: (theme) => `1px solid ${theme.palette.divider}` }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={form.strictExpiry} 
                    onChange={(e) => setForm({ ...form, strictExpiry: e.target.checked })} 
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">Kích hoạt Strict Expiry</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Hệ thống sẽ tự động chặn toàn bộ truy cập khi quá ngày kết thúc.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>

          <Box sx={{ borderTop: (theme) => `1px dashed ${theme.palette.divider}` }} />

          {/* Step 3 */}
          <Stack spacing={2.5}>
            <SectionHeader number={3} title="Giới hạn Truy cập (Sessions)" />
            <TextField
              fullWidth
              label="Số lượng thiết bị truy cập đồng thời tối đa"
              type="number"
              value={form.maxSessions === '' ? '' : form.maxSessions}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, maxSessions: val === '' ? '' : Number(val) });
              }}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1 }}>👥</Box>
                ),
              }}
              helperText="Tổng số lượng Giáo viên/Học sinh của trường này được phép online cùng lúc trong mảng này."
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Chính sách khi vượt quá giới hạn (Login Policy) <span style={{ color: 'red' }}>*</span>
              </Typography>
              <RadioGroup 
                value={form.loginPolicy}
                onChange={(e) => setForm({ ...form, loginPolicy: e.target.value as any })}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <RoleOption 
                    value="BLOCK_NEW" 
                    label="BLOCK_NEW (Chặn đăng nhập mới)" 
                    description="Khi đạt giới hạn (VD: 500 người đang học), người thứ 501 cố gắng đăng nhập sẽ bị hệ thống từ chối truy cập." 
                  />
                  <RoleOption 
                    value="KICK_OLDEST" 
                    label="KICK_OLDEST (Đăng xuất phiên cũ)" 
                    description="Hệ thống luôn ưu tiên người mới. Khi đạt giới hạn, người thứ 501 đăng nhập sẽ ép tài khoản đã online lâu nhất bị văng ra ngoài." 
                  />
                </Box>
              </RadioGroup>
            </Box>
          </Stack>
        </Stack>
      </Scrollbar>

      <Box sx={{ p: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            onClick={onSave}
            sx={{ py: 1.5, borderRadius: 1.5, fontSize: 16, fontWeight: 'bold' }}
          >
            {editingItem ? 'Lưu thay đổi' : 'Hoàn tất Gắn quyền'}
          </LoadingButton>
        </Stack>
      </Box>
    </Drawer>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        {number}
      </Box>
      <Typography variant="overline" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
        {title}
      </Typography>
    </Stack>
  );
}
