import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/layouts';

export default function ClientIndex() {
  const { replace } = useRouter();

  useEffect(() => {
    replace('/client/dashboard');
  }, [replace]);

  return null;
}

ClientIndex.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};
