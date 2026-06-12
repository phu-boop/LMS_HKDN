import dynamic from 'next/dynamic';
// @mui
import { Card, CardHeader, Box, TextField, MenuItem, Stack } from '@mui/material';
import merge from 'lodash/merge';
// components
import BaseOptionChart from '../../../components/chart/BaseOptionChart';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  subheader?: string;
  chartData: {
    name: string;
    data: number[];
  }[];
  chartLabels: string[];
  onTimeFilterChange: (value: string) => void;
  timeFilter: string;
};

export default function AdminDashboardTrafficChart({ 
  title, 
  subheader, 
  chartData, 
  chartLabels,
  onTimeFilterChange,
  timeFilter
}: Props) {
  const chartOptions = merge(BaseOptionChart(), {
    stroke: {
      show: true,
      curve: 'smooth',
      lineCap: 'butt',
      colors: undefined,
      width: 2,
      dashArray: 0,      
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    labels: chartLabels,
    xaxis: { type: 'category' },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} phiên`,
      },
    },
  });

  return (
    <Card>
      <CardHeader 
        title={title} 
        subheader={subheader}
        action={
          <TextField
            select
            fullWidth
            value={timeFilter}
            size="small"
            onChange={(e) => onTimeFilterChange(e.target.value)}
            SelectProps={{ native: false }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                typography: 'subtitle2',
                width: 140,
              },
            }}
          >
            <MenuItem value="24h">24 giờ qua</MenuItem>
            <MenuItem value="7d">7 ngày qua</MenuItem>
            <MenuItem value="30d">30 ngày qua</MenuItem>
          </TextField>
        }
      />
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        <Chart
          type="area"
          series={chartData}
          options={chartOptions}
          height={364}
        />
      </Box>
    </Card>
  );
}
