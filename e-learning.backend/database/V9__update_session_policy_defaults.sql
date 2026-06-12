-- ============================================================
-- V9: Increase concurrent session limit and switch policy to KICK_OLDEST
-- ============================================================

-- Update table defaults for newly created school-tenant mappings
ALTER TABLE school_tenant_mapping
    ALTER COLUMN max_concurrent_sessions SET DEFAULT 50,
    ALTER COLUMN login_policy SET DEFAULT 'KICK_OLDEST';

-- Update existing mappings to apply new policy immediately
UPDATE school_tenant_mapping
SET max_concurrent_sessions = 50,
    login_policy = 'KICK_OLDEST',
    updated_at = NOW()
WHERE is_deleted = FALSE;
