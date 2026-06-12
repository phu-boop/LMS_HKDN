import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  FormControl,
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
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { fDateTime } from '../../../utils/formatTime';
import { sanitizeUiMessage } from '../../../utils/sanitizeUiMessage';
import type { ReportFilters, ReportTimeRange } from '../../../@types/reportDashboard';
import { useDispatch, useSelector } from '../../../redux/store';
import { fetchAdminMasterData } from '../../../redux/slices/adminMasterData';
import { fetchLocalPartners } from '../../../redux/slices/localPartner';
import { fetchReportDashboard } from '../../../redux/slices/reportDashboard';
import Scrollbar from '../../../components/Scrollbar';

const refreshOptions = [15, 30, 60, 120];

export default function SystemReportsDashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { tenants, schools } = useSelector((state) => state.adminMasterData);
  const { items: partners } = useSelector((state) => state.localPartner);
  const { data, isLoading, error } = useSelector((state) => state.reportDashboard);

  const [filters, setFilters] = useState<ReportFilters>({
    tenantId: '',
    schoolId: '',
    partnerId: '',
    timeRange: '7d',
  });
  const [refreshSeconds, setRefreshSeconds] = useState<number>(30);

  useEffect(() => {
    dispatch(fetchAdminMasterData());
    dispatch(fetchLocalPartners());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchReportDashboard(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    const id = window.setInterval(() => {
      dispatch(fetchReportDashboard(filters));
    }, refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [dispatch, filters, refreshSeconds]);

  useEffect(() => {
    if (!error) return;
    enqueueSnackbar(sanitizeUiMessage(error), { variant: 'warning' });
  }, [error, enqueueSnackbar]);

  const schoolOptions = useMemo(() => {
    if (!filters.tenantId) return schools;
    return schools.filter((s) => !s.tenantId || s.tenantId === filters.tenantId);
  }, [schools, filters.tenantId]);

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
          <Typography variant="h6">Dashboard tổng quan toàn hệ thống</Typography>
          <Typography variant="caption" color="text.secondary">
            Làm mới chu kỳ: {refreshSeconds}s
            {data?.generatedAt ? ` | cập nhật: ${fDateTime(data.generatedAt)}` : ''}
          </Typography>
        </Stack>
      </Card>

      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel id="report-tenant">Tenant</InputLabel>
              <Select
                labelId="report-tenant"
                label="Tenant"
                value={filters.tenantId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, tenantId: e.target.value, schoolId: '' }))
                }
              >
                <MenuItem value="">Tất cả</MenuItem>
                {tenants.map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel id="report-school">School</InputLabel>
              <Select
                labelId="report-school"
                label="School"
                value={filters.schoolId}
                onChange={(e) => setFilters((f) => ({ ...f, schoolId: e.target.value }))}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {schoolOptions.map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel id="report-partner">Partner</InputLabel>
              <Select
                labelId="report-partner"
                label="Partner"
                value={filters.partnerId}
                onChange={(e) => setFilters((f) => ({ ...f, partnerId: e.target.value }))}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {partners.map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel id="report-time">Thời gian</InputLabel>
              <Select
                labelId="report-time"
                label="Thời gian"
                value={filters.timeRange}
                onChange={(e) => setFilters((f) => ({ ...f, timeRange: e.target.value as ReportTimeRange }))}
              >
                <MenuItem value="24h">24h</MenuItem>
                <MenuItem value="7d">7 ngày</MenuItem>
                <MenuItem value="30d">30 ngày</MenuItem>
                <MenuItem value="90d">90 ngày</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel id="report-refresh">Refresh</InputLabel>
              <Select
                labelId="report-refresh"
                label="Refresh"
                value={String(refreshSeconds)}
                onChange={(e) => setRefreshSeconds(Number(e.target.value))}
              >
                {refreshOptions.map((x) => (
                  <MenuItem key={x} value={String(x)}>
                    {x}s
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {isLoading && (
        <Alert severity="info">Đang tải dữ liệu dashboard...</Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Box>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Active users
            </Typography>
            <Typography variant="h4">{data?.kpis.activeUsers ?? 0}</Typography>
          </Card>
        </Box>
        <Box>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Concurrent users
            </Typography>
            <Typography variant="h4">{data?.kpis.concurrentUsers ?? 0}</Typography>
          </Card>
        </Box>
        <Box>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Storage used (GB)
            </Typography>
            <Typography variant="h4">{data?.kpis.storageUsedGb ?? 0}</Typography>
          </Card>
        </Box>
        <Box>
          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Bandwidth used (GB)
            </Typography>
            <Typography variant="h4">{data?.kpis.bandwidthUsedGb ?? 0}</Typography>
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Box>
          <Card>
            <Stack sx={{ p: 2 }}>
              <Typography variant="subtitle1">Phân bổ theo trường</Typography>
            </Stack>
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trường</TableCell>
                      <TableCell align="right">Active</TableCell>
                      <TableCell align="right">Storage</TableCell>
                      <TableCell align="right">Bandwidth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.bySchool || []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.activeUsers}</TableCell>
                        <TableCell align="right">{row.storageUsedGb}</TableCell>
                        <TableCell align="right">{row.bandwidthUsedGb}</TableCell>
                      </TableRow>
                    ))}
                    {!data?.bySchool?.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Box>
        <Box>
          <Card>
            <Stack sx={{ p: 2 }}>
              <Typography variant="subtitle1">Phân bổ theo partner</Typography>
            </Stack>
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Partner</TableCell>
                      <TableCell align="right">Active</TableCell>
                      <TableCell align="right">Storage</TableCell>
                      <TableCell align="right">Bandwidth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.byPartner || []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.activeUsers}</TableCell>
                        <TableCell align="right">{row.storageUsedGb}</TableCell>
                        <TableCell align="right">{row.bandwidthUsedGb}</TableCell>
                      </TableRow>
                    ))}
                    {!data?.byPartner?.length && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Box>
      </Box>
    </Stack>
  );
}
