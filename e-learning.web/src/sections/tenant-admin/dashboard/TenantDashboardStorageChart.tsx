import dynamic from 'next/dynamic';
// @mui
import { Card, CardHeader, Box, Stack, Typography } from '@mui/material';
import merge from 'lodash/merge';
// components
import BaseOptionChart from '../../../components/chart/BaseOptionChart';
import { fNumber } from '../../../utils/formatNumber';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ----------------------------------------------------------------------



// ----------------------------------------------------------------------

type Props = {
  title?: string;
  subheader?: string;
  chartData: number[];
  chartLabels: string[];
};

export default function TenantDashboardStorageChart({ title, subheader, chartData, chartLabels }: Props) {
  const chartOptions = merge(BaseOptionChart(), {
    colors: ['#10b981', '#3b82f6', '#cbd5e1'],
    labels: chartLabels,
    stroke: { show: false },
    legend: { floating: false, horizontalAlign: 'center', position: 'bottom' },
    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (val: number) => fNumber(val) + ' GB',
        title: {
          formatter: (seriesName: string) => `${seriesName}`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            value: {
              formatter: (val: number | string) => fNumber(val),
            },
            total: {
              show: true,
              label: 'Tổng',
              formatter: (w: any) => {
                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return fNumber(sum) + ' GB';
              },
            },
          },
        },
      },
    },
  });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} />
      <Box sx={{ p: 3, pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} dir="ltr">
        <Chart type="donut" series={chartData} options={chartOptions} height={300} />
      </Box>
    </Card>
  );
}
