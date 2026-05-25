import React from "react";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import { mockAuditLogs } from "@/lib/mockData/dashboard";

export default function AuditLogsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Truy vết lịch sử hoạt động và bảo mật hệ thống</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
           <div className="flex items-center gap-4">
              <input 
                type="text" 
                placeholder="Tìm kiếm log..." 
                className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <select className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option>Tất cả module</option>
                <option>Tenant Manager</option>
                <option>Curriculum</option>
                <option>Auth</option>
              </select>
           </div>
           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Xuất Báo Cáo
           </button>
        </div>
        <AuditLogTable logs={mockAuditLogs} />
        
        {/* Simple Pagination Placeholder */}
        <div className="p-6 border-t flex items-center justify-between text-sm text-gray-500">
           <p>Hiển thị 1 - {mockAuditLogs.length} của 50 logs</p>
           <div className="flex gap-2">
              <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Trước</button>
              <button className="px-3 py-1 border rounded bg-blue-50 text-blue-600 border-blue-200">1</button>
              <button className="px-3 py-1 border rounded hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border rounded hover:bg-gray-50">Sau</button>
           </div>
        </div>
      </div>
    </div>
  );
}
