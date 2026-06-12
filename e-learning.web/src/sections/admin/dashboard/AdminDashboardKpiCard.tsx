// @mui
import { Card, Typography, Stack, Box, useTheme, CardProps } from '@mui/material';
// components
import Iconify from '../../../components/Iconify';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  color?: string;
  clickable?: boolean;
};

export default function AdminDashboardKpiCard({ 
  title, 
  value, 
  trend, 
  trendDirection, 
  color, 
  clickable,
  sx,
  ...other 
}: Props) {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        p: 3, 
        ...(clickable && {
          cursor: 'pointer',
          transition: theme.transitions.create(['transform', 'box-shadow', 'border-color']),
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.customShadows.z12,
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
            borderStyle: 'solid',
          }
        }),
        ...sx 
      }} 
      {...other}
    >
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 'fontWeightMedium' }}>
        {title}
      </Typography>

      <Typography variant="h3" sx={{ mb: 0.5, color: color || 'text.primary' }}>
        {value}
      </Typography>

      {trend && (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify 
            icon={trendDirection === 'down' ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} 
            sx={{ 
              width: 16, 
              height: 16, 
              color: trendDirection === 'down' ? 'error.main' : 'success.main' 
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              color: trendDirection === 'down' ? 'error.main' : 'success.main',
              fontWeight: 'fontWeightMedium'
            }}
          >
            {trend}
          </Typography>
        </Stack>
      )}
    </Card>
  );
}
