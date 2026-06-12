// ----------------------------------------------------------------------

function path(root: string, sublink: string) {
  return `${root}${sublink}`;
}

const ROOTS_AUTH = '/auth';
const ROOTS_DASHBOARD = '/dashboard';
const ROOTS_ADMIN = '/admin';
const ROOTS_CLIENT = '/client';

// ----------------------------------------------------------------------

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, '/login'),
  register: path(ROOTS_AUTH, '/register'),
  loginUnprotected: path(ROOTS_AUTH, '/login'),
  registerUnprotected: path(ROOTS_AUTH, '/register'),
  verify: path(ROOTS_AUTH, '/verify'),
  resetPassword: path(ROOTS_AUTH, '/reset-password'),
  newPassword: path(ROOTS_AUTH, '/new-password'),
  selectWorkspace: path(ROOTS_AUTH, '/select-workspace'),
};

export const PATH_PAGE = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/403',
  page404: '/404',
  page500: '/500',
  components: '/components',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    app: path(ROOTS_DASHBOARD, '/app'),
    ecommerce: path(ROOTS_DASHBOARD, '/ecommerce'),
    analytics: path(ROOTS_DASHBOARD, '/analytics'),
    banking: path(ROOTS_DASHBOARD, '/banking'),
    booking: path(ROOTS_DASHBOARD, '/booking'),
  },
  mail: {
    root: path(ROOTS_DASHBOARD, '/mail'),
    all: path(ROOTS_DASHBOARD, '/mail/all'),
  },
  chat: {
    root: path(ROOTS_DASHBOARD, '/chat'),
    new: path(ROOTS_DASHBOARD, '/chat/new'),
    view: (name: string) => path(ROOTS_DASHBOARD, `/chat/${name}`),
  },
  calendar: path(ROOTS_DASHBOARD, '/calendar'),
  kanban: path(ROOTS_DASHBOARD, '/kanban'),
  permissionDenied: path(ROOTS_DASHBOARD, '/permission-denied'),
  user: {
    root: path(ROOTS_DASHBOARD, '/user'),
    new: path(ROOTS_DASHBOARD, '/user/new'),
    list: path(ROOTS_DASHBOARD, '/user/list'),
    cards: path(ROOTS_DASHBOARD, '/user/cards'),
    profile: path(ROOTS_DASHBOARD, '/user/profile'),
    account: path(ROOTS_DASHBOARD, '/user/account'),
    edit: (name: string) => path(ROOTS_DASHBOARD, `/user/${name}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, `/user/reece-chung/edit`),
  },
  eCommerce: {
    root: path(ROOTS_DASHBOARD, '/e-commerce'),
    shop: path(ROOTS_DASHBOARD, '/e-commerce/shop'),
    list: path(ROOTS_DASHBOARD, '/e-commerce/list'),
    checkout: path(ROOTS_DASHBOARD, '/e-commerce/checkout'),
    new: path(ROOTS_DASHBOARD, '/e-commerce/product/new'),
    view: (name: string) => path(ROOTS_DASHBOARD, `/e-commerce/product/${name}`),
    edit: (name: string) => path(ROOTS_DASHBOARD, `/e-commerce/product/${name}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, '/e-commerce/product/nike-blazer-low-77-vintage/edit'),
    demoView: path(ROOTS_DASHBOARD, '/e-commerce/product/nike-air-force-1-ndestrukt'),
  },
  invoice: {
    root: path(ROOTS_DASHBOARD, '/invoice'),
    list: path(ROOTS_DASHBOARD, '/invoice/list'),
    new: path(ROOTS_DASHBOARD, '/invoice/new'),
    view: (id: string) => path(ROOTS_DASHBOARD, `/invoice/${id}`),
    edit: (id: string) => path(ROOTS_DASHBOARD, `/invoice/${id}/edit`),
    demoEdit: path(ROOTS_DASHBOARD, '/invoice/e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1/edit'),
    demoView: path(ROOTS_DASHBOARD, '/invoice/e99f09a7-dd88-49d5-b1c8-1daf80c2d7b5'),
  },
  blog: {
    root: path(ROOTS_DASHBOARD, '/blog'),
    posts: path(ROOTS_DASHBOARD, '/blog/posts'),
    new: path(ROOTS_DASHBOARD, '/blog/new'),
    view: (title: string) => path(ROOTS_DASHBOARD, `/blog/post/${title}`),
    demoView: path(ROOTS_DASHBOARD, '/blog/post/apply-these-7-secret-techniques-to-improve-event'),
  },
};

export const PATH_ADMIN = {
  root: ROOTS_ADMIN,
  dashboard: path(ROOTS_ADMIN, '/dashboard'),
  tenantAdminDashboard: '/tenant-admin/dashboard',
  tenantAdminCurriculum: '/tenant-admin/curriculum',
  tenantAdminCms: '/tenant-admin/cms',
  tenantAdminPermissions: '/tenant-admin/permissions',
  tenantAdminComments: '/tenant-admin/comments',
  tenantAdminUsers: '/tenant-admin/users',
  tenantAdminAuditLogs: '/tenant-admin/audit-logs',
  userProfile: path(ROOTS_ADMIN, '/user/profile'),
  userAccount: path(ROOTS_ADMIN, '/user/account'),
  schools: path(ROOTS_ADMIN, '/schools'),
  schoolSubscriptions: (id: string) => path(ROOTS_ADMIN, `/schools/${id}/subscriptions`),
  localPartners: path(ROOTS_ADMIN, '/local-partners'),
  programTenants: path(ROOTS_ADMIN, '/program-tenants'),
  users: path(ROOTS_ADMIN, '/users'),
  roles: path(ROOTS_ADMIN, '/roles'),
  subscriptions: path(ROOTS_ADMIN, '/subscriptions'),
  masterData: path(ROOTS_ADMIN, '/master-data'),
  cms: path(ROOTS_ADMIN, '/cms'),
  auditLogs: path(ROOTS_ADMIN, '/audit-logs'),
  reports: path(ROOTS_ADMIN, '/reports'),
};

export const PATH_CLIENT = {
  root: ROOTS_CLIENT,
  dashboard: path(ROOTS_CLIENT, '/dashboard'),
  library: path(ROOTS_CLIENT, '/library'),
  security: path(ROOTS_CLIENT, '/security'),
  quickAccess: path(ROOTS_CLIENT, '/quick-access'),
  history: path(ROOTS_CLIENT, '/history'),
  favorites: path(ROOTS_CLIENT, '/favorites'),
  videoViewer: (id: string) => path(ROOTS_CLIENT, `/viewer/video/${id}`),
  documentViewer: (id: string) => path(ROOTS_CLIENT, `/viewer/document/${id}`),
};

export const PATH_DOCS = 'https://docs-minimals.vercel.app/introduction';
