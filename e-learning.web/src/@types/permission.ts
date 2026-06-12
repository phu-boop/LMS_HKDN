export type GranteeType = 'SCHOOL' | 'USER';

export type ContentPermission = {
  id: string;
  tenantId: string;
  curriculumNodeId: string;
  sourceNodeId?: string | null;
  isInherited?: boolean;
  granteeType: GranteeType;
  granteeId: string;
  granteeName: string;
  schoolId?: string | null;
  userId?: string | null;
  canView: boolean;
  canDownload: boolean;
  canComment: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PermissionState = {
  isLoading: boolean;
  error: string | null;
  permissions: ContentPermission[];
  selectedNodeId: string | null;
  selectedNodeTitle: string | null;
  checkedNodeIds: string[];
};
