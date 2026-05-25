import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  colorClass: string;
}

export function StatCard({ title, value, icon, colorClass }: StatCardProps) {
  const Icon = (LucideIcons as any)[icon];

  return (
    <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm transition-hover hover:shadow-md">
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
