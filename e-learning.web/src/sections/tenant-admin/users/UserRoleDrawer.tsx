// @mui
import {
  Box,
  Stack,
  Drawer,
  Button,
  Divider,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Avatar,
  alpha,
  Card,
  Autocomplete,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { getTenantMembers, assignTenantRole } from '../../../redux/slices/tenantMember';
// hooks
import { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useSnackbar } from 'notistack';
// components
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export default function UserRoleDrawer({ open, onClose }: Props) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const { members, isLoading } = useSelector((state) => state.tenantMember);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('CONTENT_REVIEWER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user?.tenantId) {
      dispatch(getTenantMembers(user.tenantId));
    }
    if (!open) {
      setSelectedUser(null);
      setSelectedRole('CONTENT_REVIEWER');
    }
  }, [open, user?.tenantId, dispatch]);

  const handleAssign = async () => {
    if (!selectedUser || !user?.tenantId) return;
    setIsSubmitting(true);
    try {
      await dispatch(assignTenantRole(selectedUser.userId || selectedUser.id, user.tenantId, selectedRole));
      enqueueSnackbar('Gán quyền thành công!');
      onClose();
    } catch (error) {
      enqueueSnackbar('Không thể gán quyền. Vui lòng thử lại.', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = (
    <Scrollbar sx={{ flexGrow: 1 }}>
      <Stack spacing={4} sx={{ p: 3 }}>
        {/* Step 1: Select User */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 24, height: 24, bgcolor: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>1</Box>
            <Typography variant="overline" sx={{ color: 'text.primary' }}>Chọn Người dùng</Typography>
          </Stack>

          {!selectedUser ? (
            <Autocomplete
              fullWidth
              options={members}
              getOptionLabel={(option) => `${option.fullName} (${option.email})`}
              loading={isLoading}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Chọn người dùng từ danh sách nhân sự..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.userId}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={option.avatarUrl} sx={{ width: 32, height: 32 }} />
                    <Box>
                      <Typography variant="body2">{option.fullName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.email}</Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            />
          ) : (
            <Card sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: alpha('#10b981', 0.05), border: '1px solid', borderColor: '#10b981' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
                <Box>
                  <Typography variant="subtitle2">{selectedUser.fullName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selectedUser.email}</Typography>
                </Box>
              </Stack>
              <IconButton size="small" sx={{ color: 'text.disabled' }} onClick={() => setSelectedUser(null)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Card>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Step 2: Assign Role */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ width: 24, height: 24, bgcolor: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold' }}>2</Box>
            <Typography variant="overline" sx={{ color: 'text.primary' }}>Chỉ định Vai trò (Role)</Typography>
          </Stack>

          <RadioGroup value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <Stack spacing={2}>
              <RoleOption 
                value="CONTENT_REVIEWER"
                title="CONTENT_REVIEWER"
                tag="Kiểm duyệt"
                tagColor="#9333ea"
                description="Được phép xem tất cả học liệu nháp, sửa cấu hình tài liệu và quyết định Xuất bản (Publish) hoặc Gỡ bỏ học liệu."
              />
              <RoleOption 
                value="CONTENT_CREATOR"
                title="CONTENT_CREATOR"
                tag="Biên tập viên"
                tagColor="#2563eb"
                description="Chỉ được phép tạo mới, tải file lên và lưu bản Nháp (Draft). Không có quyền trực tiếp Publish học liệu."
              />
              <RoleOption 
                value="TENANT_ANALYST"
                title="TENANT_ANALYST"
                tag="Sắp ra mắt"
                tagColor="#64748b"
                description="Chỉ có quyền xem Dashboard và Xuất báo cáo, không thể tác động vào học liệu."
                disabled
              />
            </Stack>
          </RadioGroup>
        </Box>
      </Stack>
    </Scrollbar>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 500 } },
      }}
    >
      <Box sx={{ p: 3, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">Phân quyền Nhân sự</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Gán vai trò làm việc trong mảng <Box component="span" sx={{ fontWeight: 'bold', color: '#10b981' }}>STEM Edu</Box>
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Box>

      <Divider />

      {renderContent}

      <Divider />

      <Stack direction="row" spacing={2} sx={{ p: 3 }}>
        <Button fullWidth variant="outlined" color="inherit" onClick={onClose}>Hủy bỏ</Button>
        <Button 
          fullWidth 
          variant="contained" 
          color="success" 
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          disabled={!selectedUser || isSubmitting}
          onClick={handleAssign}
        >
          {isSubmitting ? 'Đang gán...' : 'Gán Quyền'}
        </Button>
      </Stack>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

import { useRadioGroup } from '@mui/material/RadioGroup';

type RoleOptionProps = {
  value: string;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  disabled?: boolean;
};

function RoleOption({ value, title, tag, tagColor, description, disabled }: RoleOptionProps) {
  const radioGroup = useRadioGroup();
  const checked = radioGroup ? radioGroup.value === value : false;

  return (
    <FormControlLabel
      value={value}
      disabled={disabled}
      control={<Radio sx={{ display: 'none' }} />}
      label={
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: checked ? '#10b981' : 'divider',
            transition: 'all 0.2s',
            bgcolor: checked ? alpha('#10b981', 0.05) : 'background.paper',
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            ...(disabled && { opacity: 0.6 }),
            ...(!disabled && !checked && { '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.02) } }),
          }}
        >
          <Stack direction="row" spacing={2}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                flexShrink: 0, 
                borderRadius: '50%', 
                border: checked ? '5px solid' : '2px solid', 
                borderColor: checked ? '#10b981' : 'divider', 
                bgcolor: '#fff', 
                mt: 0.5, 
                transition: 'all 0.2s'
              }} 
            />
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ color: checked ? '#10b981' : tagColor, fontWeight: 'bold' }}>
                  {title}
                </Typography>
                <Box sx={{ px: 1, py: 0.2, bgcolor: alpha(tagColor, 0.1), color: tagColor, borderRadius: 0.5, fontSize: 10, fontWeight: 'bold' }}>
                  {tag}
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {description}
              </Typography>
            </Box>
          </Stack>
        </Box>
      }
      sx={{ m: 0, width: 1, '& .MuiFormControlLabel-label': { width: 1 } }}
    />
  );
}

