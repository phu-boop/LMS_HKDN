-- ============================================================
-- V8: Make curriculum_node.node_type free text (remove enum lock)
-- ============================================================

ALTER TABLE curriculum_node
    ALTER COLUMN node_type TYPE VARCHAR(100)
    USING node_type::TEXT;

ALTER TABLE curriculum_node
    DROP CONSTRAINT IF EXISTS ck_curriculum_node_node_type_not_blank;

ALTER TABLE curriculum_node
    ADD CONSTRAINT ck_curriculum_node_node_type_not_blank
    CHECK (LENGTH(BTRIM(node_type)) > 0);

DROP TYPE IF EXISTS node_type;
