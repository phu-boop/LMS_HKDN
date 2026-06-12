-- ============================================================
-- SEED: Dev test data (aligned to schema V5.1)
-- Password for all users: Admin@123
-- BCrypt hash (cost=10): $2a$10$TMBt8yXmWR8mtC6SsMfk5uouIfqkPU0L8kevZgIifwa7dfuBq6xOa
-- ============================================================

-- ============================================================
-- 1. TENANTS
-- ============================================================
INSERT INTO tenant (id, code, name, subdomain, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'PLATFORM', 'LMS Platform',   'admin',   'ACTIVE'),
  ('00000000-0000-0000-0000-000000000002', 'STEM',     'STEM Education', 'stem',    'ACTIVE'),
  ('00000000-0000-0000-0000-000000000003', 'ENGLISH',  'English Program','english', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. SCHOOLS
-- ============================================================
INSERT INTO school (id, code, name, status) VALUES
  ('00000000-0000-0000-0001-000000000001', 'SCH001', 'Trường Demo', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. ROLES
-- ============================================================
INSERT INTO role (id, code, name, description) VALUES
  ('00000000-0000-0000-0002-000000000001', 'LMS_ADMIN',    'LMS Admin',    'Full platform access: tenants, schools, users, content, reports'),
  ('00000000-0000-0000-0002-000000000002', 'TENANT_ADMIN', 'Tenant Admin', 'Full access within assigned tenant: content, curriculum, user grants'),
  ('00000000-0000-0000-0002-000000000003', 'SCHOOL_ADMIN', 'School Admin', 'Manage users and role assignments within the school'),
  ('00000000-0000-0000-0002-000000000004', 'TEACHER',      'Teacher',      'View and present published content'),
  ('00000000-0000-0000-0002-000000000005', 'STUDENT',      'Student',      'View published content only')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 4. PERMISSIONS
-- ============================================================
INSERT INTO permission (id, code, module, description) VALUES
  -- Tenants
  ('00000000-0000-0000-0003-000000000001', 'TENANTS_VIEW',              'tenants',    'List and view tenant details'),
  ('00000000-0000-0000-0003-000000000002', 'TENANTS_CREATE',            'tenants',    'Create a new tenant'),
  ('00000000-0000-0000-0003-000000000003', 'TENANTS_UPDATE',            'tenants',    'Update tenant info and branding'),
  ('00000000-0000-0000-0003-000000000004', 'TENANTS_CHANGE_STATUS',     'tenants',    'Change tenant status between ACTIVE, INACTIVE, and LOCKED'),
  -- Schools
  ('00000000-0000-0000-0003-000000000010', 'SCHOOLS_VIEW',              'schools',    'List and view school details'),
  ('00000000-0000-0000-0003-000000000011', 'SCHOOLS_CREATE',            'schools',    'Create a new school'),
  ('00000000-0000-0000-0003-000000000012', 'SCHOOLS_UPDATE',            'schools',    'Update school info'),
  ('00000000-0000-0000-0003-000000000013', 'SCHOOLS_CHANGE_STATUS',     'schools',    'Lock or unlock a school'),
  -- Users
  ('00000000-0000-0000-0003-000000000020', 'USERS_VIEW',                'users',      'List and view user accounts'),
  ('00000000-0000-0000-0003-000000000021', 'USERS_CREATE',              'users',      'Create a new user account'),
  ('00000000-0000-0000-0003-000000000022', 'USERS_UPDATE',              'users',      'Update user profile'),
  ('00000000-0000-0000-0003-000000000023', 'USERS_DELETE',              'users',      'Soft-delete a user account'),
  ('00000000-0000-0000-0003-000000000024', 'USERS_CHANGE_STATUS',       'users',      'Lock, unlock, or disable a user'),
  -- Roles & Assignments
  ('00000000-0000-0000-0003-000000000030', 'ROLES_VIEW',                'roles',      'List roles and their permissions'),
  ('00000000-0000-0000-0003-000000000031', 'ROLES_ASSIGN',              'roles',      'Assign a role to a user within a tenant'),
  ('00000000-0000-0000-0003-000000000032', 'ROLES_REVOKE',              'roles',      'Revoke a role from a user'),
  -- Curriculum
  ('00000000-0000-0000-0003-000000000040', 'CURRICULUM_VIEW',           'curriculum', 'Browse the curriculum tree'),
  ('00000000-0000-0000-0003-000000000041', 'CURRICULUM_MANAGE',         'curriculum', 'Create, update, reorder, and delete curriculum nodes'),
  -- Content Management
  ('00000000-0000-0000-0003-000000000050', 'CONTENT_VIEW',              'content',    'View published content items'),
  ('00000000-0000-0000-0003-000000000051', 'CONTENT_CREATE',            'content',    'Upload and create new content items'),
  ('00000000-0000-0000-0003-000000000052', 'CONTENT_UPDATE',            'content',    'Edit content metadata and replace files'),
  ('00000000-0000-0000-0003-000000000053', 'CONTENT_DELETE',            'content',    'Soft-delete a content item'),
  ('00000000-0000-0000-0003-000000000054', 'CONTENT_PUBLISH',           'content',    'Publish or archive a content item'),
  -- Content Permissions
  ('00000000-0000-0000-0003-000000000060', 'CONTENT_PERMISSION_GRANT',  'content',    'Grant content access to a school or specific user'),
  ('00000000-0000-0000-0003-000000000061', 'CONTENT_PERMISSION_REVOKE', 'content',    'Revoke content access from a school or specific user'),
  -- Audit & Reports
  ('00000000-0000-0000-0003-000000000070', 'AUDIT_LOGS_VIEW',           'audit',      'View audit log entries with filtering'),
  ('00000000-0000-0000-0003-000000000071', 'AUDIT_LOGS_EXPORT',         'audit',      'Export audit logs as CSV/Excel'),
  ('00000000-0000-0000-0003-000000000080', 'REPORTS_VIEW',              'reports',    'View operational reports and online-user statistics'),
  -- Sessions
  ('00000000-0000-0000-0003-000000000090', 'SESSIONS_VIEW',             'sessions',   'View active session list for any user (admin)'),
  ('00000000-0000-0000-0003-000000000091', 'SESSIONS_MANAGE',           'sessions',   'Force-revoke any active session (admin)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 5. ROLE-PERMISSION MAPPINGS
-- ============================================================

-- LMS_ADMIN: all permissions
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000001', id FROM permission
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- TENANT_ADMIN: schools (view) + users (no delete) + roles + curriculum + content full + permissions + audit view + reports
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000002', id FROM permission
WHERE code IN (
  'SCHOOLS_VIEW',
  'USERS_VIEW', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_CHANGE_STATUS',
  'ROLES_VIEW', 'ROLES_ASSIGN', 'ROLES_REVOKE',
  'CURRICULUM_VIEW', 'CURRICULUM_MANAGE',
  'CONTENT_VIEW', 'CONTENT_CREATE', 'CONTENT_UPDATE', 'CONTENT_DELETE', 'CONTENT_PUBLISH',
  'CONTENT_PERMISSION_GRANT', 'CONTENT_PERMISSION_REVOKE',
  'AUDIT_LOGS_VIEW',
  'REPORTS_VIEW'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SCHOOL_ADMIN: user management within school + curriculum & content view
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000003', id FROM permission
WHERE code IN (
  'USERS_VIEW', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_CHANGE_STATUS',
  'ROLES_VIEW', 'ROLES_ASSIGN', 'ROLES_REVOKE',
  'CURRICULUM_VIEW',
  'CONTENT_VIEW'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- TEACHER: curriculum + content view only
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000004', id FROM permission
WHERE code IN ('CURRICULUM_VIEW', 'CONTENT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STUDENT: curriculum + content view only
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000005', id FROM permission
WHERE code IN ('CURRICULUM_VIEW', 'CONTENT_VIEW')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 6. USERS
-- (password_hash = BCrypt of 'Admin@123', cost=10)
-- ============================================================
INSERT INTO user_account (id, username, email, password_hash, full_name, account_type, home_school_id, status) VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    'superadmin',
    'superadmin@lms.dev',
    '$2a$10$TMBt8yXmWR8mtC6SsMfk5uouIfqkPU0L8kevZgIifwa7dfuBq6xOa',
    'Super Admin',
    'LMS_ADMIN',
    NULL,                                       -- LMS Admin không thuộc trường nào
    'ACTIVE'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    'stem_admin',
    'stem_admin@lms.dev',
    '$2a$10$TMBt8yXmWR8mtC6SsMfk5uouIfqkPU0L8kevZgIifwa7dfuBq6xOa',
    'STEM Tenant Admin',
    'TENANT_ADMIN',
    NULL,                                       -- Tenant Admin không bắt buộc thuộc trường
    'ACTIVE'
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    'teacher01',
    'teacher01@lms.dev',
    '$2a$10$TMBt8yXmWR8mtC6SsMfk5uouIfqkPU0L8kevZgIifwa7dfuBq6xOa',
    'Giáo viên 01',
    'TEACHER',
    '00000000-0000-0000-0001-000000000001',     -- Thuộc Trường Demo
    'ACTIVE'
  )
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 7. SCHOOL-TENANT MAPPINGS (Contracts)
-- ============================================================
INSERT INTO school_tenant_mapping
  (id, tenant_id, school_id, contract_start, contract_end, max_concurrent_sessions, login_policy, enforce_expiry, status)
VALUES
  (
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0000-000000000002',   -- STEM tenant
    '00000000-0000-0000-0001-000000000001',   -- Trường Demo
    '2026-01-01',
    '2027-12-31',
    5,
    'BLOCK_NEW',
    TRUE,
    'ACTIVE'
  )
ON CONFLICT (tenant_id, school_id) DO NOTHING;

-- ============================================================
-- 8. USER-TENANT-ROLE ASSIGNMENTS
-- ============================================================
INSERT INTO user_tenant_role_assignment (id, user_id, tenant_id, role_id) VALUES
  (
    '00000000-0000-0000-0006-000000000001',
    '00000000-0000-0000-0004-000000000001',   -- superadmin
    '00000000-0000-0000-0000-000000000001',   -- PLATFORM tenant
    '00000000-0000-0000-0002-000000000001'    -- LMS_ADMIN role
  ),
  (
    '00000000-0000-0000-0006-000000000002',
    '00000000-0000-0000-0004-000000000002',   -- stem_admin
    '00000000-0000-0000-0000-000000000002',   -- STEM tenant
    '00000000-0000-0000-0002-000000000002'    -- TENANT_ADMIN role
  ),
  (
    '00000000-0000-0000-0006-000000000003',
    '00000000-0000-0000-0004-000000000003',   -- teacher01
    '00000000-0000-0000-0000-000000000002',   -- STEM tenant
    '00000000-0000-0000-0002-000000000004'    -- TEACHER role
  )
ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING;
