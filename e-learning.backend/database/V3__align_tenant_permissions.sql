-- ============================================================
-- Align tenant permission codes with current API authorization
-- ============================================================

-- Remove legacy tenant status permissions from existing data.
DELETE FROM role_permission
WHERE permission_id IN (
    SELECT id
    FROM permission
    WHERE code IN ('TENANTS_ACTIVATE', 'TENANTS_DEACTIVATE')
);

DELETE FROM permission
WHERE code IN ('TENANTS_ACTIVATE', 'TENANTS_DEACTIVATE');

-- Ensure the current tenant status permission exists.
INSERT INTO permission (id, code, module, description)
VALUES (
    '00000000-0000-0000-0003-000000000004',
    'TENANTS_CHANGE_STATUS',
    'tenants',
    'Change tenant status between ACTIVE, INACTIVE, and LOCKED'
)
ON CONFLICT (code) DO UPDATE
SET module = EXCLUDED.module,
    description = EXCLUDED.description;

-- Ensure LMS Admin keeps full tenant-management access.
INSERT INTO role_permission (role_id, permission_id)
SELECT
    '00000000-0000-0000-0002-000000000001',
    id
FROM permission
WHERE code = 'TENANTS_CHANGE_STATUS'
ON CONFLICT (role_id, permission_id) DO NOTHING;