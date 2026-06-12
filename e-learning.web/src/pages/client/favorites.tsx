import { ReactElement } from 'react';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';
// sections
import FavoriteLessonList from '../../sections/client/user/FavoriteLessonList';

// ----------------------------------------------------------------------

ClientFavoritesPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER', 'STUDENT']}>{page}</Layout>;
};

// ----------------------------------------------------------------------

export default function ClientFavoritesPage() {
  return (
    <Page title="Bài học yêu thích">
      <ClientExperienceTemplate
        title="Bài học yêu thích"
        subtitle="Danh sách các bài giảng và tài liệu học tập bạn đã lưu."
      >
        <FavoriteLessonList />
      </ClientExperienceTemplate>
    </Page>
  );
}
