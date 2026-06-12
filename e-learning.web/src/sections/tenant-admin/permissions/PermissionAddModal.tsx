// @mui
import {
  Box,
  Stack,
  Dialog,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { getTenantMembers } from '../../../redux/slices/tenantMember';
import { grantPermission, fetchNodesPermissions } from '../../../redux/slices/permission';
import { useGetSchoolsByTenantQuery } from '../../../redux/api/schoolApi';
// hooks
import { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import { useSnackbar } from 'notistack';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export default function PermissionAddModal({ open, onClose }: Props) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { selectedNodeId, checkedNodeIds } = useSelector((state) => state.permission);
  const { members } = useSelector((state) => state.tenantMember);
  const { data: schools = [] } = useGetSchoolsByTenantQuery(undefined, { skip: !open });

  const type = 'SCHOOL' as string;
  const [selectedGrantee, setSelectedGrantee] = useState<any>(null);
  const [perms, setPerms] = useState({
    canView: true,
    canDownload: false,
    canComment: true,
  });

  useEffect(() => {
    if (open && user?.tenantId) {
      dispatch(getTenantMembers(user.tenantId));
    }
  }, [open, dispatch, user?.tenantId]);

  const handleAdd = async () => {
    if (!user?.tenantId || !selectedGrantee || !checkedNodeIds || checkedNodeIds.length === 0) return;

    let hasError = false;
    for (const nodeId of checkedNodeIds) {
      const payload = {
        curriculumNodeId: nodeId,
        schoolId: type === 'SCHOOL' ? selectedGrantee.id : null,
        userId: type === 'USER' ? (selectedGrantee.userId || selectedGrantee.id) : null,
        ...perms,
      };

      try {
        await dispatch(grantPermission(user.tenantId!, payload));
      } catch (err: any) {
        hasError = true;
        enqueueSnackbar(err?.message || 'Không thể thêm phân quyền', { variant: 'error' });
      }
    }

    if (!hasError) {
      enqueueSnackbar('Thêm trường học thành công!', { variant: 'success' });
      if (checkedNodeIds.length == 1) {
        dispatch(fetchNodesPermissions(user.tenantId, checkedNodeIds));
      }
    }

    onClose();
    setSelectedGrantee(null);
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Thêm Trường học</Typography>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 0, fontSize: 24, color: 'text.disabled' }}>&times;</Button>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Chọn trường học</Typography>
            <Autocomplete
              fullWidth
              size="small"
              options={schools}
              getOptionLabel={(option) => option.schoolName}
              value={selectedGrantee}
              onChange={(e, newValue) => setSelectedGrantee(newValue)}
              renderInput={(params) => (
                <TextField {...params} placeholder="Chọn trường học..." />
              )}
            />
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.neutral', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Quyền mặc định khi thêm</Typography>
            <Stack direction="row" justifyContent="space-between">
              <FormControlLabel
                control={<Checkbox checked={perms.canView} onChange={(e) => setPerms({...perms, canView: e.target.checked})} color="success" size="small" />}
                label={<Typography variant="body2">Xem</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={perms.canDownload} onChange={(e) => setPerms({...perms, canDownload: e.target.checked})} color="success" size="small" />}
                label={<Typography variant="body2">Tải xuống</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={perms.canComment} onChange={(e) => setPerms({...perms, canComment: e.target.checked})} color="success" size="small" />}
                label={<Typography variant="body2">Bình luận</Typography>}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Hủy</Button>
        <Button variant="contained" color="success" onClick={handleAdd} disabled={!selectedGrantee}>Thêm vào Danh sách</Button>
      </DialogActions>
    </Dialog>
  );
}
