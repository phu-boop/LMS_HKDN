import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PATH_ADMIN } from '../../../routes/paths';

// ----------------------------------------------------------------------

UserProfile.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};

// ----------------------------------------------------------------------

export default function UserProfile() {
  const router = useRouter();
  useEffect(() => {
    router.replace(PATH_ADMIN.userProfile);
  }, [router]);
  return null;
}
