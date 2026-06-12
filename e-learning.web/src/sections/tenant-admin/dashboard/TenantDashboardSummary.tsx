// @mui
import { Card, Typography, LinearProgress, Box, Stack } from '@mui/material';
import { ColorSchema } from '../../../theme/palette';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  total: string;
  quota?: string;
  percent?: number;
  subtitle?: string;
  color?: ColorSchema;
};

export default function TenantDashboardSummary({ title, total, quota, percent, subtitle, color = 'primary' }: Props) {
  return (
    <Card sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: { xs: 'auto', md: 160 } }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
          {title}
        </Typography>

        <Typography variant="h3">
          {total} {quota && <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/ {quota}</Typography>}
        </Typography>
      </Box>

      {percent !== undefined && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={percent}
            color={color}
            sx={{ height: 8, borderRadius: 5, bgcolor: 'background.neutral' }}
          />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: 'text.secondary', mt: 0.5 }}>
            {title.toLowerCase().includes('bán') ? `Đã bán ${percent}%` : `Đã dùng ${percent}%`}
          </Typography>
        </Box>
      )}

      {subtitle && (
        <Typography variant="caption" sx={{ color: color === 'success' ? 'success.main' : 'text.secondary', fontWeight: 'medium', mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
}
