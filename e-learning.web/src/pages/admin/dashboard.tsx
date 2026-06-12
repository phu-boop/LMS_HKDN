import { ReactElement, useState, useEffect } from 'react';
// @mui
import { Container, Grid, Typography, Stack, Button } from '@mui/material';
// layouts
import Layout from '@/layouts';
// components
import Page from '@/components/Page';
import Iconify from '@/components/Iconify';
// utils
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { fetchAdminSummaryStats } from '@/redux/slices/reportDashboard';
// sections
import AdminDashboardKpiCard from '@/sections/admin/dashboard/AdminDashboardKpiCard';
import AdminDashboardTrafficChart from '@/sections/admin/dashboard/AdminDashboardTrafficChart';

// ----------------------------------------------------------------------

const LABELS_24H = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
const DATA_24H = [150, 100, 80, 500, 3100, 2800, 1500, 3250, 2600, 1800, 1200, 400];

const LABELS_7D = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DATA_7D = [15000, 16200, 15800, 17000, 16500, 8000, 6000];

const LABELS_30D = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
const DATA_30D = [85000, 92000, 88000, 95000];

// ----------------------------------------------------------------------

AdminDashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const [timeFilter, setTimeFilter] = useState('24h');
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionsData, setSessionsData] = useState<{
    '24h': { labels: string[]; data: number[] } | null;
    '7d': { labels: string[]; data: number[] } | null;
    '30d': { labels: string[]; data: number[] } | null;
  }>({
    '24h': null,
    '7d': null,
    '30d': null,
  });
  
  const { summaryStats: stats, isSummaryLoading: isRefreshing } = useSelector((state) => state.reportDashboard);

  useEffect(() => {
    dispatch(fetchAdminSummaryStats());
  }, [dispatch]);

  const fetchSessionsChart = async (range: string) => {
    setIsSessionsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.adminDashboardSessions, {
        params: { range },
      });
      const resData = res.data?.data || res.data;
      
      // Case 1: API returns the full object with ranges as keys: { "24h": { labels, data }, "7d": {...}, "30d": {...} }
      if (resData && resData[range] && typeof resData[range] === 'object') {
        const targetData = resData[range];
        const labels = Array.isArray(targetData.labels) ? targetData.labels : [];
        const rawValues = targetData.data || targetData.sessions || [];
        const data = Array.isArray(rawValues) ? rawValues.map((v: any) => Number(v)) : [];
        if (labels.length > 0) {
          setSessionsData((prev) => ({
            ...prev,
            [range]: { labels, data },
          }));
          return;
        }
      }
      
      // Case 2: API returns directly { labels, data } for the requested range
      if (resData && Array.isArray(resData.labels)) {
        const rawValues = resData.data || resData.sessions || [];
        const data = Array.isArray(rawValues) ? rawValues.map((v: any) => Number(v)) : [];
        setSessionsData((prev) => ({
          ...prev,
          [range]: {
            labels: resData.labels,
            data,
          },
        }));
      } else if (Array.isArray(resData)) {
        // Case 3: API returns directly an array of objects
        const labels = resData.map((item: any) => item.label || item.time || item.date || '');
        const data = resData.map((item: any) => Number(item.value ?? item.sessions ?? item.count ?? 0));
        setSessionsData((prev) => ({
          ...prev,
          [range]: { labels, data },
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch sessions for range ${range}:`, err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsChart(timeFilter);
  }, [timeFilter]);

  const fallbackChartData = {
    '24h': { labels: LABELS_24H, data: DATA_24H },
    '7d': { labels: LABELS_7D, data: DATA_7D },
    '30d': { labels: LABELS_30D, data: DATA_30D },
  }[timeFilter] || { labels: [], data: [] };

  const currentChartData = sessionsData[timeFilter as '24h' | '7d' | '30d'] || fallbackChartData;

  const handleRefresh = () => {
    dispatch(fetchAdminSummaryStats());
    fetchSessionsChart(timeFilter);
  };

  // Fallback state while loading initially
  const currentStats = stats || {
    activeTenants: 0,
    activeSchools: 0,
    activeSessions: 0,
    systemHealth: 'OK',
    trends: {},
  };

  return (
    <Page title="Tổng quan Super Admin">
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Typography variant="h4">Dashboard Tổng quan Hệ thống</Typography>
          <Button 
            variant="contained" 
            startIcon={<Iconify icon={isRefreshing || isSessionsLoading ? 'eva:loader-outline' : 'eva:refresh-fill'} />}
            onClick={handleRefresh}
            disabled={isRefreshing || isSessionsLoading}
          >
            {isRefreshing || isSessionsLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardKpiCard 
              title="Tổng số chương trình" 
              value={currentStats.activeTenants} 
              trend={currentStats.trends?.tenants || 'Đang cập nhật'}
              trendDirection={(currentStats.trends?.tenantsDirection as 'up' | 'down') || 'up'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardKpiCard 
              title="Trường học đang sử dụng" 
              value={currentStats.activeSchools} 
              trend={currentStats.trends?.schools || 'Đang cập nhật'}
              trendDirection={(currentStats.trends?.schoolsDirection as 'up' | 'down') || 'up'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardKpiCard 
              title="Số phiên đang hoạt động" 
              value={currentStats.activeSessions.toLocaleString()} 
              trend={currentStats.trends?.sessions || 'Mức tải: Theo dõi realtime'}
              trendDirection={(currentStats.trends?.sessionsDirection as 'up' | 'down') || 'up'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AdminDashboardKpiCard 
              title="Sức khỏe hệ thống" 
              value={currentStats.systemHealth === 'Stable' ? 'Ổn định' : currentStats.systemHealth} 
              trend="Trạng thái dịch vụ"
              trendDirection={currentStats.systemHealth === 'Stable' ? 'up' : 'down'}
              color={currentStats.systemHealth === 'Stable' ? 'success.main' : 'error.main'}
            />
          </Grid>

          <Grid item xs={12}>
            <AdminDashboardTrafficChart 
              title="Lưu lượng truy cập (Phiên)"
              chartLabels={currentChartData.labels}
              chartData={[{ name: 'Phiên', data: currentChartData.data }]}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />
          </Grid>
        </Grid>
      </Container>

    </Page>
  );
}
