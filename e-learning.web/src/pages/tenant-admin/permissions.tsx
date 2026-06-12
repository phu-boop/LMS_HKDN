import { useState, ReactElement, useEffect } from 'react';
// next
import { useRouter } from 'next/router';
// @mui
import { Box, Stack, Button, Container, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';
// redux
import { useDispatch, useSelector } from '../../redux/store';
import { setSelectedNode, clearSelectedNode } from '../../redux/slices/permission';
import { fetchLearningStructure } from '../../redux/slices/learningStructure';
// hooks
import useAuth from '../../hooks/useAuth';
// sections
import {
  PermissionTree,
  PermissionGrantTable,
  PermissionAddModal,
} from '../../sections/tenant-admin/permissions';

// ----------------------------------------------------------------------

TenantAdminPermissions.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard">{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminPermissions() {
  const [openModal, setOpenModal] = useState(false);
  const { query } = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const nodes = useSelector((state: any) => state.learningStructure.nodes);

  // On every mount: clear any stale selection first, then auto-select from query if present
  useEffect(() => {
    dispatch(clearSelectedNode());

    const nodeId = Array.isArray(query.nodeId) ? query.nodeId[0] : query.nodeId;
    if (!nodeId || !user?.tenantId) return;

    // Ensure learning structure is loaded so the tree can render the selected node
    if (nodes.length === 0) {
      dispatch(fetchLearningStructure(user.tenantId));
    }

    // Find node title from already-loaded nodes if available, fall back to nodeId string
    const node = nodes.find((n: any) => n.id === nodeId);
    dispatch(setSelectedNode({ id: nodeId, title: node?.title || nodeId }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.nodeId, user?.tenantId]);

  // After nodes load, update the title in case it was set before nodes were ready
  useEffect(() => {
    const nodeId = Array.isArray(query.nodeId) ? query.nodeId[0] : query.nodeId;
    if (!nodeId || nodes.length === 0) return;
    const node = nodes.find((n: any) => n.id === nodeId);
    if (node) {
      dispatch(setSelectedNode({ id: node.id, title: node.title }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const { enqueueSnackbar } = useSnackbar();
  const { selectedNodeId, checkedNodeIds } = useSelector((state: any) => state.permission);

  const hasAncestorDescendantConflict = (checkedIds: string[], nodesList: any[]) => {
    if (!checkedIds || checkedIds.length === 0) return false;
    const nodeMap = new Map(nodesList.map((n: any) => [n.id, n]));
    const checkedSet = new Set(checkedIds);

    for (const id of checkedIds) {
      let current = nodeMap.get(id);
      while (current && current.parentId) {
        if (checkedSet.has(current.parentId)) return true;
        current = nodeMap.get(current.parentId);
      }
    }

    return false;
  };

  const inheritanceConflict = hasAncestorDescendantConflict(checkedNodeIds || [], nodes || []);

  const handleAddClick = () => {
    if (!selectedNodeId) {
      enqueueSnackbar('Vui lòng chọn một thư mục/học liệu ở cây thư mục bên trái để gán quyền!', { variant: 'error' });
      return;
    }
    if (!checkedNodeIds || checkedNodeIds.length === 0) {
      enqueueSnackbar('Vui lòng tích chọn ít nhất một thư mục/học liệu để gán quyền!', { variant: 'error' });
      return;
    }
    setOpenModal(true);
  };

  return (
    <Page title="Phân quyền Nội dung">
      <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Phân quyền Nội dung
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Quản lý ma trận truy cập: Ai được phép xem, tải và bình luận tài liệu nào.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box
              sx={(theme) => ({
                display: 'inline-flex',
                p: 1.25,
                flexDirection: 'column',
                borderRadius: 1.25,
                border: `1px solid ${inheritanceConflict ? theme.palette.warning.main : theme.palette.divider}`,
                bgcolor: inheritanceConflict ? alpha(theme.palette.warning.main, 0.06) : 'transparent',
              })}
            >
              <Typography variant="subtitle2" sx={{ color: inheritanceConflict ? 'warning.main' : 'text.primary', fontWeight: 700 }}>
                Quy tắc kế thừa
              </Typography>

              <Typography variant="body2" sx={{ color: inheritanceConflict ? 'warning.main' : 'text.secondary', fontSize: 13, mt: 0.5 }}>
                {inheritanceConflict
                  ? 'Xung đột: Bạn đã chọn cùng lúc thư mục cha và thư mục con. Quyền kế thừa có thể gây mâu thuẫn. Vui lòng điều chỉnh lựa chọn.'
                  : 'Khi chọn thư mục cha, các quyền có thể kế thừa xuống thư mục con. Nếu bạn muốn thiết lập khác nhau cho con, hãy chọn riêng thư mục con.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="eva:plus-fill" />}
                sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, whiteSpace: 'nowrap' }}
                onClick={handleAddClick}
              >
                Thêm Trường học
              </Button>
            </Box>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ flexGrow: 1 }}>
          {/* Left: Content Selection Tree */}
          <Box sx={{ width: { xs: '100%', md: 480, lg: 520 }, flexShrink: 0 }}>
            <PermissionTree />
          </Box>

          {/* Right: Permission Matrix */}
          <Box sx={{ flexGrow: 1 }}>
            <PermissionGrantTable />
          </Box>
        </Stack>
      </Container>

      <PermissionAddModal open={openModal} onClose={() => setOpenModal(false)} />
    </Page>
  );
}
