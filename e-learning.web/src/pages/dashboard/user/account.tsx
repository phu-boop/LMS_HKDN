import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PATH_ADMIN } from '../../../routes/paths';

// ----------------------------------------------------------------------

UserAccount.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};

// ----------------------------------------------------------------------

export default function UserAccount() {
  const router = useRouter();
  useEffect(() => {
    router.replace(PATH_ADMIN.userAccount);
  }, [router]);
  return null;
}
