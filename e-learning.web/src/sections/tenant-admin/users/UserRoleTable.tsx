// react
import { useEffect } from 'react';
// @mui
import {
  Box,
  Table,
  Avatar,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  Button,
  Stack,
  alpha,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { getTenantMembers, revokeTenantRole } from '../../../redux/slices/tenantMember';
// components
import Scrollbar from '../../../components/Scrollbar';
import Label from '../../../components/Label';
import Iconify from '../../../components/Iconify';

// ----------------------------------------------------------------------

export default function UserRoleTable() {
  const dispatch = useDispatch();
  const { members, isLoading } = useSelector((state) => state.tenantMember);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.tenantId) {
      dispatch(getTenantMembers(user.tenantId));
    }
  }, [dispatch, user?.tenantId]);

  const handleRevoke = (userId: string) => {
    if (user?.tenantId && window.confirm('Bạn có chắc chắn muốn thu hồi quyền của nhân sự này?')) {
      dispatch(revokeTenantRole(userId, user.tenantId));
    }
  };

  if (isLoading && members.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: 300 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Nhân sự</TableCell>
            <TableCell>Định danh gốc</TableCell>
            <TableCell>Vai trò tại mảng (Tenant Role)</TableCell>
            <TableCell>Ngày cấp quyền</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <UserRow 
              key={member.userId}
              name={member.fullName}
              email={member.email}
              platformIdentity={member.roleName}
              role={member.roleCode}
              roleColor={
                member.roleCode === 'TENANT_ADMIN' ? 'success' : 
                member.roleCode === 'CONTENT_REVIEWER' ? 'secondary' : 'info'
              }
              date={member.assignedAt ? new Date(member.assignedAt).toLocaleDateString('vi-VN') : ''}
              by={member.isInherited ? 'Kế thừa' : ''}
              avatar={member.avatarUrl || undefined}
              canRevoke={!member.isInherited && member.roleCode !== 'TENANT_ADMIN'}
              onRevoke={() => handleRevoke(member.userId)}
            />
          ))}

          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.disabled' }}>
                Chưa có nhân sự nào được gán quyền trong mảng này
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ----------------------------------------------------------------------

type UserRowProps = {
  name: string;
  email: string;
  platformIdentity: string;
  subIdentity?: string;
  role: string;
  roleColor: 'success' | 'secondary' | 'info' | 'warning' | 'error' | 'default';
  date: string;
  by: string;
  avatar?: string;
  canRevoke?: boolean;
  onRevoke?: VoidFunction;
  isSpecial?: boolean;
};

function UserRow({ name, email, platformIdentity, subIdentity, role, roleColor, date, by, avatar, canRevoke = true, onRevoke, isSpecial }: UserRowProps) {
  return (
    <TableRow hover sx={{ bgcolor: isSpecial ? alpha('#10b981', 0.05) : 'inherit' }}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar src={avatar} alt={name} sx={{ width: 40, height: 40, bgcolor: 'emerald.lighter', color: 'emerald.darker', fontWeight: 'bold' }}>
            {name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>{email}</Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: subIdentity ? 'primary.main' : 'text.secondary' }}>
          {platformIdentity}
        </Typography>
        {subIdentity && (
          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: 10 }}>
            {subIdentity}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Label variant="ghost" color={roleColor}>
          {role}
        </Label>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{date}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', fontSize: 10 }}>Bởi: {by}</Typography>
      </TableCell>
      <TableCell align="right">
        {canRevoke ? (
          <Tooltip title="Thu hồi quyền">
            <IconButton size="small" color="error" onClick={onRevoke}>
              <Iconify icon="eva:trash-2-outline" width={20} height={20} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Quyền kế thừa (Không thể thu hồi)">
            <IconButton size="small" disabled>
              <Iconify icon="eva:lock-fill" width={20} height={20} />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}
