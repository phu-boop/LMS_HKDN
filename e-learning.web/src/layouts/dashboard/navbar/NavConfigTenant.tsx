// routes
import { PATH_ADMIN } from '../../../routes/paths';
// components
import SvgIconStyle from '../../../components/SvgIconStyle';
import { NavSectionProps } from '../../../components/nav-section/type';

// ----------------------------------------------------------------------
const getIcon = (name: string) => (
  <SvgIconStyle src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  dashboard: getIcon('ic_dashboard'),
  curriculum: getIcon('ic_kanban'),
  content: getIcon('ic_blog'),
  permission: getIcon('ic_user'),
  chat: getIcon('ic_chat'),
  role: getIcon('ic_user'),
};

const navConfigTenant: NavSectionProps['navConfig'] = [
  {
    subheader: 'Tenant Management',
    items: [
      { title: 'Dashboard', path: PATH_ADMIN.tenantAdminDashboard, icon: ICONS.dashboard },
      { title: 'Cây Học Liệu', path: PATH_ADMIN.tenantAdminCurriculum, icon: ICONS.curriculum },
      { title: 'Quản lý Nội dung', path: PATH_ADMIN.tenantAdminCms, icon: ICONS.content },
      { title: 'Quản lý Bình luận', path: PATH_ADMIN.tenantAdminComments, icon: ICONS.chat },
      { title: 'Phân quyền Nội dung', path: PATH_ADMIN.tenantAdminPermissions, icon: ICONS.permission },
      { title: 'Nhật ký hoạt động', path: PATH_ADMIN.tenantAdminAuditLogs, icon: ICONS.dashboard },
      // { title: 'Người dùng (Roles)', path: PATH_ADMIN.tenantAdminUsers, icon: ICONS.role },
    ],
  },
];

export default navConfigTenant;
