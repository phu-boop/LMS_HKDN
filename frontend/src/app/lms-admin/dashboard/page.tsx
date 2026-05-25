import React from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { mockDashboardStats, mockActivityData, mockAuditLogs } from "@/lib/mockData/dashboard";

export default function LmsAdminDashboardPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Giám sát hoạt động của toàn bộ hệ thống LMS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng Số Tenants"
          value={mockDashboardStats.totalTenants}
          icon="Globe"
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Tổng Số Trường Học"
          value={mockDashboardStats.totalSchools}
          icon="Home"
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard
          title="Sessions Đang Hoạt Động"
          value={mockDashboardStats.activeSessions}
          icon="Activity"
          colorClass="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Trạng Thái Hệ Thống"
          value={mockDashboardStats.systemHealth}
          icon="HeartPulse"
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Biểu đồ tăng trưởng</h3>
            <p className="text-sm text-gray-400">Số lượng người dùng hoạt động theo tháng (2024)</p>
          </div>
          <OverviewChart data={mockActivityData} />
        </div>

        {/* System Health / Quick Info */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin nhanh</h3>
          <div className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400">Module Quản lý Tenant đang hoạt động tốt nhất</p>
             </div>
             <div className="p-4 bg-red-50 rounded-xl border border-dashed border-red-100 text-center">
                <p className="text-xs text-red-500 font-medium">Cảnh báo: 2 chứng chỉ SSL sắp hết hạn</p>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs in Dashboard */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            <p className="text-sm text-gray-400">Các log hệ thống quan trọng vừa ghi nhận</p>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</button>
        </div>
        <AuditLogTable logs={mockAuditLogs.slice(0, 3)} />
      </div>
    </div>
  );
}
