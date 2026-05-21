-- Common Enums (assuming these exist or creating them if missing, but schema relies on them)
DO $$ BEGIN
    CREATE TYPE common_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('LMS_ADMIN', 'TENANT_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'CONTENT_CREATOR', 'CONTENT_REVIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE login_policy AS ENUM ('BLOCK_NEW', 'LOGOUT_OLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('VIDEO', 'DOCUMENT', 'QUIZ');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE publish_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE comment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Schema provided by user

create table if not exists school
(
    id                  uuid                     default gen_random_uuid()       not null
        primary key,
    code                varchar(50)                                              not null
        unique,
    name                varchar(255)                                             not null,
    tax_id              varchar(50),
    province_code       varchar(20),
    district_code       varchar(20),
    address             text,
    contact_name        varchar(255),
    contact_email       varchar(255),
    contact_phone       varchar(20),
    status              common_status            default 'ACTIVE'::common_status not null,
    is_deleted          boolean                  default false                   not null,
    created_by          uuid,
    created_at          timestamp with time zone default now()                   not null,
    updated_by          uuid,
    updated_at          timestamp with time zone default now()                   not null,
    contract_start_date date,
    contract_end_date   date
);

comment on column school.contract_start_date is 'Start date of the school service contract';
comment on column school.contract_end_date is 'Expiry date of the school service contract';

create table if not exists permission
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    code        varchar(100)                                       not null
        unique,
    module      varchar(50)                                        not null,
    description text,
    created_at  timestamp with time zone default now()             not null
);

create table if not exists user_account
(
    id              uuid                     default gen_random_uuid()       not null
        primary key,
    username        varchar(150)                                             not null
        unique,
    email           varchar(255)
        unique,
    phone           varchar(20),
    password_hash   text                                                     not null,
    full_name       varchar(255)                                             not null,
    avatar_url      text,
    account_type    account_type                                             not null,
    home_school_id  uuid
                                                                             references school
                                                                                 on delete set null,
    failed_attempts integer                  default 0                       not null,
    locked_until    timestamp with time zone,
    status          common_status            default 'ACTIVE'::common_status not null,
    is_deleted      boolean                  default false                   not null,
    created_by      uuid
        constraint fk_user_cb
            references user_account
            on delete set null,
    created_at      timestamp with time zone default now()                   not null,
    updated_by      uuid
        constraint fk_user_ub
            references user_account
            on delete set null,
    updated_at      timestamp with time zone default now()                   not null,
    last_login_at   timestamp with time zone
);

create table if not exists tenant
(
    id                 uuid                     default gen_random_uuid()       not null
        primary key,
    code               varchar(50)                                              not null
        unique,
    name               varchar(255)                                             not null,
    subdomain          varchar(255)                                             not null
        unique,
    logo_url           text,
    avatar_url         text,
    description        text,
    watermark_settings jsonb,
    status             common_status            default 'ACTIVE'::common_status not null,
    is_deleted         boolean                  default false                   not null,
    created_by         uuid
        constraint fk_tenant_cb
            references user_account
            on delete set null,
    created_at         timestamp with time zone default now()                   not null,
    updated_by         uuid
        constraint fk_tenant_ub
            references user_account
            on delete set null,
    updated_at         timestamp with time zone default now()                   not null
);

create index if not exists idx_tenant_subdomain on tenant (subdomain) where (is_deleted = false);

-- Add circular references if tables were created out of order
DO $$ BEGIN
    ALTER TABLE school ADD CONSTRAINT fk_school_cb FOREIGN KEY (created_by) REFERENCES user_account on delete set null;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE school ADD CONSTRAINT fk_school_ub FOREIGN KEY (updated_by) REFERENCES user_account on delete set null;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists role
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    code        varchar(50)                                        not null
        unique,
    name        varchar(100)                                       not null,
    description text,
    is_deleted  boolean                  default false             not null,
    created_by  uuid
        constraint fk_role_cb
            references user_account
            on delete set null,
    created_at  timestamp with time zone default now()             not null,
    updated_by  uuid
        constraint fk_role_ub
            references user_account
            on delete set null,
    updated_at  timestamp with time zone default now()             not null
);

create table if not exists role_permission
(
    role_id       uuid not null references role on delete cascade,
    permission_id uuid not null references permission on delete cascade,
    primary key (role_id, permission_id)
);

create index if not exists idx_user_username on user_account (username) where (is_deleted = false);
create index if not exists idx_user_email on user_account (email) where (is_deleted = false);

