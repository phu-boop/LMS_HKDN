import { DashboardStats, NavItem, ActivityData, AuditLog } from "@/types/dashboard";

export const mockDashboardStats: DashboardStats = {
/* ... existing code ... */
  systemHealth: "Stable",
};

export const mockActivityData: ActivityData[] = [
  { name: "Jan", total: 120 },
  { name: "Feb", total: 210 },
  { name: "Mar", total: 450 },
  { name: "Apr", total: 380 },
  { name: "May", total: 520 },
  { name: "Jun", total: 610 },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-03-20 10:30:45",
    user: "admin_he_thong",
    action: "Tạo mới Tenant",
    module: "Tenant Manager",
    status: "Success",
  },
  {
    id: "2",
    timestamp: "2024-03-20 11:15:20",
    user: "school_admin_01",
    action: "Cập nhật khóa học",
    module: "Curriculum",
    status: "Success",
  },
  {
    id: "3",
    timestamp: "2024-03-20 12:05:10",
    user: "guest_user_99",
    action: "Đăng nhập thất bại",
    module: "Auth",
    status: "Failed",
  },
  {
    id: "4",
    timestamp: "2024-03-20 14:22:33",
    user: "system_job",
    action: "Backup database",
    module: "System",
    status: "Warning",
  },
];

export const adminNavItems: NavItem[] = [
/* ... existing code ... */

  {
    title: "Dashboard",
    href: "/lms-admin/dashboard",
    icon: "LayoutDashboard",
    section: "TỔNG QUAN",
  },
  {
    title: "Trường Học",
    href: "/lms-admin/schools",
    icon: "Home",
    section: "QUẢN TRỊ HỆ THỐNG",
  },
  {
    title: "Tenant Chương Trình",
    href: "/lms-admin/tenants",
    icon: "Globe",
    section: "QUẢN TRỊ HỆ THỐNG",
  },
  {
    title: "Cấp Phép & Hợp Đồng",
    href: "/lms-admin/licenses",
    icon: "FileText",
    section: "QUẢN TRỊ HỆ THỐNG",
  },
  {
    title: "Tài Khoản Người Dùng",
    href: "/lms-admin/users",
    icon: "Users",
    section: "QUẢN TRỊ HỆ THỐNG",
  },
  {
    title: "Audit Logs",
    href: "/lms-admin/audit-logs",
    icon: "ClipboardList",
    section: "QUẢN TRỊ HỆ THỐNG",
  },
];
