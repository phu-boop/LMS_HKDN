"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems } from "@/lib/mockData/dashboard";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-white transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center border-b px-6 justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-xl">
             <span className="text-red-700">AIG</span>
             <span className="text-[10px] leading-tight text-gray-500 font-normal">Innovation<br/>for Education</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <LucideIcons.ChevronRight className="h-5 w-5" />
          ) : (
            <LucideIcons.ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {/* User Profile Info */}
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
              Đ
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Đặng Tấn Trọng</p>
              <p className="text-xs text-gray-500">LMS_ADMIN</p>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        {["TỔNG QUAN", "QUẢN TRỊ HỆ THỐNG"].map((section) => (
          <div key={section} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                {section}
              </h3>
            )}
            <nav className="space-y-1">
              {adminNavItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = (LucideIcons as any)[item.icon];
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100",
                        isActive
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-500 hover:text-gray-900",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