create table if not exists school_tenant_mapping
(
    id                      uuid                     default gen_random_uuid()         not null
        primary key,
    tenant_id               uuid                                                       not null
        references tenant on delete cascade,
    school_id               uuid                                                       not null
        references school on delete cascade,
    contract_start          date                                                       not null,
    contract_end            date                                                       not null,
    max_concurrent_sessions integer                  default 1                         not null,
    login_policy            login_policy             default 'BLOCK_NEW'::login_policy not null,
    enforce_expiry          boolean                  default true                      not null,
    status                  common_status            default 'ACTIVE'::common_status   not null,
    is_deleted              boolean                  default false                     not null,
    created_by              uuid references user_account on delete set null,
    created_at              timestamp with time zone default now()                     not null,
    updated_by              uuid references user_account on delete set null,
    updated_at              timestamp with time zone default now()                     not null,
    unique (tenant_id, school_id)
);

create index if not exists idx_school_tenant_mapping on school_tenant_mapping (tenant_id, school_id, status) where (is_deleted = false);

create table if not exists user_tenant_role_assignment
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    user_id      uuid                                               not null
        references user_account on delete cascade,
    tenant_id    uuid                                               not null
        references tenant on delete cascade,
    role_id      uuid                                               not null
        references role on delete cascade,
    is_deleted   boolean                  default false             not null,
    created_by   uuid references user_account on delete set null,
    created_at   timestamp with time zone default now()             not null,
    updated_by   uuid references user_account on delete set null,
    updated_at   timestamp with time zone default now()             not null,
    is_inherited boolean                  default false             not null,
    unique (user_id, tenant_id, role_id)
);

create index if not exists idx_user_tenant_role_assignment on user_tenant_role_assignment (user_id, tenant_id) where (is_deleted = false);

create table if not exists curriculum_node
(
    id         uuid                     default gen_random_uuid()       not null
        primary key,
    tenant_id  uuid                                                     not null
        references tenant on delete cascade,
    parent_id  uuid
        references curriculum_node on delete cascade,
    node_type  varchar(100)                                             not null
        constraint ck_curriculum_node_node_type_not_blank
            check (length(btrim((node_type)::text)) > 0),
    code       varchar(50),
    title      varchar(255)                                             not null,
    sort_order integer                  default 0                       not null,
    status     common_status            default 'ACTIVE'::common_status not null,
    is_deleted boolean                  default false                   not null,
    created_by uuid references user_account on delete set null,
    created_at timestamp with time zone default now()                   not null,
    updated_by uuid references user_account on delete set null,
    updated_at timestamp with time zone default now()                   not null,
    unique nulls not distinct (tenant_id, parent_id, title)
);

create index if not exists idx_curriculum_tree on curriculum_node (tenant_id, parent_id, sort_order) where (is_deleted = false);

create table if not exists content_item
(
    id                 uuid                     default gen_random_uuid()       not null
        primary key,
    tenant_id          uuid                                                     not null
        references tenant on delete cascade,
    curriculum_node_id uuid                                                     not null
        references curriculum_node on delete cascade,
    type               content_type                                             not null,
    title              varchar(255)                                             not null,
    description        text,
    file_name          varchar(255),
    file_path          text,
    hls_url            text,
    source_url         text,
    thumbnail_url      text,
    mime_type          varchar(100),
    file_size_bytes    bigint,
    publish_status     publish_status           default 'DRAFT'::publish_status not null,
    visibility_from    timestamp with time zone,
    visibility_to      timestamp with time zone,
    is_downloadable    boolean                  default false                   not null,
    watermark_enabled  boolean                  default true                    not null,
    signed_url_ttl     integer                  default 3600,
    is_deleted         boolean                  default false                   not null,
    created_by         uuid references user_account on delete set null,
    created_at         timestamp with time zone default now()                   not null,
    updated_by         uuid references user_account on delete set null,
    updated_at         timestamp with time zone default now()                   not null
);

create index if not exists idx_content_item_type on content_item (curriculum_node_id, type) where (is_deleted = false);
create index if not exists idx_content_item_publish on content_item (tenant_id, publish_status) where (is_deleted = false);

create table if not exists user_favorite_content
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    user_id         uuid                                               not null
        references user_account on delete cascade,
    content_item_id uuid                                               not null
        references content_item on delete cascade,
    created_at      timestamp with time zone default now()             not null,
    unique (user_id, content_item_id)
);

create index if not exists idx_user_favorite on user_favorite_content (user_id, created_at);

