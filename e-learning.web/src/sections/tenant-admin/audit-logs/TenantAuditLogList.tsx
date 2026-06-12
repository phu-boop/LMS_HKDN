import { useState, useEffect, useCallback } from 'react';
// @mui
import {
  Box,
  Card,
  Table,
  Stack,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
  TablePagination,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
// hooks
import useTable, { emptyRows } from '../../../hooks/useTable';
import useSettings from '../../../hooks/useSettings';
import useResponsive from '../../../hooks/useResponsive';
// api
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { useGetSchoolsByTenantQuery } from '../../../redux/api/schoolApi';
// components
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import Label from '../../../components/Label';
import { TableNoData, TableEmptyRows, TableHeadCustom, TableSkeleton } from '../../../components/table';
import { fDateTime } from '../../../utils/formatTime';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'createdAt', label: 'Thời gian', align: 'left' },
  { id: 'username', label: 'Người dùng', align: 'left' },
  { id: 'action', label: 'Hành động', align: 'left' },
  { id: 'ipAddress', label: 'IP Address', align: 'left' },
  { id: 'result', label: 'Kết quả', align: 'center' },
  { id: 'detail', label: 'Chi tiết', align: 'left' },
];

const USER_NAME_MAP: Record<string, string> = {
  '00000000-0000-0000-0004-000000000001': 'Hệ thống (Admin)',
  '00000000-0000-0000-0004-000000000002': 'Học sinh 01',
  '00000000-0000-0000-0004-000000000003': 'Giáo viên 01',
  '00000000-0000-0000-0004-000000000004': 'Phụ huynh 01',
};

// ----------------------------------------------------------------------

