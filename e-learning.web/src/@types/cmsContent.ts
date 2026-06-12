export type CmsContentType = 'VIDEO' | 'PDF' | 'DOCUMENT' | 'SLIDE' | 'URL' | 'ASSIGNMENT' | 'QUIZ' | 'view' | 'stream';

export type CmsContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CmsContent = {
  id: string;
  title: string;
  type: CmsContentType;
  description: string;
  contentItemDescription?: string;
  fileName: string;
  fileSizeBytes: number | null;
  publishStatus: CmsContentStatus;
  isDownloadable: boolean;
  watermarkEnabled: boolean;
  visibilityFrom: string | null;
  visibilityTo: string | null;
  sourceUrl?: string;
  curriculumNodeId?: string;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  updatedAt: string;
};

export type CmsContentResponse = {
  items: CmsContent[];
  total?: number;
};

export type CurriculumContentProgress = {
  contentId: string;
  progressValue: number;
  updatedAt: string | null;
};

// ----------------------------------------------------------------------
// Tenant Member — matches GET /api/admin/tenants/{tenantId}/members

export type TenantMember = {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  isInherited: boolean;
  assignedAt: string;
};
