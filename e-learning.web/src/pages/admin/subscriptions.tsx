import { ReactElement } from 'react';
// layouts
import Layout from '../../layouts';
// sections
import SubscriptionList from '../../sections/admin/subscriptions/SubscriptionList';

// ----------------------------------------------------------------------

AdminSubscriptionsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function AdminSubscriptionsPage() {
  return <SubscriptionList />;
}
