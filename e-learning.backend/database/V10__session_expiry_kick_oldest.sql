-- ============================================================
-- V10: Enforce refresh token expiry on user_session
--      + Switch default concurrent session policy to KICK_OLDEST
-- ============================================================

-- 1. Add expires_at column to user_session
ALTER TABLE user_session
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Backfill: set expires_at for ALL existing rows (1 day from now to force re-login)
UPDATE user_session
SET expires_at = NOW() + INTERVAL '1 day'
WHERE expires_at IS NULL;

-- 3. Make expires_at NOT NULL going forward
ALTER TABLE user_session
    ALTER COLUMN expires_at SET NOT NULL;

-- 4. Index to speed up active session lookups that filter on expires_at
CREATE INDEX IF NOT EXISTS idx_user_session_expires_at
    ON user_session(user_id, expires_at)
    WHERE status = 'ACTIVE';

-- 5. Change default login_policy to KICK_OLDEST for new school mappings
ALTER TABLE school_tenant_mapping
    ALTER COLUMN login_policy SET DEFAULT 'KICK_OLDEST';

-- 6. Update ALL existing school mappings to KICK_OLDEST
UPDATE school_tenant_mapping
SET login_policy = 'KICK_OLDEST',
    updated_at   = NOW()
WHERE is_deleted = FALSE;

-- HOW TO CHANGE max_concurrent_sessions PER SCHOOL:
-- UPDATE school_tenant_mapping
-- SET max_concurrent_sessions = <number>,
--     updated_at = NOW()
-- WHERE school_id = '<uuid>';
--
-- Or update all schools at once:
-- UPDATE school_tenant_mapping
-- SET max_concurrent_sessions = <number>,
--     updated_at = NOW()
-- WHERE is_deleted = FALSE;
