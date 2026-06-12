import { PATH_CLIENT } from '../../routes/paths';
import Iconify from '../../components/Iconify';

const navConfig = [
  {
    subheader: 'học tập',
    items: [
      {
        title: 'Tổng quan',
        path: PATH_CLIENT.dashboard,
        icon: <Iconify icon="eva:grid-fill" width={20} height={20} />,
      },
      {
        title: 'Thư viện học liệu',
        path: PATH_CLIENT.library,
        icon: <Iconify icon="eva:book-open-fill" width={20} height={20} />,
      },
      {
        title: 'Truy cập nhanh',
        path: PATH_CLIENT.quickAccess,
        icon: <Iconify icon="eva:flash-fill" width={20} height={20} />,
      },
      // {
      //   title: 'Kế hoạch học tập',
      //   path: PATH_CLIENT.history,
      //   icon: <Iconify icon="eva:clock-fill" width={20} height={20} />,
      // },
      {
        title: 'Bài học yêu thích',
        path: PATH_CLIENT.favorites,
        icon: <Iconify icon="eva:heart-fill" width={20} height={20} />,
      },
    ],
  },
];

export default navConfig;
