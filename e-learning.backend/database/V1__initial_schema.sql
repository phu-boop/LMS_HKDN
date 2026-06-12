-- ============================================================
-- AIG LMS - Multi-tenant PostgreSQL Schema (V5.1 - Master)
-- Features: Full RBAC, Inline Data Dictionary, Multi-tenant Isolation
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 0. ENUMS
-- ============================================================
CREATE TYPE common_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'DELETED');
CREATE TYPE account_type AS ENUM ('LMS_ADMIN', 'TENANT_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT');
CREATE TYPE node_type AS ENUM ('PROGRAM', 'GRADE', 'CLASS', 'SUBJECT', 'LESSON');
CREATE TYPE content_type AS ENUM ('VIDEO', 'PDF', 'SLIDE', 'WORD', 'URL');
CREATE TYPE publish_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE comment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DELETED');
CREATE TYPE login_policy AS ENUM ('BLOCK_NEW', 'KICK_OLDEST');

-- ============================================================
-- 1. INFRASTRUCTURE (Tenant & School)
-- ============================================================

CREATE TABLE tenant (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary Key
    code               VARCHAR(50)   NOT NULL UNIQUE,         -- Unique, short internal identifier (e.g., 'STEM', 'KNS')
    name               VARCHAR(255)  NOT NULL,                -- Full display name of the tenant
    subdomain          VARCHAR(255)  NOT NULL UNIQUE,         -- The URL prefix used for routing and branding (e.g., 'stem.domain.com')
    logo_url           TEXT,                                  -- URL to the tenant's primary logo
    avatar_url         TEXT,                                  -- URL to the tenant's small avatar/icon
    description        TEXT,                                  -- Detailed text explaining the tenant's purpose
    watermark_settings JSONB,                                 -- JSON config rules for dynamic video/pdf watermarks (template, opacity)
    status             common_status NOT NULL DEFAULT 'ACTIVE', -- Current operational state

    -- STANDARD AUDIT COLUMNS
    is_deleted         BOOLEAN       NOT NULL DEFAULT FALSE,  -- Soft delete flag (TRUE = hidden from app, kept for history)
    created_by         UUID,                                  -- FK to user_account who created this record
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),  -- Exact timestamp of creation
    updated_by         UUID,                                  -- FK to user_account who last modified this record
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()   -- Exact timestamp of last modification
);

