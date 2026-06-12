-- ============================================================
-- V7: Rebuild user_session table to match application design
--     + add last_login_at to user_account
-- ============================================================

-- 1. Add last_login_at to user_account
ALTER TABLE user_account
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Create session_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
    END IF;
END$$;

-- 3. Drop old simplified user_session table
DROP TABLE IF EXISTS user_session CASCADE;

-- 4. Recreate user_session with full design expected by application
CREATE TABLE user_session (
    id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID           NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    tenant_id            UUID           NOT NULL REFERENCES tenant(id)       ON DELETE CASCADE,
    school_id            UUID           REFERENCES school(id)                ON DELETE SET NULL,
    refresh_token_hash   TEXT           NOT NULL UNIQUE,
    device_fingerprint   VARCHAR(256),
    user_agent           TEXT,
    ip_address           VARCHAR(64),
    started_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    last_seen_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    ended_at             TIMESTAMPTZ,
    status               session_status NOT NULL DEFAULT 'ACTIVE',
    metadata             JSONB          NOT NULL DEFAULT '{}'::jsonb,

    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX idx_user_session_user_id   ON user_session(user_id)             WHERE status = 'ACTIVE';
CREATE INDEX idx_user_session_tenant_id ON user_session(user_id, tenant_id)  WHERE status = 'ACTIVE';
CREATE INDEX idx_user_session_school_id ON user_session(user_id, school_id)  WHERE status = 'ACTIVE';
