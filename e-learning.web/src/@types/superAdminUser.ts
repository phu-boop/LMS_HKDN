// ----------------------------------------------------------------------

export type SuperAdminUserStatus = 'active' | 'locked';

export type SuperAdminManagedUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  roleId: string;
  roleName: string;
  schoolId: string;
  schoolName: string;
  tenantId: string;
  tenantName: string;
  status: SuperAdminUserStatus;
  accountType?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserAuditAction = 'CREATE' | 'UPDATE' | 'LOCK' | 'UNLOCK';

export type UserAuditLogEntry = {
  id: string;
  at: string;
  actorLabel: string;
  action: UserAuditAction;
  userId: string;
  userLabel: string;
  detail: string;
};
