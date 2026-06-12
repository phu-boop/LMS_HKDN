CREATE TABLE IF NOT EXISTS user_content_progress (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID          NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    user_id         UUID          NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    content_item_id UUID          NOT NULL REFERENCES content_item(id) ON DELETE CASCADE,
    progress_value  BIGINT        NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
    progress_total  BIGINT        NOT NULL DEFAULT 0 CHECK (progress_total >= 0),

    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by      UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by      UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_content_progress_active
    ON user_content_progress (tenant_id, user_id, content_item_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_content_progress_user_recent
    ON user_content_progress (tenant_id, user_id, updated_at DESC)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_content_progress_content
    ON user_content_progress (tenant_id, content_item_id)
    WHERE is_deleted = FALSE;
