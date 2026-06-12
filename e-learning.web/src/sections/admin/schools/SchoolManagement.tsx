import { useRouter } from 'next/router';
import { PATH_ADMIN } from '../../../routes/paths';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Label from '../../../components/Label';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import { fDate } from '../../../utils/formatTime';
import useResponsive from '../../../hooks/useResponsive';
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { sanitizeUiMessage } from '../../../utils/sanitizeUiMessage';
import type { ManagedSchool, SchoolAccessState } from '../../../@types/schoolManagement';
import {
  buildSchoolWritePayload,
  extractSchoolsFromListResponse,
  mapApiSchoolToManaged,
} from './schoolApiHelpers';

/** Geography API integration handles Tỉnh/TP + Quận/Huyện dynamically. */

type FormState = {
  schoolCode: string;
  schoolName: string;
  taxId: string;
  address: string;
  province: string;
  district: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate: string;
  contractEndDate: string;
};

const emptyForm: FormState = {
  schoolCode: '',
  schoolName: '',
  taxId: '',
  address: '',
  province: '',
  district: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contractStartDate: '',
  contractEndDate: '',
};

function safeFDate(value: string): string {
  if (!value?.trim()) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return fDate(value);
}

function contractRangeLabel(start: string, end: string): string {
  const a = safeFDate(start);
  const b = safeFDate(end);
  if (!a && !b) return '—';
  if (a && b) return `${a} - ${b}`;
  return a || b;
}

function getAccessState(item: ManagedSchool): SchoolAccessState {
  if (item.operationStatus === 'inactive') return 'inactive';
  if (!item.endDate?.trim()) return 'active';
  const end = new Date(item.endDate);
  if (Number.isNaN(end.getTime())) return 'active';
  return end.getTime() < Date.now() ? 'blocked_expired' : 'active';
}

function getErrorMessage(error: unknown, fallback: string): string {
  const e = error as
    | {
        response?: {
          data?: { message?: string; title?: string; error?: string; detail?: string } | string;
        };
        message?: string;
      }
    | undefined;
  const data = e?.response?.data;
  if (typeof data === 'string' && data.trim()) return sanitizeUiMessage(data);
  if (data && typeof data === 'object') {
    const msg = data.message ?? data.title ?? data.error ?? data.detail;
    if (typeof msg === 'string' && msg.trim()) return sanitizeUiMessage(msg);
  }
  if (typeof e?.message === 'string' && e.message.trim()) return sanitizeUiMessage(e.message);
  return fallback;
}

