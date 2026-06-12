import { useState, ReactElement } from 'react';
// @mui
import { Box, Stack, Button, Container, Typography, TextField, InputAdornment, Alert } from '@mui/material';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';
// sections
import {
  UserRoleTable,
  UserRoleDrawer,
} from '../../sections/tenant-admin/users';

// ----------------------------------------------------------------------

TenantAdminUsers.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard">{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminUsers() {
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <Page title="Nhân sự & Nhóm quyền">
      <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Nhân sự & Nhóm quyền
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Phân bổ vai trò quản trị, biên tập và kiểm duyệt nội dung trong mảng STEM
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, sm: 0 } }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm nhân sự..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenDrawer(true)}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Gán Vai trò mới
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mb: 3, border: '1px solid', borderColor: 'info.light', bgcolor: 'info.lighter' }}>
          <Typography variant="subtitle2" sx={{ color: 'info.darker' }}>Lưu ý phân quyền:</Typography>
          <Typography variant="caption" sx={{ color: 'info.darker' }}>
            Màn hình này chỉ dùng để gán vai trò vận hành (Admin, Creator, Reviewer) cho đội ngũ chuyên môn của mảng. Học sinh và Giáo viên thông thường không cần hiển thị ở đây, quyền truy cập của họ được tự động kế thừa từ mục <strong>Cấp phép & Hợp đồng</strong>.
          </Typography>
        </Alert>

        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <UserRoleTable />
        </Box>
      </Container>

      <UserRoleDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      />
    </Page>
  );
}
