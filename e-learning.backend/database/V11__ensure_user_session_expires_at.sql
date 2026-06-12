-- ============================================================
-- V11: Ensure user_session.expires_at exists for token expiry checks
--      (safe for environments that missed earlier migration)
-- ============================================================

-- 1. Add expires_at column when missing
ALTER TABLE user_session
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Backfill for pre-existing rows
UPDATE user_session
SET expires_at = COALESCE(last_seen_at, started_at, NOW()) + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- 3. Enforce NOT NULL after backfill
ALTER TABLE user_session
    ALTER COLUMN expires_at SET NOT NULL;

-- 4. Ensure index exists for active session lookups
CREATE INDEX IF NOT EXISTS idx_user_session_expires_at
    ON user_session(user_id, expires_at)
    WHERE status = 'ACTIVE';