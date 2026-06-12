import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import useResponsive from '../../../hooks/useResponsive';

// @mui
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
  TableHead,
  IconButton,
  Box,
  CircularProgress,
} from '@mui/material';
// routes
import { PATH_ADMIN } from '../../../routes/paths';
// components
import Label from '../../../components/Label';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import HeaderBreadcrumbs from '../../../components/HeaderBreadcrumbs';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { fetchSubscriptionsBySchool, deleteSubscription } from '../../../redux/slices/subscription';
import { useGetSchoolByIdQuery } from '../../../redux/api/schoolApi';
import { fetchProgramTenants } from '../../../redux/slices/programTenant';
//
import SubscriptionDrawer from './SubscriptionDrawer';

// ----------------------------------------------------------------------

type Props = {
  schoolId: string;
};

export default function SchoolSubscriptionDetail({ schoolId }: Props) {
  const dispatch = useDispatch();
  const isMobile = useResponsive('down', 'sm');
  const { items, isLoading, loaded } = useSelector((state) => state.subscription);
  const { items: tenants } = useSelector((state) => state.programTenant);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: schoolDetail } = useGetSchoolByIdQuery(schoolId, { skip: !schoolId });

  useEffect(() => {
    dispatch(fetchProgramTenants());
  }, [dispatch]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSubscriptionsBySchool(schoolId));
    }
  }, [dispatch, schoolId]);

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const tenant = tenants.find((t) => t.id === item.tenantId);
      return {
        ...item,
        tenantName: tenant?.name || item.tenantName,
      };
    });
  }, [items, tenants]);

  const handleOpenDrawer = () => {
    setEditingItem(null);
    setOpenDrawer(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setEditingItem(null);
  };

  const schoolName = schoolDetail?.schoolName || (items.length > 0 && items[0].schoolName !== schoolId ? items[0].schoolName : 'Trường học');

  return (
    <>
      <HeaderBreadcrumbs
        heading={`Hợp đồng & Giấy phép: ${schoolName}`}
        links={[
          { name: 'Admin', href: PATH_ADMIN.root },
          { name: 'Trường học', href: PATH_ADMIN.schools },
          { name: 'Hợp đồng' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenDrawer}
          >
            Cấp phép mới
          </Button>
        }
      />

      <Card>
        {isLoading && !loaded ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Đang tải danh sách hợp đồng...
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ minWidth: isMobile ? 'auto' : 800, position: 'relative' }}>
            <Scrollbar>
              <Table size="medium">
                {!isMobile && (
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>Mảng giảng dạy (Tenant)</TableCell>
                      <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>Thời hạn hiệu lực</TableCell>
                      <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>Giới hạn thiết bị</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Chính sách quá tải</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Trạng thái</TableCell>
                      <TableCell align="right" sx={{ minWidth: 140 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {enrichedItems.map((row) => {
                    if (isMobile) {
                      return (
                        <TableRow key={row.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <TableCell colSpan={6} sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Label variant="ghost" color="info" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                                  {row.tenantName}
                                </Label>
                                <Label
                                  variant="filled"
                                  color={
                                    (row.status === 'active' && 'success') ||
                                    (row.status === 'expired' && 'error') ||
                                    'warning'
                                  }
                                >
                                  {row.status}
                                </Label>
                              </Stack>

                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, p: 1.5, bgcolor: 'background.neutral', borderRadius: 1 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Thời hạn hiệu lực
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {row.startDate} &rarr; {row.endDate}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: row.remainingDays <= 7 ? 'error.main' : 'success.main',
                                      display: 'block',
                                    }}
                                  >
                                    {row.remainingDays <= 0
                                      ? 'Đã hết hạn'
                                      : `Còn lại ${row.remainingDays} ngày`}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Giới hạn & Chính sách
                                  </Typography>
                                  <Typography variant="subtitle2">{row.maxSessions} Sessions</Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Policy: {row.loginPolicy}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {row.strictExpiry ? 'Chặn cứng khi hết hạn' : 'Cho phép truy cập quá hạn'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Iconify icon="eva:edit-fill" />}
                                  onClick={() => handleEdit(row)}
                                >
                                  Sửa
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  startIcon={<Iconify icon="eva:trash-2-outline" />}
                                  onClick={() => {
                                    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
                                      dispatch(deleteSubscription(schoolId, row.id));
                                    }
                                  }}
                                >
                                  Xóa
                                </Button>
                              </Stack>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow hover key={row.id}>
                        <TableCell>
                          <Label variant="ghost" color="info" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {row.tenantName}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {row.startDate} &rarr; {row.endDate}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: row.remainingDays <= 7 ? 'error.main' : 'success.main',
                              display: 'block',
                            }}
                          >
                            {row.remainingDays <= 0
                              ? 'Đã hết hạn'
                              : `Còn lại ${row.remainingDays} ngày`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{row.maxSessions} Sessions</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {row.strictExpiry ? 'Chặn cứng khi hết hạn' : 'Cho phép truy cập quá hạn'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Label variant="outlined" color={row.loginPolicy === 'BLOCK_NEW' ? 'warning' : 'primary'}>
                            {row.loginPolicy}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <Label
                            variant="filled"
                            color={
                              (row.status === 'active' && 'success') ||
                              (row.status === 'expired' && 'error') ||
                              'warning'
                            }
                          >
                            {row.status}
                          </Label>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => handleEdit(row)}>
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
                                  dispatch(deleteSubscription(schoolId, row.id));
                                }
                              }}
                            >
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {loaded && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Iconify icon="eva:file-text-outline" sx={{ mb: 1, width: 48, height: 48, color: 'text.disabled' }} />
                          <Typography variant="h6" gutterBottom>
                            Chưa có hợp đồng nào
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Trường này chưa được cấp phép truy cập vào mảng nào.
                          </Typography>
                          <Button variant="contained" onClick={handleOpenDrawer}>
                            Tạo hợp đồng đầu tiên
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
        )}
      </Card>

      <SubscriptionDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        editingItem={editingItem}
        preselectedSchoolId={schoolId}
      />
    </>
  );
}
