import { Sidebar } from "@/components/layout/sidebar";
import type { ReactNode } from "react";

export default function LmsAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#f9fafc]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center border-b bg-white px-8">
          <h2 className="text-lg font-semibold text-gray-800">LMS Admin Portal</h2>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