export default function TenantAuditLogList() {
  const { themeStretch } = useSettings();
  const isMobile = useResponsive('down', 'sm');
  
  // Fetch schools filtered by user's tenant
  const { data: schools = [] } = useGetSchoolsByTenantQuery();

  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>(USER_NAME_MAP);

  const [userSearchInput, setUserSearchInput] = useState('');
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.usersList, {
          params: { search: userSearchInput, page: 1, pageSize: 50 },
        });
        const items = res.data?.items || res.data?.data?.items || (Array.isArray(res.data) ? res.data : []);
        setUserOptions(items);
      } catch (err) {
        console.error('Failed to fetch user options', err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUserOptions();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchInput]);

  const { 
    dense, 
    page, 
    order, 
    orderBy, 
    rowsPerPage, 
    setPage,
    onSort, 
    onChangePage, 
    onChangeRowsPerPage 
  } = useTable({
    defaultOrderBy: 'occurredAt',
    defaultOrder: 'desc',
  });

  const fetchLogs = useCallback(async () => {
    let params: any = {};
    try {
      setIsLoadingLogs(true);
      let effectiveUserMap = { ...USER_NAME_MAP, ...userMap };
      
      if (Object.keys(userMap).length <= Object.keys(USER_NAME_MAP).length) {
        try {
          const userRes = await axios.get(API_ENDPOINTS.usersList, { params: { page: 1, pageSize: 1000 } });
          const users = userRes.data?.items || userRes.data?.data?.items || (Array.isArray(userRes.data) ? userRes.data : []);
          
          const apiMap: Record<string, string> = {};
          if (Array.isArray(users)) {
            users.forEach((u: any) => {
              const id = (u.id || u.userId || u.sub || '').toLowerCase().trim();
              if (id) {
                apiMap[id] = u.fullName || u.username || u.userName || u.email;
              }
            });
          }
          const merged = { ...USER_NAME_MAP, ...apiMap };
          setUserMap(merged);
          effectiveUserMap = merged;
        } catch (e) {
          console.warn('Could not fetch user list');
        }
      }

      params = {
        page: page + 1,
        pageSize: rowsPerPage,
      };
      if (selectedUser) {
        params.userId = selectedUser.id || selectedUser.userId;
      }
      if (filterSchool !== 'all') params.schoolId = filterSchool;
      if (filterAction !== 'all') params.action = filterAction;
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d, 0, 0, 0, 0);
        if (!isNaN(dateObj.getTime())) {
          params.fromDate = dateObj.toISOString().split('.')[0] + 'Z';
        }
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        if (!isNaN(dateObj.getTime())) {
          params.toDate = dateObj.toISOString().split('.')[0] + 'Z';
        }
      }

      const response = await axios.get(API_ENDPOINTS.tenantAuditLogs, { params });
      const logs = response.data?.items || [];
      const total = response.data?.total || 0;
      
      const mappedLogs = logs.map((log: any) => {
        let ip = '';
        const rawId = String(log.userId || '').trim();
        const lowerId = rawId.toLowerCase();

        let displayName = effectiveUserMap[lowerId] || effectiveUserMap[rawId] || '';
        
        if (!displayName) {
          displayName = log.fullName || log.username || log.userName || log.email || 
                        log.user?.fullName || log.user?.username || 
                        log.actorName || log.actor?.fullName || '';
        }
        
        try {
          const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
          ip = meta?.ipAddress || '';
          if (!displayName) {
             displayName = meta?.username || meta?.userName || meta?.fullName || meta?.email || 
                           meta?.user?.fullName || meta?.actorName || '';
          }
        } catch (e) { /* ignore */ }
        
        return {
          ...log,
          ipAddress: ip,
          displayName: displayName || rawId,
        };
      });

      setTableData(mappedLogs);
      setTotalItems(total);
    } catch (error: any) {
      console.error('TenantAuditLogList fetch error with params:', params, error.response?.data || error.message || error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [page, rowsPerPage, selectedUser, filterSchool, filterAction, startDate, endDate, userMap]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const dataFiltered = tableData;

  return (
    <Card>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Danh sách Nhật ký hệ thống</Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Autocomplete
            fullWidth
            size="small"
            options={userOptions}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.fullName ? `${option.fullName} (${option.username})` : option.username || '';
            }}
            filterOptions={(x) => x}
            value={selectedUser}
            onChange={(event, newValue) => {
              setSelectedUser(newValue);
              setPage(0);
            }}
            inputValue={userSearchInput}
            onInputChange={(event, newInputValue) => {
              setUserSearchInput(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Người dùng"
                placeholder="Tìm và chọn người dùng..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Trường học</InputLabel>
            <Select
              label="Trường học"
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">Tất cả Trường</MenuItem>
              {schools.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.schoolName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Từ ngày"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            sx={{
              '& input::-webkit-calendar-picker-indicator': {
                filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
              },
            }}
          />
          <TextField
            fullWidth
            size="small"
            label="Đến ngày"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            sx={{
              '& input::-webkit-calendar-picker-indicator': {
                filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
              },
            }}
          />

        </Stack>
      </Stack>

      {isMobile ? (
        <Stack spacing={2} sx={{ p: 2.5 }}>
          {isLoadingLogs ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ height: 120, borderRadius: 1, bgcolor: 'background.neutral' }} />
            ))
          ) : (
            dataFiltered.map((row) => (
            <Card
              key={row.id}
              sx={{
                p: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                bgcolor: 'background.paper',
              }}
            >
              <Stack spacing={1.5}>
                {/* Header row: Action label and Result */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <Label color="info" sx={{ textTransform: 'uppercase', flexShrink: 0 }}>
                      {String(row.action || '').replace(/_/g, ' ')}
                    </Label>
                    {row.entityType && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.entityType}
                      </Typography>
                    )}
                  </Stack>
                  <Label color="success" sx={{ flexShrink: 0 }}>
                    Thành công
                  </Label>
                </Stack>

                {/* Details container */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                    p: 1.5,
                    bgcolor: 'background.neutral',
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                      Thời gian:
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                      {fDateTime(row.occurredAt)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', flexShrink: 0, mt: 0.5 }}>
                      Người dùng:
                    </Typography>
                    <Box sx={{ textAlign: 'right', minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'primary.main', wordBreak: 'break-all' }}>
                        {row.displayName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          wordBreak: 'break-all',
                          mt: 0.25,
                        }}
                      >
                        ID: {row.id} • UserID: {row.userId}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                      IP Address:
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-all' }}>
                      {row.ipAddress || '—'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                      Chi tiết:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'right',
                        wordBreak: 'break-all',
                        color: 'text.primary',
                      }}
                    >
                      Entity: {row.entityId}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              </Card>
            ))
          )}
          {!isLoadingLogs && !tableData.length && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Không tìm thấy nhật ký hệ thống phù hợp
              </Typography>
            </Box>
          )}
        </Stack>
      ) : (
        <TableContainer sx={{ position: 'relative', minWidth: 800 }}>
          <Scrollbar>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHeadCustom
                order={order}
                orderBy={orderBy}
                headLabel={TABLE_HEAD}
                onSort={onSort}
              />

              <TableBody>
                {isLoadingLogs ? (
                  Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableSkeleton key={index} sx={{ height: dense ? 52 : 72 }} />
                  ))
                ) : (
                  <>
                    {dataFiltered.map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell>{fDateTime(row.occurredAt)}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', color: 'primary.main' }}>
                        {row.displayName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        ID: {row.id} • UserID: {String(row.userId || '').split('-')[0]}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label color="info" sx={{ textTransform: 'uppercase' }}>
                        {String(row.action || '').replace(/_/g, ' ')}
                      </Label>
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        {row.entityType}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.ipAddress || '—'}</TableCell>
                    <TableCell align="center">
                      <Label color="success">Thành công</Label>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap title={row.entityId}>
                        Entity: {row.entityId}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}

                    <TableEmptyRows height={dense ? 52 : 72} emptyRows={emptyRows(page, rowsPerPage, totalItems)} />

                    <TableNoData isNotFound={!tableData.length} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalItems}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
        labelRowsPerPage="Số hàng mỗi trang:"
      />
    </Card>
  );
}
