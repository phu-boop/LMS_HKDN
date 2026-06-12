import { useMemo } from 'react';
// @mui
import {
  Box,
  Card,
  Stack,
  Chip,
  Table,
  Switch,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  TableContainer,
  Tooltip,
} from '@mui/material';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { revokePermission, updatePermission } from '../../../redux/slices/permission';
// hooks
import useAuth from '../../../hooks/useAuth';
import { useGetSchoolsByTenantQuery } from '../../../redux/api/schoolApi';
// components
import Iconify from '../../../components/Iconify';

// ----------------------------------------------------------------------

export default function PermissionGrantTable() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { permissions, checkedNodeIds } = useSelector((state) => state.permission);
  const { nodes } = useSelector((state) => state.learningStructure);

  // Call schools API as requested
  const { data: schools = [] } = useGetSchoolsByTenantQuery();

  const enrichedPermissions = permissions.map((perm) => {
    const isSchool = !!perm.schoolId;
    const gType = isSchool ? 'SCHOOL' : 'USER';
    const gId = isSchool ? perm.schoolId : perm.userId;
    let gName = perm.granteeName;

    if (isSchool && !gName) {
      const school = schools.find((s) => s.id === perm.schoolId);
      gName = school?.schoolName || `School ID: ${perm.schoolId}`;
    }

    return {
      ...perm,
      granteeType: gType,
      granteeId: gId,
      granteeName: gName,
      isInherited: perm.isInherited ?? false,
    };
  });

  // Only show school grantees in this table (we've removed user grants from the UI)
  const schoolPermissions = enrichedPermissions.filter((p) => p.granteeType === 'SCHOOL');

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const isMultiSelect = checkedNodeIds.length > 1;

  const groupedPermissions = useMemo(() => {
    if (!isMultiSelect) {
      return [] as Array<{ permission: typeof schoolPermissions[number]; sourceLabel: string }>;
    }

    const result: Record<string, typeof schoolPermissions[number][]> = {};

    schoolPermissions.forEach((permission) => {
      const nodeId = permission.curriculumNodeId || 'unknown';
      if (!result[nodeId]) {
        result[nodeId] = [];
      }
      result[nodeId].push(permission);
    });

    const orderedNodeIds = checkedNodeIds.filter((id) => result[id])
      .concat(Object.keys(result).filter((id) => !checkedNodeIds.includes(id)));

    return orderedNodeIds.map((nodeId) => ({ nodeId, permissions: result[nodeId] }));
  }, [checkedNodeIds, schoolPermissions, isMultiSelect]);

  const singleNodePermissions = useMemo(() => {
    if (isMultiSelect) {
      return [] as Array<{ permission: typeof schoolPermissions[number]; sourceLabel: string }>;
    }

    return schoolPermissions
      .map((permission) => {
        const sourceNode = permission.sourceNodeId ? nodeMap.get(permission.sourceNodeId) : null;
        const sourceLabel = permission.isInherited
          ? `Kế thừa từ ${sourceNode?.title || 'node cha'}`
          : 'Node hiện tại';
        return { permission, sourceLabel };
      })
      .sort((a, b) => a.permission.granteeName.localeCompare(b.permission.granteeName));
  }, [schoolPermissions, isMultiSelect, nodeMap]);

  const handleRevoke = (id: string) => {
    if (user?.tenantId && window.confirm('Bạn có chắc chắn muốn thu hồi quyền này?')) {
      dispatch(revokePermission(user.tenantId, id));
    }
  };

  const handleToggle = (permission: any, field: string, value: boolean) => {
    if (user?.tenantId) {
      dispatch(updatePermission(user.tenantId, { ...permission, [field]: value }));
    }
  };

  // Note: add action moved to page header; modal is opened from parent page

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader sx={{ minWidth: 700 }}>
          <TableHead sx={{
            '& th': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            }
          }}>
            <TableRow>
              <TableCell sx={{ minWidth: 180, maxWidth: 280 }}>{isMultiSelect ? 'Node' : 'Trường học'}</TableCell>
              {!isMultiSelect && (
                <TableCell sx={{ minWidth: 180, maxWidth: 220 }}>Nguồn quyền</TableCell>
              )}
              <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap' }}>Xem</TableCell>
              <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap' }}>Tải xuống</TableCell>
              <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap' }}>Bình luận</TableCell>
              <TableCell align="center" sx={{ width: 110, whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ width: 60 }}>Xóa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checkedNodeIds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                  {'Vui lòng chọn một thư mục ở cây bên trái để xem hoặc gán quyền.'}
                </TableCell>
              </TableRow>
            )}

            {checkedNodeIds.length > 0 && isMultiSelect && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                  {'Đã chọn nhiều thư mục. Tạm ẩn danh sách quyền cho nhiều thư mục. Vui lòng chọn một thư mục để xem chi tiết.'}
                </TableCell>
              </TableRow>
            )}

            {checkedNodeIds.length > 0 && !isMultiSelect && (
              singleNodePermissions.length > 0 ? (
                singleNodePermissions.map(({ permission, sourceLabel }) => (
                  <PermissionRow
                    key={permission.id}
                    item={permission}
                    label={permission.granteeName}
                    sourceLabel={sourceLabel}
                    onToggle={(field, value) => handleToggle(permission, field, value)}
                    onRevoke={() => handleRevoke(permission.id)}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                    {'Chưa có trường nào được thêm vào thư mục này.'}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

function PermissionRow({ item, label, sourceLabel, onToggle, onRevoke }: { item: any; label: string; sourceLabel?: string; onToggle: (field: string, value: boolean) => void; onRevoke: VoidFunction }) {
  const { canView, canDownload, canComment, isInherited } = item;
  const disabled = !!isInherited;

  return (
    <TableRow hover>
      <TableCell sx={{ maxWidth: 280, minWidth: 180 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ fontSize: 18, flexShrink: 0 }}>{sourceLabel ? '🏫' : '📁'}</Box>
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Tooltip title={label} placement="top-start">
              <Typography variant="subtitle2" noWrap sx={{ maxWidth: 220 }}>{label}</Typography>
            </Tooltip>
          </Box>
        </Stack>
      </TableCell>
      {sourceLabel && (
        <TableCell sx={{ maxWidth: 220, minWidth: 180 }}>
          <Tooltip title={sourceLabel} placement="top-start">
            <Typography variant="body2" noWrap sx={{ maxWidth: 220, color: 'text.secondary' }}>{sourceLabel}</Typography>
          </Tooltip>
        </TableCell>
      )}
      <TableCell align="center">
        <Switch
          size="small"
          checked={canView}
          color="success"
          disabled={disabled}
          onChange={(e) => onToggle('canView', e.target.checked)}
        />
      </TableCell>
      <TableCell align="center">
        <Switch
          size="small"
          checked={canDownload}
          color="success"
          disabled={disabled}
          onChange={(e) => onToggle('canDownload', e.target.checked)}
        />
      </TableCell>
      <TableCell align="center">
        <Switch
          size="small"
          checked={canComment}
          color="success"
          disabled={disabled}
          onChange={(e) => onToggle('canComment', e.target.checked)}
        />
      </TableCell>
      <TableCell align="center">
        {disabled ? (
          <Chip label="Kế thừa" size="small" color="warning" />
        ) : (
          <Chip label="Trực tiếp" size="small" color="success" />
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          color="inherit"
          onClick={onRevoke}
          sx={{ color: disabled ? 'text.disabled' : 'text.secondary', '&:hover': { color: disabled ? 'text.disabled' : 'error.main' } }}
          disabled={disabled}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
