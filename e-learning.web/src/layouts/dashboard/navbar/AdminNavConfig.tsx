import { PATH_ADMIN } from '../../../routes/paths';
import Iconify from '../../../components/Iconify';
import { NavSectionProps } from '../../../components/nav-section/type';

const adminNavConfig: NavSectionProps['navConfig'] = [
  {
    subheader: 'tổng quan',
    items: [
      {
        title: 'Dashboard',
        path: PATH_ADMIN.dashboard,
        icon: <Iconify icon="eva:grid-fill" width={20} height={20} />,
      },
      /* {
        title: 'Báo cáo thống kê',
        path: PATH_ADMIN.reports,
        icon: <Iconify icon="eva:bar-chart-2-fill" width={20} height={20} />,
      }, */
    ],
  },
  {
    subheader: 'quản trị hệ thống',
    items: [
      {
        title: 'Trường học',
        path: PATH_ADMIN.schools,
        icon: <Iconify icon="eva:home-fill" width={20} height={20} />,
      },
      {
        title: 'Chương Trình',
        path: PATH_ADMIN.programTenants,
        icon: <Iconify icon="eva:globe-2-fill" width={20} height={20} />,
      },
      {
        title: 'Cấp phép & Hợp đồng',
        path: PATH_ADMIN.subscriptions,
        icon: <Iconify icon="eva:file-fill" width={20} height={20} />,
      },
      {
        title: 'Tài khoản người dùng',
        path: PATH_ADMIN.users,
        icon: <Iconify icon="eva:people-fill" width={20} height={20} />,
      },
      {
        title: 'Nhật Ký Hoạt Động',
        path: PATH_ADMIN.auditLogs,
        icon: <Iconify icon="eva:file-text-fill" width={20} height={20} />,
      },
      {
        title: 'CMS nội dung',
        path: PATH_ADMIN.cms,
        icon: <Iconify icon="eva:folder-fill" width={20} height={20} />,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

export default adminNavConfig;
