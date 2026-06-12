
export type AuditLogAction = 'login' | 'logout' | 'view' | 'download' | 'create' | 'update' | 'delete' | 'other';

export type AuditLogEntry = {
  id: number;
  occurredAt: string;
  action: string;
  entityId: string;
  entityType: string;
  metadata: string; // JSON string
  schoolId: string | null;
  tenantId: string;
  userId: string;
  // UI helper fields (populated during mapping)
  ipAddress?: string;
  username?: string;
};

export type AuditLogFilter = {
  startDate: string;
  endDate: string;
  userId: string;
  tenantId: string;
  schoolId: string;
  action: string;
};
