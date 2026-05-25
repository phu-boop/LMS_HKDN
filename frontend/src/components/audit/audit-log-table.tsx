"use client";

import { AuditLog } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-50/50">
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Thời gian</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Người dùng</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Hành động</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Module</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-4 text-sm text-gray-600 font-mono">{log.timestamp}</td>
              <td className="px-4 py-4 text-sm font-medium text-gray-900">{log.user}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{log.action}</td>
              <td className="px-4 py-4 text-sm text-gray-500">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {log.module}
                </span>
              </td>
              <td className="px-4 py-4 text-sm">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    log.status === "Success" && "bg-green-100 text-green-700",
                    log.status === "Failed" && "bg-red-100 text-red-700",
                    log.status === "Warning" && "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {log.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
