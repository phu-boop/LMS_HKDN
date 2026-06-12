-- ============================================================
-- V11: Content Team Roles
-- Thêm 2 roles cho đội ngũ biên tập/kiểm duyệt nội dung trong tenant
-- ============================================================

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO role (id, code, name, description) VALUES
  ('00000000-0000-0000-0002-000000000006', 'CONTENT_CREATOR',  'Content Creator',  'Tạo mới và upload học liệu (DRAFT only). Không có quyền Publish.'),
  ('00000000-0000-0000-0002-000000000007', 'CONTENT_REVIEWER', 'Content Reviewer', 'Xem tất cả học liệu nháp, sửa metadata và Publish/Archive. Không tạo mới.')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. ROLE-PERMISSION MAPPINGS
-- ============================================================

-- CONTENT_CREATOR: tạo + upload + sửa draft. Không publish, không delete.
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000006', id FROM permission
WHERE code IN (
  'CURRICULUM_VIEW',
  'CATALOG_VIEW',
  'CONTENT_VIEW',
  'CONTENT_CREATE',
  'CONTENT_UPDATE'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CONTENT_REVIEWER: xem tất cả, sửa, publish/archive. Không tạo mới.
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000007', id FROM permission
WHERE code IN (
  'CURRICULUM_VIEW',
  'CATALOG_VIEW',
  'CONTENT_VIEW',
  'CONTENT_UPDATE',
  'CONTENT_PUBLISH'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
