import { ReactElement, useState, useEffect } from 'react';
// @mui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Card,
  Table,
  Stack,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  Container,
  TableContainer,
} from '@mui/material';
// layouts
import Layout from '@/layouts';
// components
import Page from '@/components/Page';
import Scrollbar from '@/components/Scrollbar';
// utils & endpoints
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
// sections
import {
  TenantDashboardSummary,
} from '../../sections/tenant-admin/dashboard';

// ----------------------------------------------------------------------
// TYPES DEFINITIONS matching Backend responses
// ----------------------------------------------------------------------

export interface TenantSummaryData {
  schoolsExpiringSoon: number;
  soldDocuments: number;
  totalDocuments: number;
  totalSchools: number;
  totalSchoolsUsing: number;
  unsoldDocuments: number;
}

export interface TenantTopContent {
  rank: number;
  contentId: string;
  contentTitle: string;
  curriculumNodeId: string;
  curriculumNodeFullPath: string;
  curriculumNodeShortPath: string;
  soldCount: number;
}

// ----------------------------------------------------------------------

TenantAdminDashboard.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="dashboard" roles={['TENANT_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function TenantAdminDashboard() {
  const theme = useTheme();

  // Summary State with defaults
  const [summary, setSummary] = useState<TenantSummaryData>({
    schoolsExpiringSoon: 0,
    soldDocuments: 4,
    totalDocuments: 7,
    totalSchools: 3,
    totalSchoolsUsing: 2,
    unsoldDocuments: 3,
  });

  const [topContents, setTopContents] = useState<TenantTopContent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summaryRes = await axios.get(API_ENDPOINTS.tenantDashboardSummary);
        if (summaryRes.data) {
          setSummary(summaryRes.data);
        }
      } catch (err) {
        console.warn('Failed to fetch tenant summary stats', err);
      }

      try {
        const topContentsRes = await axios.get(API_ENDPOINTS.tenantDashboardTopContents);
        const contents = topContentsRes.data?.items || topContentsRes.data?.data || topContentsRes.data;
        if (Array.isArray(contents)) {
          setTopContents(contents);
        }
      } catch (err) {
        console.warn('Failed to fetch top contents', err);
      }
    };

    fetchData();
  }, []);

  return (
    <Page title="Tenant Admin Dashboard">
      <Container maxWidth={false}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Hiệu suất Nội dung
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tổng quan về dung lượng và mức độ tương tác của mảng STEM
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
            <TenantDashboardSummary
              title="Tài liệu đã bán"
              total={String(summary.soldDocuments)}
              subtitle={`Trên tổng số ${summary.totalDocuments} tài liệu`}
              percent={summary.totalDocuments ? Math.round((summary.soldDocuments / summary.totalDocuments) * 100) : 0}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
            <TenantDashboardSummary
              title="Trường đang sử dụng"
              total={String(summary.totalSchoolsUsing)}
              subtitle={`Trên tổng số ${summary.totalSchools} trường`}
              color="success"
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
            <TenantDashboardSummary
              title="Tài liệu chưa bán"
              total={String(summary.unsoldDocuments)}
              subtitle={`Trong tổng số ${summary.totalDocuments} tài liệu`}
              color="info"
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex' }}>
            <TenantDashboardSummary
              title="Trường sắp hết hạn"
              total={String(summary.schoolsExpiringSoon)}
              subtitle="Cần theo dõi gia hạn"
              color="error"
            />
          </Grid>

          {/* Top Content Table */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
                <Typography variant="h6">Top 3 Bài giảng nổi bật</Typography>
              </Stack>

              <TableContainer sx={{ minWidth: 800 }}>
                <Scrollbar>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Tên Tài liệu</TableCell>
                        <TableCell>Nằm trong (Cây học liệu)</TableCell>
                        <TableCell align="right">Lượt mua</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topContents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Chưa có tài liệu nào được tạo ra trên hệ thống
                          </TableCell>
                        </TableRow>
                      ) : (
                        topContents.slice(0, 3).map((row, idx) => (
                          <TableRow key={row.contentId || idx} hover>
                            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.rank || (idx + 1)}</TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Box sx={{ width: 40, height: 40, bgcolor: 'background.neutral', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                  📄
                                </Box>
                                <Box>
                                  <Typography variant="subtitle2">{row.contentTitle}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }} title={row.curriculumNodeFullPath}>
                                  {row.curriculumNodeShortPath || row.curriculumNodeFullPath || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2">{row.soldCount.toLocaleString()}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
