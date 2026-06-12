import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PATH_ADMIN } from '../../routes/paths';

export default function TenantAdminIndex() {
  const { replace } = useRouter();

  useEffect(() => {
    replace(PATH_ADMIN.tenantAdminDashboard);
  }, [replace]);

  return null;
}