CREATE TABLE school (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code             VARCHAR(50)   NOT NULL UNIQUE,         -- Unique internal identifier for the school
    name             VARCHAR(255)  NOT NULL,                -- Full official name of the school
    tax_id           VARCHAR(50),                           -- Business registration or tax identification number
    province_code    VARCHAR(50),                           -- State/Province code linked to geographic master data
    district_code    VARCHAR(50),                           -- City/District code linked to geographic master data
    address          TEXT,                                  -- Detailed physical street address
    contact_name     VARCHAR(255),                          -- Primary point of contact (POC) for administrative issues
    contact_email    VARCHAR(255),                          -- Email address of the primary contact
    contact_phone    VARCHAR(20),                           -- Phone number of the primary contact
    status           common_status NOT NULL DEFAULT 'ACTIVE',

    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by       UUID,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by       UUID,
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. RBAC & IDENTITY
-- ============================================================

CREATE TABLE role (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(50)   NOT NULL UNIQUE,         -- Unique system string used in code (e.g., 'CONTENT_VIEWER')
    name         VARCHAR(100)  NOT NULL,                -- Human-readable name of the role
    description  TEXT,                                  -- Detailed explanation of what the role allows

    is_deleted   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by   UUID,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by   UUID,
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE permission (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(100)  NOT NULL UNIQUE,         -- Unique atomic system string (e.g., 'CONTENT_CREATE')
    module       VARCHAR(50)   NOT NULL,                -- Logical grouping of the permission (e.g., 'CONTENT', 'USERS')
    description  TEXT,                                  -- Detailed explanation of the atomic action
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permission (
    role_id       UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,       -- The role being granted permissions
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE, -- The permission granted to the role
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_account (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(150)  NOT NULL UNIQUE,          -- Unique login identifier
    email           VARCHAR(255)  UNIQUE,                   -- Unique email address
    phone           VARCHAR(20),                            -- Contact phone number
    password_hash   TEXT          NOT NULL,                 -- Encrypted password string (e.g., bcrypt)
    full_name       VARCHAR(255)  NOT NULL,                 -- User's full display name
    avatar_url      TEXT,                                   -- URL to the user's profile picture
    account_type    account_type  NOT NULL,                 -- Global identity category (e.g., TEACHER). Does not dictate permissions.
    home_school_id  UUID          REFERENCES school(id) ON DELETE SET NULL, -- Primary school this user belongs to
    failed_attempts INT           NOT NULL DEFAULT 0,       -- Counter for consecutive incorrect password entries
    locked_until    TIMESTAMPTZ,                            -- Timestamp indicating when a temporarily locked account can try again
    status          common_status NOT NULL DEFAULT 'ACTIVE',

    is_deleted      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by      UUID,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by      UUID,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Foreign Keys for Audit Columns
ALTER TABLE tenant ADD CONSTRAINT fk_tenant_cb FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE tenant ADD CONSTRAINT fk_tenant_ub FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE school ADD CONSTRAINT fk_school_cb FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE school ADD CONSTRAINT fk_school_ub FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE role ADD CONSTRAINT fk_role_cb FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE role ADD CONSTRAINT fk_role_ub FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE user_account ADD CONSTRAINT fk_user_cb FOREIGN KEY (created_by) REFERENCES user_account(id) ON DELETE SET NULL;
ALTER TABLE user_account ADD CONSTRAINT fk_user_ub FOREIGN KEY (updated_by) REFERENCES user_account(id) ON DELETE SET NULL;

-- ============================================================
-- 3. MAPPINGS
-- ============================================================

CREATE TABLE school_tenant_mapping (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID         NOT NULL REFERENCES tenant(id) ON DELETE CASCADE, -- The domain being accessed
    school_id               UUID         NOT NULL REFERENCES school(id) ON DELETE CASCADE, -- The school accessing the domain
    contract_start          DATE         NOT NULL,                                         -- Subscription validity start date
    contract_end            DATE         NOT NULL,                                         -- Subscription validity end date
    max_concurrent_sessions INT          NOT NULL DEFAULT 1,                               -- Max simultaneous logins allowed for this school
    login_policy            login_policy NOT NULL DEFAULT 'BLOCK_NEW',                     -- Rule when limit reached (BLOCK_NEW vs KICK_OLDEST)
    enforce_expiry          BOOLEAN      NOT NULL DEFAULT TRUE,                            -- If TRUE, strictly denies access past contract_end
    status                  common_status NOT NULL DEFAULT 'ACTIVE',
    UNIQUE(tenant_id, school_id),

    is_deleted              BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by              UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by              UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE user_tenant_role_assignment (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          NOT NULL REFERENCES user_account(id) ON DELETE CASCADE, -- The user being granted a role
    tenant_id  UUID          NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,       -- The tenant context for this role
    role_id    UUID          NOT NULL REFERENCES role(id) ON DELETE CASCADE,         -- The specific role granted
    UNIQUE(user_id, tenant_id, role_id),

    is_deleted BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CONTENT & CURRICULUM
-- ============================================================

CREATE TABLE curriculum_node (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID          NOT NULL REFERENCES tenant(id) ON DELETE CASCADE, -- Tenant this node belongs to
    parent_id   UUID          REFERENCES curriculum_node(id) ON DELETE CASCADE, -- Self-referencing FK for tree hierarchy
    node_type   node_type     NOT NULL,                                         -- Level of hierarchy (PROGRAM, GRADE, CLASS, SUBJECT, LESSON)
    code        VARCHAR(50),                                                    -- Optional tracking code for the node
    title       VARCHAR(255)  NOT NULL,                                         -- Display name of the folder/node
    sort_order  INT           NOT NULL DEFAULT 0,                               -- Integer for sorting nodes sequentially in UI
    status      common_status NOT NULL DEFAULT 'ACTIVE',

    UNIQUE NULLS NOT DISTINCT (tenant_id, parent_id, title),                    -- Prevents duplicate folder names under the same parent

    is_deleted  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by  UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by  UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE content_item (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID          NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,         -- Tenant owning this asset (for Row-Level Security)
    curriculum_node_id UUID          NOT NULL REFERENCES curriculum_node(id) ON DELETE CASCADE, -- The lesson/node this material is attached to
    type               content_type  NOT NULL,                                                 -- Media format (VIDEO, PDF, SLIDE, WORD, URL)
    title              VARCHAR(255)  NOT NULL,                                                 -- Display title of the asset
    description        TEXT,                                                                   -- Detailed description

    file_name          VARCHAR(255),                                                           -- Original uploaded filename
    file_path          TEXT,                                                                   -- Storage path (e.g., AWS S3 key)
    hls_url            TEXT,                                                                   -- Encrypted HTTP Live Streaming URL for video DRM
    source_url         TEXT,                                                                   -- External link if type is URL
    thumbnail_url      TEXT,                                                                   -- URL to a preview image (e.g., video cover)
    mime_type          VARCHAR(100),                                                           -- Standard file identifier (e.g., 'application/pdf')
    file_size_bytes    BIGINT,                                                                 -- Exact file size in bytes

    publish_status     publish_status NOT NULL DEFAULT 'DRAFT',                                -- Lifecycle state (DRAFT, PUBLISHED, ARCHIVED)
    visibility_from    TIMESTAMPTZ,                                                            -- Start time for automated content scheduling
    visibility_to      TIMESTAMPTZ,                                                            -- End time for automated content scheduling
    is_downloadable    BOOLEAN       NOT NULL DEFAULT FALSE,                                   -- Flag allowing users to download the raw source file
    watermark_enabled  BOOLEAN       NOT NULL DEFAULT TRUE,                                    -- Flag enforcing dynamic user-data watermark overlay
    signed_url_ttl     INT           DEFAULT 3600,                                             -- Time-to-live in seconds for securely generated access links

    is_deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by         UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by         UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. CLIENT INTERACTIONS
-- ============================================================

CREATE TABLE user_favorite_content (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID          NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,  -- User who saved the content
    content_item_id    UUID          NOT NULL REFERENCES content_item(id) ON DELETE CASCADE,  -- The saved content
    UNIQUE(user_id, content_item_id),

    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE content_comment (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id    UUID          NOT NULL REFERENCES content_item(id) ON DELETE CASCADE,  -- The content being commented on
    user_id            UUID          NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,  -- Author of the comment
    parent_id          UUID          REFERENCES content_comment(id) ON DELETE CASCADE,        -- Self-referencing FK to support nested replies
    body               TEXT          NOT NULL,                                                -- Actual text of the comment
    status             comment_status NOT NULL DEFAULT 'APPROVED',                            -- Moderation state
    is_public          BOOLEAN       NOT NULL DEFAULT FALSE,                                 -- Public comments are visible to everyone
    is_admin           BOOLEAN       NOT NULL DEFAULT FALSE,                                 -- Comment created by an admin
    is_edited          BOOLEAN       NOT NULL DEFAULT FALSE,                                 -- Comment has been edited after creation
    is_pinned          BOOLEAN       NOT NULL DEFAULT FALSE,                                 -- Comment pinned to the top of the list
    school_id          UUID          REFERENCES school(id) ON DELETE SET NULL,              -- School of the comment author

    is_deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by         UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. PERMISSIONS & OPERATIONS
-- ============================================================

CREATE TABLE content_permission (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID          NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,          -- The tenant boundary
    school_id          UUID          REFERENCES school(id) ON DELETE CASCADE,                   -- The grantee (if granting to an entire school)
    user_id            UUID          REFERENCES user_account(id) ON DELETE CASCADE,             -- The grantee (if granting to a specific user)
    curriculum_node_id UUID          NOT NULL REFERENCES curriculum_node(id) ON DELETE CASCADE, -- The branch being granted access to

    can_view           BOOLEAN       NOT NULL DEFAULT TRUE,                                     -- Grant view rights to node and its children
    can_download       BOOLEAN       NOT NULL DEFAULT FALSE,                                    -- Grant download rights to node and its children
    can_comment        BOOLEAN       NOT NULL DEFAULT TRUE,                                     -- Grant comment rights to node and its children

    -- Constraint: Must grant to exactly ONE entity (either a school OR a user)
    CONSTRAINT chk_grantee CHECK ((school_id IS NOT NULL AND user_id IS NULL) OR (school_id IS NULL AND user_id IS NOT NULL)),

    is_deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_by         UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by         UUID          REFERENCES user_account(id) ON DELETE SET NULL,
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE user_session (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES user_account(id) ON DELETE CASCADE, -- User logged in
    tenant_id          UUID        NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,       -- Tenant they logged into
    session_token_hash TEXT        NOT NULL UNIQUE,                                        -- Securely hashed version of the active session ID
    ip_address         VARCHAR(64),                                                        -- Network footprint
    user_agent         TEXT,                                                               -- Device/Browser footprint
    last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),                                 -- Heartbeat timestamp updated upon interaction
    is_active          BOOLEAN     NOT NULL DEFAULT TRUE,                                  -- Flag determining if session is valid or revoked

    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    tenant_id   UUID         REFERENCES tenant(id) ON DELETE SET NULL,         -- Context tenant
    school_id   UUID         REFERENCES school(id) ON DELETE SET NULL,         -- Context school
    user_id     UUID         REFERENCES user_account(id) ON DELETE SET NULL,   -- User who performed the action
    action      VARCHAR(100) NOT NULL,                                         -- Event triggered (e.g., 'USER_LOGIN', 'PDF_DOWNLOAD')
    entity_type VARCHAR(100),                                                  -- Category of impacted record (e.g., 'CONTENT', 'USER')
    entity_id   UUID,                                                          -- Exact ID of impacted record
    metadata    JSONB,                                                         -- Flexible JSON payload for contextual data

    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. HIGH-PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_tenant_subdomain ON tenant(subdomain) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_username ON user_account(username) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_email ON user_account(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_tenant_role_assignment ON user_tenant_role_assignment(user_id, tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_school_tenant_mapping ON school_tenant_mapping(tenant_id, school_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_curriculum_tree ON curriculum_node(tenant_id, parent_id, sort_order) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_item_type ON content_item(curriculum_node_id, type) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_item_publish ON content_item(tenant_id, publish_status) WHERE is_deleted = FALSE;
CREATE INDEX idx_user_favorite ON user_favorite_content(user_id, created_at);
CREATE INDEX idx_content_comment ON content_comment(content_item_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_comment_visibility ON content_comment(content_item_id, status, is_public) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_comment_school_id ON content_comment(content_item_id, school_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_content_permission_lookup ON content_permission(tenant_id, school_id, user_id, curriculum_node_id) WHERE is_deleted = FALSE;

CREATE UNIQUE INDEX uq_permission_user ON content_permission (tenant_id, curriculum_node_id, user_id) WHERE user_id IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX uq_permission_school ON content_permission (tenant_id, curriculum_node_id, school_id) WHERE school_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX idx_active_sessions ON user_session(user_id, tenant_id) WHERE is_active = TRUE;
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_composite ON audit_log(tenant_id, school_id, action, created_at);
