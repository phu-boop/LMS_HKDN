import NextLink from 'next/link';
import { ReactNode } from 'react';
// @mui
import { Box, Card, Chip, Stack, Button, Typography } from '@mui/material';

type QuickLink = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  description: string;
  tags?: string[];
  quickLinks?: QuickLink[];
  children?: ReactNode;
};

export default function PortalPageTemplate({
  title,
  description,
  tags = [],
  quickLinks = [],
  children,
}: Props) {
  return (
    <Box
      sx={{
        width: 1,
        px: { xs: 2, sm: 0 },
      }}
    >
      <Stack spacing={3.5}>
        <Box sx={{ maxWidth: 920 }}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        </Box>

        {!!tags.length && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: -1 }}>
            {tags.map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />
            ))}
          </Stack>
        )}

        {!!quickLinks.length && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {quickLinks.map((item) => (
              <Card
                key={item.href}
                sx={{
                  p: 2.5,
                  minHeight: 168,
                  borderRadius: 2.5,
                  display: 'flex',
                  minWidth: 0,
                }}
              >
                <Stack spacing={1.5} sx={{ width: 1, justifyContent: 'space-between', minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontSize: 22, lineHeight: 1.2 }}>
                    {item.label}
                  </Typography>
                  <Button
                    component={NextLink}
                    href={item.href}
                    size="small"
                    variant="text"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Mở trang
                  </Button>
                </Stack>
              </Card>
            ))}
          </Box>
        )}

        {children}
      </Stack>
    </Box>
  );
}
