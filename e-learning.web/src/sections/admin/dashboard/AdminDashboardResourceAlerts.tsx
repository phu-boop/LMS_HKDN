// @mui
import { Card, CardHeader, Typography, Stack, Box, Chip } from '@mui/material';

// ----------------------------------------------------------------------

type AlertItemProps = {
  name: string;
  description: string;
  value: number;
  status: 'critical' | 'warning' | 'normal';
};

const ALERTS: AlertItemProps[] = [
  {
    name: 'Lưu trữ (Storage)',
    description: 'S3 Bucket / Database',
    value: 92,
    status: 'critical',
  },
  {
    name: 'CPU Usage',
    description: 'Cluster EC2 Core',
    value: 78,
    status: 'warning',
  },
  {
    name: 'RAM Allocation',
    description: 'Redis & App Server',
    value: 45,
    status: 'normal',
  },
];

export default function AdminDashboardResourceAlerts() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Cảnh báo Tài nguyên" />
      <Stack spacing={3} sx={{ p: 3 }}>
        {ALERTS.map((alert) => (
          <Stack key={alert.name} direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2">{alert.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {alert.description}
              </Typography>
            </Box>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {alert.value}%
              </Typography>
              <Chip 
                label={alert.status === 'critical' ? 'Nguy cấp' : alert.status === 'warning' ? 'Cảnh báo' : 'Bình thường'} 
                size="small"
                color={alert.status === 'critical' ? 'error' : alert.status === 'warning' ? 'warning' : 'success'}
                variant="filled"
                sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 }}
              />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
