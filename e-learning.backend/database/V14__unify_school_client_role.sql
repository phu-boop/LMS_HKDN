-- ============================================================
-- V14: Rename SCHOOL_ADMIN to SCHOOL and retire TEACHER/STUDENT roles
-- - Rebuild account_type enum to: LMS_ADMIN, TENANT_ADMIN, SCHOOL
-- - Rename role code SCHOOL_ADMIN -> SCHOOL (no new role row)
-- - Migrate account_type SCHOOL_ADMIN/TEACHER/STUDENT -> SCHOOL
-- - Retire TEACHER/STUDENT role assignments and roles
-- ============================================================

-- 1) Rebuild enum account_type to exactly 3 values
-- NOTE: This step requires privileges on type account_type.
ALTER TABLE user_account
ALTER COLUMN account_type TYPE TEXT
USING account_type::TEXT;

UPDATE user_account
SET account_type = 'SCHOOL',
    updated_at = NOW()
WHERE account_type IN ('SCHOOL_ADMIN', 'TEACHER', 'STUDENT');

DROP TYPE account_type;

CREATE TYPE account_type AS ENUM ('LMS_ADMIN', 'TENANT_ADMIN', 'SCHOOL');

ALTER TABLE user_account
ALTER COLUMN account_type TYPE account_type
USING account_type::account_type;

-- 2) Consolidate role SCHOOL_ADMIN into SCHOOL
-- 2.1) If SCHOOL does not exist yet, rename SCHOOL_ADMIN -> SCHOOL
UPDATE role
SET code = 'SCHOOL',
    name = 'School Client',
    description = 'Client role for school users with learning content access',
    is_deleted = FALSE,
    updated_at = NOW()
WHERE code = 'SCHOOL_ADMIN'
  AND is_deleted = FALSE
  AND NOT EXISTS (
      SELECT 1
      FROM role r2
      WHERE r2.code = 'SCHOOL'
        AND r2.id <> role.id
  );

-- 2.2) Ensure SCHOOL role is active and has standardized metadata
UPDATE role
SET name = 'School Client',
    description = 'Client role for school users with learning content access',
    is_deleted = FALSE,
    updated_at = NOW()
WHERE code = 'SCHOOL';

-- 2.3) If both roles exist, copy permissions from SCHOOL_ADMIN to SCHOOL
INSERT INTO role_permission (role_id, permission_id)
SELECT school.id, rp.permission_id
FROM role_permission rp
INNER JOIN role school_admin ON school_admin.id = rp.role_id
INNER JOIN role school ON school.code = 'SCHOOL' AND school.is_deleted = FALSE
WHERE school_admin.code = 'SCHOOL_ADMIN'
  AND school_admin.is_deleted = FALSE
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 2.4) If both roles exist, copy assignments from SCHOOL_ADMIN to SCHOOL
INSERT INTO user_tenant_role_assignment (user_id, tenant_id, role_id, is_inherited, created_by, updated_by)
SELECT utra.user_id, utra.tenant_id, school.id, utra.is_inherited, utra.created_by, utra.updated_by
FROM user_tenant_role_assignment utra
INNER JOIN role school_admin ON school_admin.id = utra.role_id
INNER JOIN role school ON school.code = 'SCHOOL' AND school.is_deleted = FALSE
WHERE school_admin.code = 'SCHOOL_ADMIN'
  AND school_admin.is_deleted = FALSE
  AND utra.is_deleted = FALSE
ON CONFLICT (user_id, tenant_id, role_id) DO NOTHING;

-- 2.5) Retire old SCHOOL_ADMIN assignments and role once SCHOOL is present
UPDATE user_tenant_role_assignment utra
SET is_deleted = TRUE,
    updated_at = NOW()
FROM role school_admin
WHERE school_admin.id = utra.role_id
  AND school_admin.code = 'SCHOOL_ADMIN'
  AND school_admin.is_deleted = FALSE
  AND utra.is_deleted = FALSE
  AND EXISTS (SELECT 1 FROM role school WHERE school.code = 'SCHOOL' AND school.is_deleted = FALSE);

UPDATE role
SET is_deleted = TRUE,
    updated_at = NOW()
WHERE code = 'SCHOOL_ADMIN'
  AND is_deleted = FALSE
  AND EXISTS (SELECT 1 FROM role school WHERE school.code = 'SCHOOL' AND school.is_deleted = FALSE);

-- 3) account_type has been normalized in step 1

-- 4) Retire TEACHER/STUDENT assignments
UPDATE user_tenant_role_assignment utra
SET is_deleted = TRUE,
    updated_at = NOW()
FROM role r
WHERE utra.role_id = r.id
  AND utra.is_deleted = FALSE
  AND r.code IN ('TEACHER', 'STUDENT');

-- 5) Retire TEACHER/STUDENT roles
UPDATE role
SET is_deleted = TRUE,
    updated_at = NOW()
WHERE code IN ('TEACHER', 'STUDENT')
  AND is_deleted = FALSE;
