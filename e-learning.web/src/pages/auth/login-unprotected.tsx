import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PATH_AUTH } from '../../routes/paths';

export default function LoginUnprotectedRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PATH_AUTH.login);
  }, [router]);

  return null;
}
