import { ReactElement } from 'react';
// @mui
import { Box, Stack, Container, Typography } from '@mui/material';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
// sections
import TenantAuditLogList from '../../sections/tenant-admin/audit-logs/TenantAuditLogList';

// ----------------------------------------------------------------------

TenantAdminAuditLogs.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard" roles={['TENANT_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminAuditLogs() {
  return (
    <Page title="Nhật ký hoạt động">
      <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Nhật ký hoạt động
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Theo dõi và kiểm tra các hành động thao tác hệ thống của người dùng
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
          <TenantAuditLogList />
        </Box>
      </Container>
    </Page>
  );
}
