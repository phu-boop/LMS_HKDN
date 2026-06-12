import type { SuperAdminManagedUser, UserAuditLogEntry } from '../@types/superAdminUser';

// ----------------------------------------------------------------------

export type SuperAdminTenant = { id: string; name: string };

export type SuperAdminSchool = { id: string; name: string; tenantId: string; tenantName?: string };

export const SUPER_ADMIN_TENANTS: SuperAdminTenant[] = [
  { id: 'tn-north', name: 'Sở GD&ĐT Miền Bắc' },
  { id: 'tn-central', name: 'Sở GD&ĐT Miền Trung' },
  { id: 'tn-south', name: 'Sở GD&ĐT Miền Nam' },
];

export const SUPER_ADMIN_SCHOOLS: SuperAdminSchool[] = [
  { id: 'sch-1', name: 'THPT Nguyễn Huệ', tenantId: 'tn-north' },
  { id: 'sch-2', name: 'THCS Trần Phú', tenantId: 'tn-north' },
  { id: 'sch-3', name: 'THPT Lê Quý Đôn', tenantId: 'tn-central' },
  { id: 'sch-4', name: 'THPT Chuyên Lê Hồng Phong', tenantId: 'tn-south' },
  { id: 'sch-5', name: 'Tiểu học Nguyễn Bỉnh Khiêm', tenantId: 'tn-south' },
];

const now = new Date().toISOString();

export const _superAdminUsersInitial: SuperAdminManagedUser[] = [
  {
    id: 'u-1',
    username: 'an.nv',
    fullName: 'Nguyễn Văn An',
    email: 'an.nv@school.edu.vn',
    avatarUrl: '',
    roleId: 'role-student',
    roleName: 'Học sinh',
    schoolId: 'sch-1',
    schoolName: 'THPT Nguyễn Huệ',
    tenantId: 'tn-north',
    tenantName: 'Sở GD&ĐT Miền Bắc',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'u-2',
    username: 'chi.tt',
    fullName: 'Trần Thị Chi',
    email: 'chi.tt@school.edu.vn',
    avatarUrl: '',
    roleId: 'role-teacher',
    roleName: 'Giáo viên',
    schoolId: 'sch-1',
    schoolName: 'THPT Nguyễn Huệ',
    tenantId: 'tn-north',
    tenantName: 'Sở GD&ĐT Miền Bắc',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'u-3',
    username: 'duc.pv',
    fullName: 'Phạm Văn Đức',
    email: 'duc.pv@tranphu.edu.vn',
    avatarUrl: '',
    roleId: 'role-school-admin',
    roleName: 'Quản trị trường',
    schoolId: 'sch-2',
    schoolName: 'THCS Trần Phú',
    tenantId: 'tn-north',
    tenantName: 'Sở GD&ĐT Miền Bắc',
    status: 'locked',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'u-4',
    username: 'ha.lt',
    fullName: 'Lê Thị Hà',
    email: 'ha.lt@lequydon.edu.vn',
    avatarUrl: '',
    roleId: 'role-content-manager',
    roleName: 'Quản trị nội dung',
    schoolId: 'sch-3',
    schoolName: 'THPT Lê Quý Đôn',
    tenantId: 'tn-central',
    tenantName: 'Sở GD&ĐT Miền Trung',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'u-5',
    username: 'khanh.nh',
    fullName: 'Nguyễn Hoàng Khánh',
    email: 'khanh.nh@lhphong.edu.vn',
    avatarUrl: '',
    roleId: 'role-teacher',
    roleName: 'Giáo viên',
    schoolId: 'sch-4',
    schoolName: 'THPT Chuyên Lê Hồng Phong',
    tenantId: 'tn-south',
    tenantName: 'Sở GD&ĐT Miền Nam',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
];

export const _superAdminAuditInitial: UserAuditLogEntry[] = [
  {
    id: 'a-1',
    at: now,
    actorLabel: 'Super Admin (demo)',
    action: 'CREATE',
    userId: 'u-5',
    userLabel: 'khanh.nh',
    detail: 'Tạo tài khoản giáo viên mới',
  },
  {
    id: 'a-2',
    at: now,
    actorLabel: 'Super Admin (demo)',
    action: 'UPDATE',
    userId: 'u-2',
    userLabel: 'chi.tt',
    detail: 'Cập nhật email, vai trò',
  },
  {
    id: 'a-3',
    at: now,
    actorLabel: 'Super Admin (demo)',
    action: 'LOCK',
    userId: 'u-3',
    userLabel: 'duc.pv',
    detail: 'Khóa tài khoản theo yêu cầu vận hành',
  },
];
