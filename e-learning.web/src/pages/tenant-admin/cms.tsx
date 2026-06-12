import { useState, ReactElement } from 'react';
import type { CmsContent } from '../../@types/cmsContent';

// @mui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Button,
  Container,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';
// sections
import {
  ContentCmsFolderTree,
  ContentCmsList,
  ContentCmsUploadDrawer,
} from '../../sections/tenant-admin/cms';

// ----------------------------------------------------------------------

TenantAdminCms.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard">{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminCms() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsContent | null>(null);

  const handleOpenUpload = () => {
    setIsEdit(false);
    setOpenDrawer(true);
  };

  const handleEdit = (item: CmsContent) => {
    setEditingItem(item);
    setIsEdit(true);
    setOpenDrawer(true);
  };

  return (
    <Page title="Quản lý Nội dung">
      <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h4" gutterBottom>
              Quản lý Nội dung
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tải lên, quản lý và cấu hình bảo mật cho tài liệu giảng dạy
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ width: { xs: '100%', sm: 250 } }} />
            <Button 
              variant="contained"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={handleOpenUpload}
              sx={{ 
                bgcolor: '#059669', 
                '&:hover': { bgcolor: '#047857' },
                height: 40,
                px: 2.5
              }}
            >
              Tải tài liệu lên
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flexGrow: 1, overflow: { md: 'hidden' } }}>
          {/* Left: Folder Tree */}
          <Box sx={{ width: { xs: '100%', md: 380 }, flexShrink: 0 }}>
            <ContentCmsFolderTree />
          </Box>

          {/* Right: Content List */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <ContentCmsList onEdit={handleEdit} />
          </Box>
        </Stack>
      </Container>

      <ContentCmsUploadDrawer
        open={openDrawer}
        isEdit={isEdit}
        editingItem={editingItem}
        onClose={() => { setOpenDrawer(false); setEditingItem(null); }}
      />
    </Page>
  );
}
