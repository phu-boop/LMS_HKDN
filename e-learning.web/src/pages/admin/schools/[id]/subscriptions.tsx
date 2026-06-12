import { useRouter } from 'next/router';
// layouts
import Layout from '../../../../layouts';
// components
import Page from '../../../../components/Page';
import { Container } from '@mui/material';
// sections
import SchoolSubscriptionDetail from '../../../../sections/admin/subscriptions/SchoolSubscriptionDetail';

// ----------------------------------------------------------------------

SchoolSubscriptionsPage.getLayout = (page: React.ReactElement) => <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;

// ----------------------------------------------------------------------

export default function SchoolSubscriptionsPage() {
  const { query } = useRouter();
  const { id } = query;

  return (
    <Page title="Chi tiết Hợp đồng Trường học">
      <Container maxWidth={false}>
        <SchoolSubscriptionDetail schoolId={id as string} />
      </Container>
    </Page>
  );
}
