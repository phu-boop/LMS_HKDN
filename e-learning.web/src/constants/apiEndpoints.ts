/**
 * API paths relative to HOST_API_URL. Define app endpoints here — not in .env.
 */
export const API_ENDPOINTS = {
  authLogin: '/api/identity/auth/login',
  authRefresh: '/api/identity/auth/refresh',
  authLogout: '/api/identity/auth/logout',
  authChangePassword: '/api/identity/auth/change-password',
  authResetPassword: '/api/identity/auth/reset-password',
  /** POST identifier (email/username) → trả về tenantBranding + nextStep (Identifier-First Login flow). */
  identityIdentify: '/api/identity/identify',
  /** GET danh sách workspace (tenant) user được phép truy cập. */
  identityWorkspaces: '/api/identity/workspaces',
  /** POST chọn/chuyển workspace → trả về token đã scope vào tenant đó. */
  identityWorkspaceSelect: (tenantId: string) => `/api/identity/workspaces/${tenantId}/select`,
  authRegister: '/api/account/register',
  authRoles: '/api/authorization/roles',
  /** GET danh sách trường (admin). */
  schoolsList: '/api/admin/schools',
  /** POST tạo trường (admin). */
  schoolsCreate: '/api/admin/schools',
  /** GET chi tiết trường theo id (admin). */
  schoolById: (id: string) => `/api/admin/schools/${id}`,
  /** PUT cập nhật trường (admin). */
  schoolUpdate: (id: string) => `/api/admin/schools/${id}`,
  /** PATCH cập nhật trạng thái trường — suspend / kích hoạt (admin). */
  schoolStatus: (id: string) => `/api/admin/schools/${id}/status`,
  /** GET danh sách tenant (admin). Query: status, search (optional). */
  tenantsList: '/api/admin/tenants',
  /** POST create new tenant (admin). */
  tenantsCreate: '/api/admin/tenants',
  /** PATCH status of tenant (admin). */
  tenantsStatus: (id: string) => `/api/admin/tenants/${id}/status`,
  /** Catalog management (admin). type: category, tag, etc. */
  catalogByType: (type: string) => `/api/admin/catalog/${type}`,
  catalogById: (type: string, id: string) => `/api/admin/catalog/${type}/${id}`,
  usersCreate: '/api/admin/users',
  adminDashboardStats: '/api/admin/reports/overview',
  adminDashboardActiveSessions: '/api/admin/reports/active-session',
  adminDashboardSessions: '/api/admin/dashboard/sessions',
  adminAuditLogs: '/api/admin/audit-logs',
  adminAuditLogsExport: '/api/admin/audit-logs/export',
  tenantsCurriculum: (tenantId: string) => `/api/tenants/${tenantId}/curriculum`,
  tenantsCurriculumNode: (tenantId: string, nodeId: string) => `/api/tenants/${tenantId}/curriculum/${nodeId}`,
  tenantsCurriculumChildren: (tenantId: string, nodeId: string) => `/api/tenants/${tenantId}/curriculum/${nodeId}/children`,
  tenantsCurriculumReorder: (tenantId: string) => `/api/tenants/${tenantId}/curriculum/reorder`,
  tenantsCurriculumPermissions: (tenantId: string) => `/api/tenants/${tenantId}/curriculum/permissions`,
  tenantsContents: (tenantId: string) => `/api/tenants/${tenantId}/contents`,
  tenantsContentById: (tenantId: string, contentId: string) => `/api/tenants/${tenantId}/contents/${contentId}`,
  tenantsContentStatus: (tenantId: string, contentId: string) => `/api/tenants/${tenantId}/contents/${contentId}/status`,
  tenantsContentUpload: (tenantId: string, contentId: string) => `/api/tenants/${tenantId}/contents/${contentId}/upload`,
  tenantsContentProcessingStatus: (tenantId: string, contentId: string) => `/api/tenants/${tenantId}/contents/${contentId}/processing-status`,
  tenantsContentReprocess: (tenantId: string, contentId: string) => `/api/tenants/${tenantId}/contents/${contentId}/reprocess`,
  tenantsPermissions: (tenantId: string) => `/api/tenants/${tenantId}/permissions`,
  tenantComments: '/api/tenants/comments',
  tenantCommentContents: '/api/tenants/comments/contents',
  tenantCommentById: (commentId: string) => `/api/tenants/comments/${commentId}`,
  tenantCommentDelete: (commentId: string) => `/api/tenants/comments/${commentId}`,
  tenantCommentEdit: (commentId: string) => `/api/tenants/comments/${commentId}`,
  tenantCommentReply: (commentId: string) => `/api/tenants/comments/${commentId}/reply`,
  tenantCommentStatus: (commentId: string) => `/api/tenants/comments/${commentId}/visibility`,
  tenantCommentPin: (commentId: string) => `/api/tenants/comments/${commentId}/pin`,
  cmsContentsList: '/api/cms/contents',
  cmsContentById: (id: string) => `/api/cms/contents/${id}`,
  cmsContentsCreate: '/api/cms/contents',
  cmsContentUpdate: (id: string) => `/api/cms/contents/${id}`,
  cmsContentStatus: (id: string) => `/api/cms/contents/${id}/status`,
  learningStructureTree: '/api/admin/catalog/learning-structure',
  reportsOverview: '/api/admin/reports/overview',
  programActivate: (id: string) => `/api/tenancy/programs/${id}/activate`,
  programDeactivate: (id: string) => `/api/tenancy/programs/${id}/deactivate`,
  /** GET general subscriptions list (admin). */
  subscriptionsList: '/api/admin/subscriptions',
  /** GET/POST subscriptions for a school (admin). */
  schoolSubscriptions: (schoolId: string) => `/api/admin/schools/${schoolId}/subscriptions`,
  /** PUT/DELETE a specific subscription (admin). */
  schoolSubscriptionById: (schoolId: string, subscriptionId: string) => `/api/admin/schools/${schoolId}/subscriptions/${subscriptionId}`,
  /** Personnel & Roles */
  tenantsMembers: (tenantId: string) => `/api/admin/tenants/${tenantId}/members`,
  usersList: '/api/admin/users',
  userById: (id: string) => `/api/admin/users/${id}`,
  userUpdate: (id: string) => `/api/admin/users/${id}`,
  userAvatar: (id: string) => `/api/admin/users/${id}/avatar`,
  userStatus: (id: string) => `/api/admin/users/${id}/status`,
  userResetPassword: (id: string) => `/api/admin/users/${id}/reset-password`,
  adminSessionDelete: (userId: string) => `/api/identity/auth/admin/sessions/users/${userId}`,
  adminRoles: '/api/admin/roles',
  assignUserTenant: (userId: string) => `/api/admin/users/${userId}/tenants`,
  revokeUserTenant: (userId: string, tenantId: string) => `/api/admin/users/${userId}/tenants/${tenantId}`,
  /** Client Portal (TEACHER/STUDENT) */
  clientCurriculum: '/api/client/curriculum',
  clientCurriculumNode: (nodeId: string) => `/api/client/curriculum/${nodeId}`,
  clientCurriculumContents: (nodeId: string) => `/api/client/curriculum/${nodeId}/contents`,
  clientFavorites: '/api/client/favorites',
  clientFavoriteAdd: (contentId: string) => `/api/client/favorites/${contentId}`,
  clientFavoriteRemove: (contentId: string) => `/api/client/favorites/${contentId}`,
  clientDashboard: '/api/client/dashboard/summary',
  clientDashboardQuickAccess: '/api/client/dashboard/quick-access',
  clientRecentContents: '/api/client/recent-contents',
  clientContentStreamUrl: (id: string) => `/api/client/contents/${id}/stream-url`,
  clientContentViewUrl: (id: string) => `/api/client/contents/${id}/view-url`,
  clientContentWatermarkConfig: (id: string) => `/api/client/contents/${id}/watermark-config`,
  clientContentProgress: (id: string) => `/api/client/curriculum/contents/${id}/progress`,
  clientContentDownloadUrl: (id: string) => `/api/client/contents/${id}/download-url`,
  clientContentDirectUrl: (id: string) => `/api/client/contents/${id}/direct-url`,
  tenantDashboardSummary: '/api/tenants/dashboard/summary',
  tenantDashboardTopContents: '/api/tenants/dashboard/top-contents',
  tenantAuditLogs: '/api/tenants/audit-logs',
  clientContentComments: (id: string) => `/api/client/contents/${id}/comments`,
  clientContentCommentById: (id: string, commentId: string) => `/api/client/contents/${id}/comments/${commentId}`,
};
