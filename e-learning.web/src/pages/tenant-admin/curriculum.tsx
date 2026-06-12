import { useState, ReactElement, useRef } from 'react';
// @mui
import { Box, Stack, Button, Container, Typography } from '@mui/material';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';
// redux
import { useDispatch } from '@/redux/store';
import useAuth from '@/hooks/useAuth';
import { deleteLearningNode } from '@/redux/slices/learningStructure';
// sections
import {
  CurriculumTree,
  CurriculumNodeModal,
  CurriculumDeleteModal,
} from '../../sections/tenant-admin/curriculum';
import { CurriculumTreeHandle } from '../../sections/tenant-admin/curriculum/CurriculumTree';

// ----------------------------------------------------------------------

TenantAdminCurriculum.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard">{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminCurriculum() {
  const treeRef = useRef<CurriculumTreeHandle>(null);
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [openNodeModal, setOpenNodeModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    mode: 'create' | 'edit';
    title: string;
    type: string;
    nodeId?: string;
    parentId?: string | null;
    existingValue?: string;
    existingCode?: string;
    existingSortOrder?: number;
  }>({
    mode: 'create',
    title: '',
    type: 'PROGRAM',
    parentId: null,
  });

  const handleAddRoot = () => {
    setModalConfig({
      mode: 'create',
      title: 'Thêm Chương trình mới',
      type: 'PROGRAM',
      parentId: null,
      existingValue: '',
      existingCode: '',
    });
    setOpenNodeModal(true);
  };

  const handleOpenAddChildModal = (title: string, type: string, parentId: string | null) => {
    setModalConfig({
      mode: 'create',
      title,
      type,
      parentId,
      existingValue: '',
      existingCode: '',
    });
    setOpenNodeModal(true);
  };

  const handleOpenEditModal = (
    title: string,
    type: string,
    existingValue: string,
    nodeId: string,
    parentId: string | null,
    existingCode: string,
    existingSortOrder?: number
  ) => {
    setModalConfig({
      mode: 'edit',
      title,
      type,
      nodeId,
      parentId,
      existingValue,
      existingCode,
      existingSortOrder,
    });
    setOpenNodeModal(true);
  };

  const handleDeleteClick = (nodeId: string) => {
    setDeletingNodeId(nodeId);
    setOpenDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingNodeId) {
      try {
        await dispatch(deleteLearningNode(user?.tenantId || null, deletingNodeId));
        setOpenDeleteModal(false);
        setDeletingNodeId(null);
      } catch (error) {
        console.error('Failed to delete node', error);
      }
    }
  };

  return (
    <Page title="Cây Học liệu">
      <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Cây Học liệu
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Xây dựng và sắp xếp khung chương trình giảng dạy
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, sm: 0 } }}>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={() => treeRef.current?.collapseAll()}
            >
              Thu gọn tất cả
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleAddRoot}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              Thêm Chương trình (Root)
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CurriculumTree 
            ref={treeRef}
            onAddChild={handleOpenAddChildModal}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteClick}
          />
        </Box>
      </Container>

      <CurriculumNodeModal
        open={openNodeModal}
        config={modalConfig}
        onClose={() => setOpenNodeModal(false)}
      />

      <CurriculumDeleteModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Page>
  );
}
