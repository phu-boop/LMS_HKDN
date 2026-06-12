-- ============================================================
-- V4: Add contract date columns to school table
-- Required by Task 2.3 — Quản lý Trường học
-- ============================================================

ALTER TABLE school
    ADD COLUMN IF NOT EXISTS contract_start_date DATE,
    ADD COLUMN IF NOT EXISTS contract_end_date   DATE;

COMMENT ON COLUMN school.contract_start_date IS 'Start date of the school service contract';
COMMENT ON COLUMN school.contract_end_date   IS 'Expiry date of the school service contract';
