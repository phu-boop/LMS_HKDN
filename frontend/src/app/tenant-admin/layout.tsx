import type { ReactNode } from "react";

export default function TenantAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <strong>Tenant Admin</strong>
      </header>
      {children}
    </div>
  );
}
