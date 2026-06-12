import { ReactElement } from 'react';
import Layout from '../../layouts';
import AdminStubPage from '../../components/admin/AdminStubPage';

AdminRolesPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout roles={['SUPER_ADMIN', 'LMS_ADMIN']}>{page}</Layout>;
};

export default function AdminRolesPage() {
  return <AdminStubPage title="Phân quyền" />;
}
