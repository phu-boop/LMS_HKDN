import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
// @mui
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TableHead,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  Skeleton,
} from '@mui/material';

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || /^[0-9a-f]{24}$/i.test(str);
}
// routes
import { PATH_ADMIN } from '../../../routes/paths';
// components
import Page from '../../../components/Page';
import Label from '../../../components/Label';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import HeaderBreadcrumbs from '../../../components/HeaderBreadcrumbs';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import {
  fetchSubscriptions,
  fetchSubscriptionsBySchool,
  deleteSubscription,
} from '../../../redux/slices/subscription';
// hooks
import useResponsive from '../../../hooks/useResponsive';
// utils
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { extractSchoolsFromListResponse } from '../schools/schoolApiHelpers';
import { fetchProgramTenants } from '../../../redux/slices/programTenant';
//
import SubscriptionDrawer from './SubscriptionDrawer';

// ----------------------------------------------------------------------

export default function SubscriptionList() {
  const router = useRouter();
  const { schoolId } = router.query;
  const dispatch = useDispatch();
  const isMobile = useResponsive('down', 'sm');
  const { items, isLoading, loaded } = useSelector((state) => state.subscription);
  const { items: tenants } = useSelector((state) => state.programTenant);
  const [schools, setSchools] = useState<any[]>([]);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.schoolsList, {
          params: { page: 1, pageSize: 1000, status: '', search: '' },
        });
        setSchools(extractSchoolsFromListResponse(res.data));
      } catch (err) {
        console.error('Failed to load schools', err);
      }
    };
    loadSchools();
  }, []);

  useEffect(() => {
    dispatch(fetchProgramTenants());
  }, [dispatch]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSubscriptionsBySchool(schoolId as string));
    } else {
      dispatch(fetchSubscriptions());
    }
  }, [dispatch, schoolId]);

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

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const school = schools.find((s) => s.id === item.schoolId);
      const tenant = tenants.find((t) => t.id === item.tenantId);
      return {
        ...item,
        schoolName: school?.schoolName || item.schoolName,
        tenantName: tenant?.name || item.tenantName,
      };
    });
  }, [items, schools, tenants]);

  const filteredItems = enrichedItems.filter((row) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      row.schoolName.toLowerCase().includes(q) ||
      row.tenantName.toLowerCase().includes(q) ||
      row.schoolTaxId?.toLowerCase().includes(q)
    );
  });

  const dataInPage = useMemo(() => {
    return filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  return (
    <Page title="Cấp phép & Hợp đồng">
      <Container maxWidth={false}>
        <HeaderBreadcrumbs
          heading="Cấp phép & Hợp đồng"
          links={[
            { name: 'Admin', href: PATH_ADMIN.root },
            { name: 'Cấp phép & Hợp đồng' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenDrawer}
            >
              Tạo Hợp đồng mới
            </Button>
          }
        />

        <Card>
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' } 
          }}>
            <Autocomplete
              size="small"
              options={schools}
              getOptionLabel={(option) => option.schoolName}
              value={schools.find((s) => s.id === schoolId) || null}
              onChange={(_event, newValue) => {
                if (newValue) {
                  router.push({
                    pathname: router.pathname,
                    query: { ...router.query, schoolId: newValue.id },
                  });
                } else {
                  const { schoolId, ...query } = router.query;
                  router.push({
                    pathname: router.pathname,
                    query,
                  });
                }
              }}
              sx={{ width: { xs: 1, sm: 300 } }}
              renderInput={(params) => <TextField {...params} label="Lọc theo trường học" />}
            />
            
            <TextField
              size="small"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: 1, sm: 320 } }}
            />
          </Box>

          <TableContainer sx={{ minWidth: isMobile ? 'auto' : 800, position: 'relative' }}>
            <Scrollbar>
              <Table size="medium">
                {!isMobile && (
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 240, maxWidth: 280 }}>Trường học</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Chương trình</TableCell>
                      <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap' }}>Thời hạn hợp đồng</TableCell>
                      <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap' }}>Giới hạn truy cập</TableCell>
                      <TableCell align="right" sx={{ minWidth: 140 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                )}
                <TableBody>
                  {dataInPage.map((row) => {
                    if (isMobile) {
                      return (
                        <TableRow key={row.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <TableCell colSpan={5} sx={{ p: 2 }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {isUUID(row.schoolName) ? <Skeleton variant="text" width={200} /> : row.schoolName}
                                </Typography>
                              </Stack>

                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, p: 1.5, bgcolor: 'background.neutral', borderRadius: 1 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Chương trình
                                  </Typography>
                                  <Box sx={{ mt: 0.5 }}>
                                    {isUUID(row.tenantName) ? (
                                      <Skeleton variant="text" width={120} />
                                    ) : (
                                      <Label variant="ghost" color="info">
                                        {row.tenantName}
                                      </Label>
                                    )}
                                  </Box>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Thời hạn hợp đồng
                                  </Typography>
                                  <Typography variant="body2">{`${row.startDate} - ${row.endDate}`}</Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: row.remainingDays <= 7 ? 'error.main' : 'success.main',
                                      fontWeight: 'bold',
                                      display: 'block',
                                      mt: 0.5,
                                    }}
                                  >
                                    {row.remainingDays < 0
                                      ? 'Đã hết hạn'
                                      : row.remainingDays === 0
                                      ? 'Hôm nay là hạn (Còn 0 ngày)'
                                      : row.remainingDays <= 7
                                      ? `Sắp hết hạn (Còn ${row.remainingDays} ngày)`
                                      : `Còn ${row.remainingDays} ngày`}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                    Giới hạn truy cập
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Tối đa: {row.maxSessions} phiên
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Chính sách: {row.loginPolicy === 'BLOCK_NEW' ? 'Chặn đăng nhập mới' : 'Đăng xuất phiên cũ'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleEdit(row)}
                                >
                                  Cấu hình
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
                                      dispatch(deleteSubscription(row.schoolId, row.id));
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
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Tooltip title={row.schoolName}>
                            <Typography variant="subtitle2" noWrap>
                              {isUUID(row.schoolName) ? <Skeleton variant="text" width={200} /> : row.schoolName}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {isUUID(row.tenantName) ? (
                            <Skeleton variant="text" width={120} />
                          ) : (
                            <Label variant="ghost" color="info">
                              {row.tenantName}
                            </Label>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{`${row.startDate} - ${row.endDate}`}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: row.remainingDays <= 7 ? 'error.main' : 'success.main',
                              fontWeight: 'bold',
                            }}
                          >
                            {row.remainingDays < 0
                              ? 'Đã hết hạn'
                              : row.remainingDays === 0
                              ? 'Hôm nay là hạn (Còn 0 ngày)'
                              : row.remainingDays <= 7
                              ? `Sắp hết hạn (Còn ${row.remainingDays} ngày)`
                              : `Còn ${row.remainingDays} ngày`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Tối đa: {row.maxSessions} phiên
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Chính sách: {row.loginPolicy === 'BLOCK_NEW' ? 'Chặn đăng nhập mới' : 'Đăng xuất phiên cũ'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEdit(row)}
                            >
                              Cấu hình
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
                                  dispatch(deleteSubscription(row.schoolId, row.id));
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
                  {!isLoading && loaded && filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        Không tìm thấy hợp đồng nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </Card>
      </Container>

      <SubscriptionDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        editingItem={editingItem}
      />
    </Page>
  );
}
