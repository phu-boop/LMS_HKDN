import dynamic from 'next/dynamic';
// @mui
import { Card, CardHeader, Box } from '@mui/material';
import merge from 'lodash/merge';
// components
import BaseOptionChart from '../../../components/chart/BaseOptionChart';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  subheader?: string;
  chartData: number[];
  chartLabels: string[];
};

export default function TenantDashboardViewsChart({ title, subheader, chartData, chartLabels }: Props) {
  const chartOptions = merge(BaseOptionChart(), {
    plotOptions: { bar: { columnWidth: '35%', borderRadius: 4 } },
    labels: chartLabels,
    xaxis: { type: 'category' },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} views`,
      },
    },
    colors: ['#10b981'], // Emerald 500
  });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ p: 3, pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} dir="ltr">
        <Chart
          type="bar"
          series={[{ name: 'Lượt xem', data: chartData }]}
          options={chartOptions}
          height={300}
        />
      </Box>
    </Card>
  );
}