create table if not exists content_comment
(
    id              uuid                     default gen_random_uuid()          not null
        primary key,
    content_item_id uuid                                                        not null
        references content_item on delete cascade,
    user_id         uuid                                                        not null
        references user_account on delete cascade,
    parent_id       uuid
        references content_comment on delete cascade,
    body            text                                                        not null,
    status          comment_status           default 'APPROVED'::comment_status not null,
    is_deleted      boolean                  default false                      not null,
    created_at      timestamp with time zone default now()                      not null,
    updated_by      uuid references user_account on delete set null,
    updated_at      timestamp with time zone default now()                      not null
);

create index if not exists idx_content_comment on content_comment (content_item_id, status) where (is_deleted = false);

create table if not exists content_permission
(
    id                 uuid                     default gen_random_uuid() not null
        primary key,
    tenant_id          uuid                                               not null
        references tenant on delete cascade,
    school_id          uuid
        references school on delete cascade,
    user_id            uuid
        references user_account on delete cascade,
    curriculum_node_id uuid                                               not null
        references curriculum_node on delete cascade,
    can_view           boolean                  default true              not null,
    can_download       boolean                  default false             not null,
    can_comment        boolean                  default true              not null,
    is_deleted         boolean                  default false             not null,
    created_by         uuid references user_account on delete set null,
    created_at         timestamp with time zone default now()             not null,
    updated_by         uuid references user_account on delete set null,
    updated_at         timestamp with time zone default now()             not null,
    constraint chk_grantee check (((school_id IS NOT NULL) AND (user_id IS NULL)) OR ((school_id IS NULL) AND (user_id IS NOT NULL)))
);

create index if not exists idx_content_permission_lookup on content_permission (tenant_id, school_id, user_id, curriculum_node_id) where (is_deleted = false);
create unique index if not exists uq_permission_user on content_permission (tenant_id, curriculum_node_id, user_id) where ((user_id IS NOT NULL) AND (is_deleted = false));
create unique index if not exists uq_permission_school on content_permission (tenant_id, curriculum_node_id, school_id) where ((school_id IS NOT NULL) AND (is_deleted = false));

create table if not exists audit_log
(
    id          bigserial primary key,
    tenant_id   uuid references tenant on delete set null,
    school_id   uuid references school on delete set null,
    user_id     uuid references user_account on delete set null,
    action      varchar(100)                           not null,
    entity_type varchar(100),
    entity_id   uuid,
    metadata    jsonb,
    created_at  timestamp with time zone default now() not null
);

create index if not exists idx_audit_log_created_at on audit_log (created_at);
create index if not exists idx_audit_log_composite on audit_log (tenant_id, school_id, action, created_at);

create table if not exists schema_migrations
(
    filename   varchar(255)                           not null
        primary key,
    applied_at timestamp with time zone default now() not null
);

create table if not exists catalog_item
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    type        varchar(50)                                        not null,
    code        varchar(100)                                       not null,
    name        varchar(255)                                       not null,
    description text,
    sort_order  integer                  default 0                 not null,
    is_system   boolean                  default false             not null,
    is_active   boolean                  default true              not null,
    is_deleted  boolean                  default false             not null,
    created_at  timestamp with time zone default now()             not null,
    updated_at  timestamp with time zone default now()             not null,
    constraint uq_catalog_type_code unique (type, code)
);

create index if not exists idx_catalog_item_type on catalog_item (type) where (is_deleted = false);

create table if not exists user_session
(
    id                 uuid                     default gen_random_uuid()        not null
        primary key,
    user_id            uuid                                                      not null
        references user_account on delete cascade,
    tenant_id          uuid                                                      not null
        references tenant on delete cascade,
    school_id          uuid references school on delete set null,
    refresh_token_hash text                                                      not null
        unique,
    device_fingerprint varchar(256),
    user_agent         text,
    ip_address         varchar(64),
    started_at         timestamp with time zone default now()                    not null,
    last_seen_at       timestamp with time zone default now()                    not null,
    ended_at           timestamp with time zone,
    status             session_status           default 'ACTIVE'::session_status not null,
    metadata           jsonb                    default '{}'::jsonb              not null,
    created_at         timestamp with time zone default now()                    not null,
    updated_at         timestamp with time zone default now()                    not null,
    expires_at         timestamp with time zone                                  not null
);

create index if not exists idx_user_session_user_id on user_session (user_id) where (status = 'ACTIVE'::session_status);
create index if not exists idx_user_session_tenant_id on user_session (user_id, tenant_id) where (status = 'ACTIVE'::session_status);
create index if not exists idx_user_session_school_id on user_session (user_id, school_id) where (status = 'ACTIVE'::session_status);
create index if not exists idx_user_session_expires_at on user_session (user_id, expires_at) where (status = 'ACTIVE'::session_status);
