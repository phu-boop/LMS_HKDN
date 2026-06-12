import { ReactElement } from 'react';
import { Card, Box, Typography } from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';

ClientSecurity.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

export default function ClientSecurity() {
  return (
    <Page title="Client - Security Features">
      <ClientExperienceTemplate
        title="Bảo mật nội dung học liệu"
        subtitle="Các cơ chế bảo vệ nội dung đang được áp dụng cho tài khoản của bạn."
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Dynamic Watermark
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Hiển thị thông tin người xem theo thời gian thực trên video/tài liệu.
            </Typography>
          </Card>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Secure Download
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tải tài liệu qua signed URL có thời hạn, chống chia sẻ trực tiếp.
            </Typography>
          </Card>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Interaction Policy
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Kiểm soát quyền comment, download và hiển thị nội dung theo vai trò.
            </Typography>
          </Card>
        </Box>
      </ClientExperienceTemplate>
    </Page>
  );
}
