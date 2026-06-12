import { ReactElement, useEffect } from 'react';
import { useRouter } from 'next/router';
// routes
import { PATH_ADMIN } from '../../routes/paths';
// layouts
import Layout from '../../layouts';

// ----------------------------------------------------------------------

AdminIndex.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PATH_ADMIN.dashboard);
  }, [router]);

  return null;
}
