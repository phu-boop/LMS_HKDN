export interface DashboardStats {
  totalTenants: number;
  totalSchools: number;
  activeSessions: number;
  systemHealth: "Stable" | "Warning" | "Critical";
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  section?: "TỔNG QUAN" | "QUẢN TRỊ HỆ THỐNG";
}

export interface ActivityData {
  name: string;
  total: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: "Success" | "Failed" | "Warning";
}
