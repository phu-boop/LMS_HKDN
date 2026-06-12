import { Card, Container, Typography } from '@mui/material';
import Page from '../Page';

type Props = {
  title: string;
  description?: string;
};

export default function AdminStubPage({ title, description }: Props) {
  return (
    <Page title={title}>
      <Container maxWidth="lg">
        <Card sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary">
            {description ?? 'Placeholder page. Menu links are ready for API integration.'}
          </Typography>
        </Card>
      </Container>
    </Page>
  );
}
