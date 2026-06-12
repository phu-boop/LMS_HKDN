-- ============================================================
-- V3: Remove STUDENT account type, add is_inherited tracking
-- ============================================================

-- 1. Remove STUDENT from account_type enum
--    PostgreSQL does not support DROP VALUE, so we rename + recreate.
--    Ensure no existing rows have account_type = 'STUDENT' before running.
ALTER TYPE account_type RENAME TO account_type_old;

CREATE TYPE account_type AS ENUM ('LMS_ADMIN', 'TENANT_ADMIN', 'SCHOOL_ADMIN', 'TEACHER');

ALTER TABLE user_account
    ALTER COLUMN account_type TYPE account_type
    USING account_type::TEXT::account_type;

DROP TYPE account_type_old;

-- 2. Add is_inherited flag to user_tenant_role_assignment
--    TRUE  = auto-assigned when user was created (inherited from school contract)
--    FALSE = manually assigned by admin
ALTER TABLE user_tenant_role_assignment
    ADD COLUMN IF NOT EXISTS is_inherited BOOLEAN NOT NULL DEFAULT FALSE;
