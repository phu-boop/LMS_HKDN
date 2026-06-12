-- ============================================================
-- V6 — Catalog / Master Data (Task 2.9)
-- Shared reference data used across modules.
-- ============================================================

-- ============================================================
-- 1. TABLE
-- ============================================================

CREATE TABLE catalog_item (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(50)  NOT NULL,                        -- Category type (e.g. DOCUMENT_TYPE, DISPLAY_LABEL)
    code        VARCHAR(100) NOT NULL,                        -- Unique code within the type
    name        VARCHAR(255) NOT NULL,                        -- Human-readable display name
    description TEXT,                                        -- Optional explanation
    sort_order  INT          NOT NULL DEFAULT 0,              -- Display sort position within the type
    is_system   BOOLEAN      NOT NULL DEFAULT FALSE,          -- System items cannot be deleted
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,           -- FALSE = hidden from dropdowns / lists
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,          -- Soft delete flag
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_catalog_type_code UNIQUE (type, code)
);

CREATE INDEX idx_catalog_item_type ON catalog_item (type)
    WHERE is_deleted = FALSE;

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================

INSERT INTO permission (id, code, module, description) VALUES
    ('00000000-0000-0000-0003-000000000100', 'CATALOG_VIEW',   'catalog', 'List and view catalog items by type'),
    ('00000000-0000-0000-0003-000000000101', 'CATALOG_MANAGE', 'catalog', 'Create, update, and delete catalog items')
ON CONFLICT (code) DO NOTHING;

-- LMS_ADMIN — gets all permissions (including new catalog ones)
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000001', id
FROM permission
WHERE code IN ('CATALOG_VIEW', 'CATALOG_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- TENANT_ADMIN — catalog view only
INSERT INTO role_permission (role_id, permission_id)
SELECT '00000000-0000-0000-0002-000000000002', id
FROM permission
WHERE code = 'CATALOG_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 3. SEED DATA
-- ============================================================

INSERT INTO catalog_item (id, type, code, name, description, sort_order, is_system) VALUES
    -- DOCUMENT_TYPE
    ('00000000-0000-0000-0005-000000000001', 'DOCUMENT_TYPE', 'CONTRACT',    'Hợp đồng',            'Tài liệu hợp đồng, thỏa thuận pháp lý',              1, TRUE),
    ('00000000-0000-0000-0005-000000000002', 'DOCUMENT_TYPE', 'CURRICULUM',  'Chương trình học',    'Tài liệu chương trình, giáo án, kế hoạch dạy học',   2, TRUE),
    ('00000000-0000-0000-0005-000000000003', 'DOCUMENT_TYPE', 'REFERENCE',   'Tài liệu tham khảo', 'Sách, bài đọc thêm, tài liệu tham khảo',             3, TRUE),
    ('00000000-0000-0000-0005-000000000004', 'DOCUMENT_TYPE', 'EXERCISE',    'Bài tập',             'Bài tập, đề kiểm tra, bài thực hành',                4, TRUE),
    -- DISPLAY_LABEL
    ('00000000-0000-0000-0005-000000000010', 'DISPLAY_LABEL', 'NEW',         'Mới',                 'Nhãn đánh dấu nội dung mới',                         1, TRUE),
    ('00000000-0000-0000-0005-000000000011', 'DISPLAY_LABEL', 'FEATURED',    'Nổi bật',             'Nhãn đánh dấu nội dung nổi bật',                     2, TRUE),
    ('00000000-0000-0000-0005-000000000012', 'DISPLAY_LABEL', 'RECOMMENDED', 'Đề xuất',             'Nhãn đề xuất cho người học',                         3, TRUE)
ON CONFLICT (type, code) DO NOTHING;