export default function SchoolManagement() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useResponsive('down', 'sm');
  const [rows, setRows] = useState<ManagedSchool[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOperation, setFilterOperation] = useState<'all' | 'active' | 'inactive'>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  
  // Geography API
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  // Paging states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await axios.get('/api/provinces');
        const rawData = res.data?.data || res.data || [];
        const dataArr = Array.isArray(rawData) ? rawData : [];
        
        const formatted = dataArr.map((p: any) => ({
          name: p.name || p.title || p.provinceName || p.label,
          code: p.id || p._id || p.code || p.provinceId || p.value,
        }));
        setProvinces(formatted);
      } catch (err) {
        console.error('Provinces fetch error:', err);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      const selectedProv = provinces.find((p) => p.name === form.province);
      if (selectedProv) {
        try {
          const res = await axios.get(`/api/provinces/${selectedProv.code}/wards`);
          const rawData = res.data?.data || res.data || [];
          const dataArr = Array.isArray(rawData) ? rawData : [];
          
          const formatted = dataArr.map((d: any) => ({
            name: d.name || d.title || d.wardName || d.label,
            code: d.id || d._id || d.code || d.wardId || d.value,
          }));
          setDistricts(formatted);
        } catch (err) {
          console.error('Wards fetch error:', err);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [form.province, provinces]);

  useEffect(() => {
    setPage(0);
  }, [search, filterOperation]);

  const provinceMenuOptions = useMemo(() => {
    return provinces.map((p) => ({ value: p.name, label: p.name }));
  }, [provinces]);

  const districtMenuOptions = useMemo(() => {
    return districts.map((d) => ({ value: d.name, label: d.name }));
  }, [districts]);

  const fetchSchoolList = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await axios.get(API_ENDPOINTS.schoolsList, {
        params: { page: 1, pageSize: 1000, status: '', search: '' },
      });
      const nextRows = extractSchoolsFromListResponse(res.data);
      setRows(nextRows);
      if (!nextRows.length) {
        enqueueSnackbar('Danh sách trường học đang trống', { variant: 'info' });
      }
    } catch (error) {
      setRows([]);
      enqueueSnackbar(getErrorMessage(error, 'Không tải được danh sách trường học'), {
        variant: 'error',
      });
    } finally {
      setIsLoadingList(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchSchoolList();
  }, [fetchSchoolList]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (filterOperation !== 'all' && item.operationStatus !== filterOperation) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.schoolCode.toLowerCase().includes(q) ||
        item.schoolName.toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q) ||
        (item.province || '').toLowerCase().includes(q) ||
        (item.district || '').toLowerCase().includes(q) ||
        (item.contactName || '').toLowerCase().includes(q) ||
        (item.contactEmail || '').toLowerCase().includes(q) ||
        (item.contactPhone || '').toLowerCase().includes(q)
      );
    });
  }, [rows, filterOperation, search]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const openCreate = () => {
    setDialogMode('create');
    setEditingId(null);
    setForm({ ...emptyForm });
    setDrawerOpen(true);
  };

  const openEdit = async (item: ManagedSchool) => {
    let resolved = item;
    try {
      const res = await axios.get(API_ENDPOINTS.schoolById(item.id));
      const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const mapped = mapApiSchoolToManaged(raw as Record<string, unknown>);
        if (mapped) resolved = mapped;
      }
      setRows((prev) => prev.map((x) => (x.id === item.id ? resolved : x)));
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, 'Không tải được chi tiết trường học'), {
        variant: 'warning',
      });
    }

    setDialogMode('edit');
    setEditingId(resolved.id);
    setForm({
      schoolCode: resolved.schoolCode,
      schoolName: resolved.schoolName,
      taxId: resolved.taxId || '',
      address: resolved.address || '',
      province: resolved.province || '',
      district: resolved.district || '',
      contactName: resolved.contactName || '',
      contactEmail: resolved.contactEmail || '',
      contactPhone: resolved.contactPhone || '',
      contractStartDate: resolved.startDate || '',
      contractEndDate: resolved.endDate || '',
    });
    setDrawerOpen(true);
  };

  const validateForm = (): boolean => {
    if (!form.schoolCode.trim() || !form.schoolName.trim()) {
      enqueueSnackbar('Mã trường và tên trường là bắt buộc', { variant: 'warning' });
      return false;
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      enqueueSnackbar('Email không đúng định dạng', { variant: 'warning' });
      return false;
    }
    if (form.contactPhone && !/^(0|\+84)\d{9,10}$/.test(form.contactPhone.trim().replace(/[\s.-]/g, ''))) {
      enqueueSnackbar('Số điện thoại không đúng định dạng', { variant: 'warning' });
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!validateForm()) return;

    const payload = buildSchoolWritePayload(form);

    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await axios.post(API_ENDPOINTS.schoolsCreate, payload);
        await fetchSchoolList();
        enqueueSnackbar('Đã tạo trường học', { variant: 'success' });
      } else if (editingId) {
        const res = await axios.put(API_ENDPOINTS.schoolUpdate(editingId), payload);
        const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
        const updated =
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? mapApiSchoolToManaged(raw as Record<string, unknown>)
            : null;
        if (updated) {
          setRows((prev) => prev.map((row) => (row.id === editingId ? updated : row)));
        } else {
          await fetchSchoolList();
        }
        enqueueSnackbar('Đã cập nhật trường học', { variant: 'success' });
      }
      setDrawerOpen(false);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, 'Không lưu được. Vui lòng thử lại.'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleOperationStatus = async (schoolId: string) => {
    const item = rows.find((r) => r.id === schoolId);
    if (!item) return;
    const nextApiStatus = item.operationStatus === 'active' ? 'INACTIVE' : 'ACTIVE';

    try {
      await axios.patch(API_ENDPOINTS.schoolStatus(schoolId), { status: nextApiStatus });
      setRows((prev) =>
        prev.map((row) =>
          row.id === schoolId
            ? {
                ...row,
                apiStatus: nextApiStatus,
                operationStatus: nextApiStatus === 'ACTIVE' ? 'active' : 'inactive',
                updatedAt: new Date().toISOString(),
              }
            : row,
        ),
      );
      enqueueSnackbar(
        nextApiStatus === 'INACTIVE' ? 'Đã ngưng hoạt động trường' : 'Đã kích hoạt lại trường',
        { variant: 'success' },
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, 'Không cập nhật được trạng thái trường'), { variant: 'error' });
    }
  };

  const accessSummary = useMemo(() => {
    const active = rows.filter((x) => getAccessState(x) === 'active').length;
    const blocked = rows.filter((x) => getAccessState(x) === 'blocked_expired').length;
    const inactive = rows.filter((x) => getAccessState(x) === 'inactive').length;
    return { active, blocked, inactive };
  }, [rows]);

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Card sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.25, md: 1.5 }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            flexWrap={{ xs: 'nowrap', sm: 'wrap' }}
            sx={{
              maxWidth: '100%',
              '& .MuiChip-root': {
                maxWidth: '100%',
                justifyContent: 'flex-start',
                height: 'auto',
                py: 0.375,
                borderRadius: 2,
              },
              '& .MuiChip-label': {
                display: 'block',
                px: 1.25,
                py: 0.25,
                whiteSpace: 'normal',
                lineHeight: 1.3,
                textAlign: 'left',
              },
            }}
          >
            <Chip
              size="small"
              label={`Đang hoạt động: ${accessSummary.active}`}
              color="success"
              variant="outlined"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            />
            <Chip
              size="small"
              label={`Ngưng hoạt động: ${accessSummary.inactive}`}
              variant="outlined"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            />
          </Stack>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={openCreate}
            fullWidth
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            Thêm trường
          </Button>
        </Stack>
        {isLoadingList && (
          <Alert sx={{ mt: 2 }} severity="info">
            Đang tải danh sách trường học...
          </Alert>
        )}
      </Card>

      <Card sx={{ p: 2.5 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mã, tên, địa chỉ, tỉnh, liên hệ..."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="operation-filter">Trạng thái</InputLabel>
              <Select
                labelId="operation-filter"
                label="Trạng thái"
                value={filterOperation}
                onChange={(e) => setFilterOperation(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Ngưng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: isMobile ? 'auto' : 800 }}>
              {!isMobile && (
                <TableHead>
                  <TableRow>
                    <TableCell>Trường học</TableCell>
                    <TableCell>Khu vực</TableCell>
                    <TableCell>Liên hệ</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Hành động</TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {paginatedRows.map((item) => {
                  const accessState = getAccessState(item);
                  if (isMobile) {
                    return (
                      <TableRow key={item.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                        <TableCell colSpan={5} sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.schoolName}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.schoolCode}</Typography>
                              </Box>
                              <Box sx={{ ml: 1, flexShrink: 0 }}>
                                {item.operationStatus === 'inactive' && <Label color="warning">Ngưng</Label>}
                                {item.operationStatus === 'active' && accessState === 'blocked_expired' && (
                                  <Label color="error">Hết hạn</Label>
                                )}
                                {item.operationStatus === 'active' && accessState === 'active' && (
                                  <Label color="success">Hoạt động</Label>
                                )}
                              </Box>
                            </Stack>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, p: 1.5, bgcolor: 'background.neutral', borderRadius: 1 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                  Khu vực
                                </Typography>
                                <Typography variant="body2">
                                  {[item.province, item.district].filter(Boolean).join(' · ') || '—'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.address?.trim() || '—'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                  Liên hệ
                                </Typography>
                                <Typography variant="body2">{item.contactName?.trim() || '—'}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {[item.contactPhone, item.contactEmail].filter(Boolean).join(' · ') || ''}
                                </Typography>
                              </Box>
                            </Box>

                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Iconify icon="eva:edit-fill" />}
                                onClick={() => openEdit(item)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color={item.operationStatus === 'active' ? 'warning' : 'success'}
                                startIcon={<Iconify icon={item.operationStatus === 'active' ? 'eva:pause-circle-fill' : 'eva:play-circle-fill'} />}
                                onClick={() => toggleOperationStatus(item.id)}
                              >
                                {item.operationStatus === 'active' ? 'Ngưng' : 'Mở lại'}
                              </Button>
                            </Stack>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Stack spacing={0.3}>
                          <Typography variant="subtitle2">{item.schoolName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.schoolCode}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.3}>
                          <Typography variant="body2">
                            {[item.province, item.district].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.address?.trim() || '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.3}>
                          <Typography variant="body2">{item.contactName?.trim() || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[item.contactPhone, item.contactEmail].filter(Boolean).join(' · ') || ''}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.operationStatus === 'inactive' && <Label color="warning">Ngưng</Label>}
                        {item.operationStatus === 'active' && accessState === 'blocked_expired' && (
                          <Label color="error">Hết hạn</Label>
                        )}
                        {item.operationStatus === 'active' && accessState === 'active' && (
                          <Label color="success">Hoạt động</Label>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Chi tiết/Chỉnh sửa">
                            <IconButton color="primary" onClick={() => openEdit(item)}>
                              <Iconify icon="eva:edit-fill" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={item.operationStatus === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt lại'}>
                            <IconButton
                                color={item.operationStatus === 'active' ? 'warning' : 'success'}
                                onClick={() => toggleOperationStatus(item.id)}
                            >
                              <Iconify
                                  icon={
                                    item.operationStatus === 'active'
                                        ? 'eva:pause-circle-fill'
                                        : 'eva:play-circle-fill'
                                  }
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredRows.length && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography align="center" sx={{ py: 3 }} color="text.secondary">
                        Không có trường học phù hợp bộ lọc
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số hàng mỗi trang:"
        />
      </Card>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 560 },
            boxShadow: (theme) => theme.customShadows.z24,
            bgcolor: 'background.default',
          },
        }}
      >
        <Box
          sx={{
            py: 2.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {dialogMode === 'create' ? 'Thêm Trường học mới' : 'Chi tiết Trường học'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Quản lý định danh và thông tin liên hệ chính thức
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'text.secondary' }}>
            <Iconify icon="eva:close-fill" width={24} height={24} />
          </IconButton>
        </Box>

        <Scrollbar sx={{ flexGrow: 1 }}>
          <Box sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* SECTION 1 */}
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      boxShadow: (theme) => theme.customShadows.primary,
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 13 }}>
                    Thông tin định danh
                  </Typography>
                </Stack>
                
                <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <TextField
                    label="Mã trường"
                    value={form.schoolCode}
                    onChange={(e) => setForm((x) => ({ ...x, schoolCode: e.target.value }))}
                    fullWidth
                    required
                    placeholder="VD: LHP-HCM"
                    disabled={dialogMode === 'edit'}
                  />
                  <TextField
                    label="Mã số thuế"
                    value={form.taxId}
                    onChange={(e) => setForm((x) => ({ ...x, taxId: e.target.value }))}
                    fullWidth
                    placeholder="Nhập MST"
                  />
                  <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <TextField
                      label="Tên trường chính thức"
                      value={form.schoolName}
                      onChange={(e) => setForm((x) => ({ ...x, schoolName: e.target.value }))}
                      fullWidth
                      required
                      placeholder="VD: THPT Lê Hồng Phong"
                    />
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* SECTION 2 */}
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'secondary.main',
                      color: 'secondary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    2
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 13 }}>
                    Vị trí địa lý
                  </Typography>
                </Stack>

                <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  <FormControl fullWidth>
                    <InputLabel id="province-select">Tỉnh / Thành phố</InputLabel>
                    <Select
                      labelId="province-select"
                      label="Tỉnh / Thành phố"
                      value={form.province}
                      onChange={(e) => setForm((x) => ({ ...x, province: e.target.value as string, district: '' }))}
                    >
                      <MenuItem value=""><em>Chọn Tỉnh/Thành phố</em></MenuItem>
                      {provinceMenuOptions.map((o, idx) => (
                        <MenuItem key={`p-${idx}-${o.value}`} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth disabled={!form.province}>
                    <InputLabel id="district-select">Phường / Xã</InputLabel>
                    <Select
                      labelId="district-select"
                      label="Phường / Xã"
                      value={form.district}
                      onChange={(e) => setForm((x) => ({ ...x, district: e.target.value as string }))}
                    >
                      <MenuItem value=""><em>Chọn Phường/Xã</em></MenuItem>
                      {districtMenuOptions.map((o, idx) => (
                        <MenuItem key={`d-${idx}-${o.value}`} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <TextField
                      label="Địa chỉ chi tiết"
                      value={form.address}
                      onChange={(e) => setForm((x) => ({ ...x, address: e.target.value }))}
                      fullWidth
                      placeholder="Số nhà, tên đường, phường/xã..."
                    />
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* SECTION 3 */}
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    3
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 13 }}>
                    Người liên hệ vận hành (POC)
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'grey.800'),
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                      <TextField
                        label="Họ và Tên"
                        value={form.contactName}
                        onChange={(e) => setForm((x) => ({ ...x, contactName: e.target.value }))}
                        fullWidth
                        placeholder="Nhập họ tên người phụ trách"
                      />
                    </Box>
                    <TextField
                      label="Điện thoại"
                      value={form.contactPhone}
                      onChange={(e) => setForm((x) => ({ ...x, contactPhone: e.target.value }))}
                      fullWidth
                      placeholder="090x xxx xxx"
                      type="tel"
                    />
                    <TextField
                      label="Email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((x) => ({ ...x, contactEmail: e.target.value }))}
                      fullWidth
                      type="email"
                      placeholder="email@truong.edu.vn"
                    />
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              {/* SECTION 4 */}
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: 'warning.main',
                      color: 'warning.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    4
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 13 }}>
                    Hợp đồng / Giấy phép
                  </Typography>
                </Stack>

                {dialogMode === 'edit' && editingId ? (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<Iconify icon="eva:file-text-fill" />}
                      onClick={() => {
                        router.push(PATH_ADMIN.schoolSubscriptions(editingId));
                      }}
                      sx={{
                        py: 1,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        '&:hover': {
                          borderStyle: 'dashed',
                          borderWidth: 2,
                        }
                      }}
                    >
                      Xem chi tiết danh sách Hợp đồng / Giấy phép của trường này
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Hợp đồng và giấy phép sẽ được thiết lập sau khi tạo trường học thành công.
                  </Typography>
                )}
              </Stack>

            </Stack>


          </Box>
        </Scrollbar>

        <Box
          sx={{
            p: 3,
            display: 'flex',
            gap: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.default',
          }}
        >
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="inherit"
            onClick={() => setDrawerOpen(false)}
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            loading={saving}
            onClick={onSave}
            sx={{
              boxShadow: (theme) => theme.customShadows.primary,
            }}
          >
            {dialogMode === 'create' ? 'Tạo trường học' : 'Cập nhật thông tin'}
          </LoadingButton>
        </Box>
      </Drawer>
    </Stack>
  );
}
