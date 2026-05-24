import type { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 16 }}>
        <strong>Client Portal</strong>
      </header>
      {children}
    </div>
  );
}
