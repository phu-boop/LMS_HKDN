import NextLink from 'next/link';
import { ReactNode } from 'react';
// @mui
import { alpha } from '@mui/material/styles';
import { Box, Card, Stack, Button, Container, Typography, IconButton } from '@mui/material';
import Iconify from '@/components/Iconify';

type Metric = {
  label: string;
  value: string;
  isLoading?: boolean;
  onClick?: () => void;
};

type Action = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  subtitle: string;
  metrics?: Metric[];
  primaryAction?: Action;
  secondaryAction?: Action;
  children?: ReactNode;
};

export default function ClientExperienceTemplate({
  title,
  subtitle,
  metrics = [],
  primaryAction,
  secondaryAction,
  children,
}: Props) {
  return (
    <Container maxWidth={false} disableGutters sx={{ px: 2 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {secondaryAction && (
              <Button
                component={NextLink}
                href={secondaryAction.href}
                variant="outlined"
                color="inherit"
                size="medium"
                sx={{
                  height: 40,
                  minWidth: 150,
                }}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                component={NextLink}
                href={primaryAction.href}
                variant="contained"
                color="primary"
                size="medium"
                sx={{ height: 40, minWidth: 150 }}
              >
                {primaryAction.label}
              </Button>
            )}
          </Stack>
        </Stack>

        {!!metrics.length && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
            }}
          >
            {metrics.map((item) => (
              <Card
                key={item.label}
                onClick={item.onClick}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '100%',
                  minWidth: 0,
                  cursor: item.onClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': item.onClick
                    ? {
                        boxShadow: (theme) => theme.customShadows.z8,
                        transform: 'translateY(-2px)',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                      }
                    : {},
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h5">{item.value}</Typography>
                  </Box>
                  {item.onClick && (
                    <IconButton size="small" sx={{ color: 'primary.main' }}>
                      <Iconify icon="eva:external-link-outline" width={20} height={20} />
                    </IconButton>
                  )}
                </Stack>
              </Card>
            ))}
          </Box>
        )}

        {children}
      </Stack>
    </Container>
  );
}
