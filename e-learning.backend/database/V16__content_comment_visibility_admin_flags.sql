ALTER TABLE content_comment
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN school_id UUID REFERENCES school(id) ON DELETE SET NULL;

CREATE INDEX idx_content_comment_visibility ON content_comment(content_item_id, status, is_public) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_comment_school_id ON content_comment(content_item_id, school_id) WHERE is_deleted = FALSE;
