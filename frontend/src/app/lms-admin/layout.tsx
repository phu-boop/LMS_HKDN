import type { ReactNode } from "react";

export default function LmsAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <strong>LMS Admin</strong>
      </header>
      {children}
    </div>
  );
}
