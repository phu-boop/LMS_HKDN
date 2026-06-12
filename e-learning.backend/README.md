# e-learning.backend

AIG LMS — Multi-tenant e-learning backend. Shared infrastructure, data isolated per tenant (Tenant/Domain).

## Tech Stack

- **.NET 10** — Minimal API
- **PostgreSQL 16** — Shared database, tenant isolated via `tenant_id` columns + custom ENUM types
- **Dapper** — Lightweight query execution (no EF Core ORM)
- **Docker** — Local PostgreSQL via docker-compose
- **JWT (HS256)** — Authentication with `tenant_id`, `school_id`, `role` claims
- **BCrypt** — Password hashing
- **IMemoryCache** — Permission caching (5 min), tenant resolution caching (10 min)

---

## Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/)

---

### 1. Khởi động Database

```bash
# Start PostgreSQL container (port 5433)
docker compose -f deploy/docker/docker-compose.yml --env-file deploy/docker/.env up -d

# Kiểm tra container đã healthy
docker ps --filter name=lms-postgres
```

`.env` đã có sẵn tại `deploy/docker/.env`:
```
POSTGRES_USER=lms_dev
POSTGRES_PASSWORD=lms_dev
POSTGRES_DB=lms_dev
POSTGRES_PORT=5433
```

---

### 2. Khởi tạo Schema & Seed Data

```bash
# Schema (ENUMs, tables, indexes)
cat database/V1__initial_schema.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Dev seed (tenants, schools, roles, users, permissions, role-permissions)
cat database/V2__seed_dev.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Align tenant permissions for existing databases
cat database/V3__align_tenant_permissions.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# School contract date columns
cat database/V4__school_contract_dates.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Remove STUDENT account_type, add is_inherited to user_tenant_role_assignment
cat database/V5__remove_student_cleanup.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Catalog master data: catalog_item table, CATALOG_VIEW/CATALOG_MANAGE permissions, seed data
cat database/V6__catalog_master_data.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Update user_session schema for workspace selector/switch tenant
cat database/V7__update_user_session.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Curriculum node_type: Change from ENUM to VARCHAR(100) for flexibility
cat database/V8__curriculum_node_type_text.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev

# Content team roles: CONTENT_CREATOR, CONTENT_REVIEWER with permission mappings
cat database/V11__content_team_roles.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev
```

> **Note:** On `deploy/scripts/deploy-dev.sh`, migrations are applied automatically via a `schema_migrations` tracking table — no need to run them manually on the server.

**Dev users (password: `Admin@123`):**
| Username | Role | Scope |
|---|---|---|
| `superadmin` | LMS_ADMIN | PLATFORM tenant |
| `stem_admin` | TENANT_ADMIN | STEM tenant |
| `teacher01` | TEACHER | SCHOOL (Trường Demo → STEM) |

---

### 3. Chạy API

```bash
# Development với auto-reload
dotnet watch run --project src/Api/Aig.Lms.Api

# Hoặc một lần
dotnet run --project src/Api/Aig.Lms.Api
```

| Endpoint | URL |
|---|---|
| Scalar UI (API Docs) | http://localhost:5294/scalar/ |
| OpenAPI JSON | http://localhost:5294/openapi/v1.json |
| Health check | http://localhost:5294/health |

**Nếu lỗi `address already in use` (port `5294`) trên macOS:**

```bash
# Xem process đang chiếm port 5294
lsof -nP -iTCP:5294 -sTCP:LISTEN

# Kill nhẹ (SIGTERM)
PID=$(lsof -tiTCP:5294 -sTCP:LISTEN); [ -n "$PID" ] && kill -15 $PID

# Nếu vẫn chưa giải phóng port, kill mạnh (SIGKILL)
PID=$(lsof -tiTCP:5294 -sTCP:LISTEN); [ -n "$PID" ] && kill -9 $PID
```

---

### 3.1 Deploy API lên Server bằng Docker

Tất cả lệnh đều chạy từ project root: `/home/azureuser/lms_dev/backend/e-learning.backend`

Sau khi triển khai phần Tenant/Branding và update database, quy trình redeploy cần bám theo các file trong `deploy/` hiện tại. Phần này là quy trình đang dùng cho dev server.

Scripts deploy nằm ở `deploy/scripts/`:

| Script | Chức năng |
|---|---|
| `deploy-dev.sh` | Full deploy: migrate DB, build API, cấu hình nginx, health check |
| `update-api.sh` | Lightweight update: git pull + build lại image API + health check |

---

**Biến môi trường cần có trong `deploy/docker/.env.dev`**

```bash
DB_HOST=host.docker.internal
DB_PORT=5434
DB_NAME=lms_dev
DB_USER=lms_dev
DB_PASSWORD=...
DB_CONTAINER=n8n-postgres-1

JWT_SECRET_KEY=...

CORS_ORIGIN_1=http://103.159.51.19:3000
CORS_ORIGIN_2=http://103.159.51.19:5173

TENANCY_ADMIN_SUBDOMAIN=admin
TENANCY_ADMIN_DOMAIN_1=id.daihoc.io.vn
TENANCY_ADMIN_DOMAIN_2=admin.daihoc.io.vn
TENANCY_BASE_DOMAIN_1=daihoc.io.vn
```

`DB_CONTAINER` rất quan trọng vì các script deploy chạy migration bằng `docker exec` vào container PostgreSQL.

**A. Deploy lần đầu (full setup)**

```bash
cd /home/azureuser/lms_dev/backend/e-learning.backend

# Tạo env file từ template (chỉ làm 1 lần)
cp deploy/docker/.env.dev.example deploy/docker/.env.dev
vi deploy/docker/.env.dev   # điền các giá trị thực

# Full deploy: migrate DB + build API + nginx + health check
./deploy/scripts/deploy-dev.sh all
```

**B. Re-deploy API sau khi đổi code (quy trình hàng ngày)**

```bash
cd /home/azureuser/lms_dev/backend/e-learning.backend

# Khuyến nghị: pull code + chạy migration chưa apply + rebuild + recreate API
./deploy/scripts/update-api.sh
```

Trường hợp đã `git pull` thủ công trước đó:

```bash
./deploy/scripts/update-api.sh --no-pull
```

Trường hợp cần build sạch không dùng Docker cache:

```bash
./deploy/scripts/update-api.sh --no-cache
```

Nếu cần chạy theo dạng full redeploy của stack API:

```bash
./deploy/scripts/deploy-dev.sh api
```

**C. Các tùy chọn của `update-api.sh`**

```bash
# Bỏ bước git pull (khi đã pull thủ công trước)
./deploy/scripts/update-api.sh --no-pull

# Build sạch không dùng Docker cache
./deploy/scripts/update-api.sh --no-cache

# Xem trợ giúp
./deploy/scripts/update-api.sh --help
```

**D. Chạy từng bước riêng lẻ với `deploy-dev.sh`**

```bash
./deploy/scripts/deploy-dev.sh migrate   # Chỉ chạy DB migrations
./deploy/scripts/deploy-dev.sh api       # Chỉ rebuild + redeploy API
./deploy/scripts/deploy-dev.sh nginx     # Chỉ cập nhật cấu hình nginx
./deploy/scripts/deploy-dev.sh all       # Chạy toàn bộ
```

**E. Kiểm tra trạng thái sau deploy**

```bash
docker ps --filter name=lms-api
docker inspect --format='health={{.State.Health.Status}} status={{.State.Status}}' lms-api
docker logs --tail 200 lms-api
curl -sf http://localhost:5294/health
```

Nếu migration fail, kiểm tra lại đúng `DB_CONTAINER`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` trong `deploy/docker/.env.dev`.

### 3.2 Identity System Test

Tài liệu system test:

- `tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.2.md`
- `tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.3.md`
- `tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.4.md`

---

### 4. Authentication — Lấy JWT Token

**Identify để lấy white-label branding theo domain trước bước nhập password:**

```bash
curl -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "content_admin", "domain": "stem.daihoc.io.vn"}'
```

**Login không qua subdomain** (platform-level, token không có `tenant_id`):
```bash
curl -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "content_admin", "password": "Admin@123"}'
```

**Login qua subdomain** (token có `tenant_id` claim):
```bash
# Cần host tenant thực resolve về 127.0.0.1 hoặc đi qua nginx giữ nguyên Host header
curl -X POST http://stem.daihoc.io.vn:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "content_admin", "password": "Admin@123"}'
```

### 4.1 Tenant Domain Cho Local Và Dev Server

- Local: có thể map `/etc/hosts` (`127.0.0.1 stem.daihoc.io.vn`) để gửi đúng Host header.
- Dev server (`https://dev-api.daihoc.io.vn`): không sửa hosts trên máy chủ API. Hãy truyền tenant domain qua query `?domain=...` cho các endpoint client cần tenant context.

Ví dụ gọi trên dev server:

```bash
AT=$(curl -sS -X POST 'https://dev-api.daihoc.io.vn/api/identity/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq -r '.accessToken')

curl -sS 'https://dev-api.daihoc.io.vn/client/contents/{contentId}/view-url?domain=stem.daihoc.io.vn' \
  -H "Authorization: Bearer $AT"
```

### 4.2 Debug Document Viewer (PDF/Slide/Word)

Khi kiểm tra endpoint `view-url`, lưu ý:

- Header `Content-Type` bạn gửi vào request API (`-H 'content-type: application/pdf'`) không quyết định MIME của file trả về từ object storage.
- MIME hiển thị trong browser được quyết định bởi query params đã được ký trong signed URL: `response-content-type` và `response-content-disposition`.

Lệnh kiểm tra nhanh:

```bash
SIGNED=$(curl -sS 'https://dev-api.daihoc.io.vn/client/contents/{contentId}/view-url?domain=stem.daihoc.io.vn' \
  -H "Authorization: Bearer $AT" | jq -r '.url')

echo "$SIGNED" | sed 's/&/\n&/g' | grep -E 'response-content-type|response-content-disposition'
curl -sS -D - -o /dev/null "$SIGNED" | grep -Ei '^(HTTP/|content-type:|content-disposition:)'
```

JWT payload khi login qua subdomain:
```json
{
  "sub": "<userId>",
  "school_id": "<schoolId>",
  "tenant_id": "aaaaaaaa-0000-0000-0000-000000000001",
  "role": "TENANT_ADMIN"
}
```

---

### 5. Local Subdomain Development

Middleware resolve tenant theo `Host` header hoặc query `domain`. Hiện tại cấu hình Tenancy dùng `daihoc.io.vn` làm base domain, nên local testing cần dùng chính domain pattern này hoặc truyền `domain` qua query/body.

**Cách 1 — `/etc/hosts` thủ công (khuyến nghị cho tenant/domain mới):**
```bash
sudo sh -c 'echo "127.0.0.1  id.daihoc.io.vn admin.daihoc.io.vn stem.daihoc.io.vn" >> /etc/hosts'
```

Sau đó test resolve:

```bash
curl http://localhost:5294/api/tenants/resolve?domain=stem.daihoc.io.vn
```

Hoặc test bằng Host header:

```bash
curl http://localhost:5294/api/tenants/resolve -H "Host: stem.daihoc.io.vn"
```

**Cách 2 — `dnsmasq` wildcard cho `*.daihoc.io.vn` trong local dev:**
```bash
brew install dnsmasq
echo 'address=/.daihoc.io.vn/127.0.0.1' >> $(brew --prefix)/etc/dnsmasq.conf
sudo brew services start dnsmasq
sudo mkdir -p /etc/resolver && sudo sh -c 'echo "nameserver 127.0.0.1" > /etc/resolver/daihoc.io.vn'
```

---

### 6. PostgreSQL ENUM Types — Lưu ý khi viết SQL

Database dùng custom PostgreSQL ENUM types. Dapper không tự cast `string` → ENUM. Phải explicit cast trong SQL:

```sql
-- ✅ Đúng
INSERT INTO tenant (..., status, ...) VALUES (..., @Status::common_status, ...)
UPDATE tenant SET status = @Status::common_status WHERE id = @Id

-- ❌ Sai — lỗi: column "status" is of type common_status but expression is of type text
INSERT INTO tenant (..., status, ...) VALUES (..., @Status, ...)
```

Các ENUM types cần cast: `common_status`, `sales_channel`, `role_scope`, `content_type`, `processing_status`, `visibility_status`, `drm_type`, `session_status`, `ticket_status`, `event_type`.

---

### 7. Dừng / Reset Database

```bash
# Dừng
docker compose -f deploy/docker/docker-compose.yml down

# Reset hoàn toàn (xoá dữ liệu)
docker compose -f deploy/docker/docker-compose.yml down -v
```

---

## Architecture

### Module Dependency Rule

```
Api  →  Application  →  Domain
               ↓
Infrastructure  →  Application / Domain
               ↓
         BuildingBlocks.Contracts / Domain   (shared, không thuộc module nào)
```

**Quy tắc cứng:**
- Module không được reference sang module khác
- Shared interfaces (`ICurrentTenant`, `IDomainEvent`...) đặt ở `BuildingBlocks.Contracts`
- Domain không reference bất kỳ infrastructure package nào

---

### Multi-Tenant Request Flow

```
Request: stem.aigedu.vn/api/...
        ↓
TenantResolutionMiddleware
  → extract "stem" từ Host header
  → cache lookup (MemoryCache 10 phút)
  → miss: query DB WHERE subdomain = 'stem'
  → set ICurrentTenant { TenantId, TenantCode, Subdomain }
        ↓
Authentication Middleware  →  validate JWT
        ↓
Authorization Middleware   →  check roles/permissions
        ↓
Endpoint Handler
        ↓
Repository  →  query với tenant_id filter
```

---

## Source Structure

```
Aig.Lms.sln
├── src
│   ├── Api
│   │   └── Aig.Lms.Api                     ← Entry point, middleware, DI wiring
│   │       ├── Authorization
│   │       │   ├── PermissionAuthorizationHandler.cs
│   │       │   ├── PermissionPolicyProvider.cs
│   │       │   └── PermissionEndpointExtensions.cs
│   │       ├── Middleware
│   │       │   └── TenantResolutionMiddleware.cs
│   │       ├── Extensions
│   │       │   ├── JwtExtensions.cs
│   │       │   ├── OpenApiExtensions.cs
│   │       │   └── PermissionExtensions.cs
│   │       └── Program.cs
│   │
│   ├── BuildingBlocks                       ← Shared abstractions, không thuộc module nào
│   │   ├── Aig.Lms.BuildingBlocks.Domain
│   │   │   ├── Abstractions/IDomainEvent.cs
│   │   │   ├── Entities/Entity.cs
│   │   │   ├── Entities/AggregateRoot.cs
│   │   │   ├── ValueObjects/ValueObject.cs
│   │   │   └── Exceptions/DomainException.cs
│   │   ├── Aig.Lms.BuildingBlocks.Application
│   │   ├── Aig.Lms.BuildingBlocks.Infrastructure
│   │   └── Aig.Lms.BuildingBlocks.Contracts
│   │       └── Tenancy/ICurrentTenant.cs    ← Inject vào mọi module cần tenant context
│   │
│   ├── Modules
│   │   ├── Identity       ✅ Login, refresh token, logout, change/reset password, brute-force protection
│   │   ├── Tenancy        ✅ Tenant CRUD, subdomain management, ICurrentTenant implementation
│   ├── Users          ✅ CRUD, pagination, search, avatar, status management, auto-inherit tenant assignments
│   │   ├── Authorization  ✅ Roles CRUD, permissions, role-permission mapping, permission-based middleware
│   │   ├── Partners       ✅ Partner CRUD
│   │   ├── Schools        ✅ School CRUD (tax, contact info, contract dates, status management)
│   │   ├── Catalog        ✅ Catalog item CRUD theo type, CATALOG_VIEW / CATALOG_MANAGE permissions
│   │   ├── ContentManagement  ✅ Task 3.2: Content CMS (CRUD, presigned URLs, file metadata, multi-format support)
│   │   ├── ContentDelivery    🔲 Signed URL, access policy
│   │   ├── Viewer             🔲 Viewer session, watermark policy
│   │   ├── Downloads          🔲 Secure download, watermark render
│   │   ├── AuditLogs          🔲 User behaviour tracking
│   │   ├── Reports            🔲 Active users, storage, bandwidth
│   │   └── MediaProcessing    🔲 HLS segmentation, AES-128, watermark prep
│   │
│   ├── Workers
│   │   ├── Aig.Lms.Workers.BackgroundJobs
│   │   └── Aig.Lms.Workers.MediaPipeline
│   │
│   └── SharedKernel
│       └── Aig.Lms.SharedKernel
│
├── tests
│   ├── UnitTests
│   ├── IntegrationTests
│   ├── ArchitectureTests
│   └── ApiTests
│
├── database
│   ├── V1__initial_schema.sql               ← ENUMs, 17 tables, indexes
│   ├── V2__seed_dev.sql                     ← Tenants, schools, users, roles, permissions, role-permissions
│   ├── V3__align_tenant_permissions.sql     ← TENANTS_* permissions, role mappings
│   ├── V4__school_contract_dates.sql        ← contract_start_date, contract_end_date columns on school
│   ├── V5__remove_student_cleanup.sql       ← Remove STUDENT enum, add is_inherited to user_tenant_role_assignment
│   ├── V6__catalog_master_data.sql          ← catalog_item table, CATALOG_VIEW/CATALOG_MANAGE permissions, seed data
│   ├── V7__update_user_session.sql          ← Workspace selector support for session management
│   └── V8__curriculum_node_type_text.sql    ← Migrate curriculum node_type from ENUM to VARCHAR(100)
│
└── deploy
    ├── docker/docker-compose.yml
    ├── k8s/
    └── nginx/
```

---

## Implemented API Endpoints

### Identity — Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/identity/identify` | Public | Identifier-first lookup — trả `{ nextStep, tenantBranding? }`; không lộ user existence; branding resolve từ domain hoặc tenant của user |
| `POST` | `/api/identity/auth/login` | Public | Login, returns accessToken + refreshToken |
| `POST` | `/api/identity/auth/refresh` | Public | Rotate refresh token, get new access token |
| `POST` | `/api/identity/auth/logout` | Public | Revoke session by refresh token |
| `POST` | `/api/identity/auth/change-password` | Bearer | Self-service password change, revokes other active sessions |
| `POST` | `/api/identity/auth/reset-password` | `USERS_UPDATE` | Admin reset password, revokes all sessions |

**Security features:**
- Brute-force protection: 5 failed attempts → 15 min lockout
- Refresh token rotation with SHA256 hash storage
- Clear error codes: `ACCOUNT_LOCKED` (403), `TEMPORARILY_LOCKED` (429), `INVALID_CREDENTIALS` (401)

### Users

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/admin/users/{id}` | `USERS_VIEW` | Get user by ID |
| `GET` | `/api/admin/users?schoolId=&tenantId=&accountType=&page=&pageSize=&status=&search=` | `USERS_VIEW` | List users (all filters optional) |
| `POST` | `/api/admin/users` | `USERS_CREATE` | Create user account (accountType: LMS_ADMIN / TENANT_ADMIN / SCHOOL_ADMIN / TEACHER; optional schoolId auto-inherits tenant assignments) |
| `PUT` | `/api/admin/users/{id}` | `USERS_UPDATE` | Update user details (fullName, email, status, accountType, avatarUrl) |
| `PATCH` | `/api/admin/users/{id}/status` | `USERS_CHANGE_STATUS` | Change user status (ACTIVE/INACTIVE/LOCKED) |
| `PATCH` | `/api/admin/users/{id}/avatar` | `USERS_UPDATE` | Update avatar URL |
| `POST` | `/api/admin/users/{id}/reset-password` | `USERS_UPDATE` | Admin resets password, clears failed-login & lock |
| `DELETE` | `/api/admin/users/{id}` | `USERS_DELETE` | Soft-delete user |
| `GET` | `/api/admin/users/import/template` | `USERS_CREATE` | Download Excel import template |
| `POST` | `/api/admin/users/import?schoolId=` | `USERS_CREATE` | Bulk import from Excel, per-row report |
| `GET` | `/api/admin/users/{id}/tenants` | `USERS_VIEW` | List tenant assignments (inherited + manual) |
| `POST` | `/api/admin/users/{id}/tenants` | `ROLES_ASSIGN` | Manually assign user to a tenant with a role |
| `DELETE` | `/api/admin/users/{id}/tenants/{tenantId}` | `ROLES_REVOKE` | Revoke all role assignments for a tenant |
| `GET` | `/api/admin/schools/{schoolId}/users` | `USERS_VIEW` | List users belonging to a school (filter, search, paginate) |

### Tenant Members (Content Team)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/admin/tenants/{tenantId}/members?search=&page=&pageSize=` | `USERS_VIEW` | List all users assigned to a tenant with roleCode, roleName, assignedAt — single query, no N+1 |

### Authorization

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/authorization/roles` | `ROLES_VIEW` | List all roles |
| `GET` | `/api/authorization/permissions` | `ROLES_VIEW` | List all permissions |
| `GET` | `/api/authorization/roles/{roleId}/permissions` | `ROLES_VIEW` | Get permissions for a role |
| `GET` | `/api/authorization/users/{userId}/roles` | `ROLES_VIEW` | Get user role assignments |
| `POST` | `/api/authorization/users/{userId}/roles` | `ROLES_ASSIGN` | Assign role to user |
| `DELETE` | `/api/authorization/users/{userId}/roles/{roleId}` | `ROLES_REVOKE` | Revoke role from user |
| `GET` | `/api/admin/roles` | `ROLES_VIEW` | List roles with their permission codes (2.8) |
| `GET` | `/api/admin/users/{userId}/permissions` | `ROLES_VIEW` | Effective permissions for a user (2.8) |

### Tenancy

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/tenants/resolve?domain={domain}` | Public | Resolve tenant/admin domain và trả branding config |
| `GET` | `/api/admin/tenants` | `TENANTS_VIEW` | List tenants với filter/search/pagination |
| `GET` | `/api/admin/tenants/{id}` | `TENANTS_VIEW` | Get tenant details |
| `POST` | `/api/admin/tenants` | `TENANTS_CREATE` | Create tenant + branding |
| `PUT` | `/api/admin/tenants/{id}` | `TENANTS_UPDATE` | Update tenant + branding |
| `PATCH` | `/api/admin/tenants/{id}/status` | `TENANTS_CHANGE_STATUS` | Change tenant status |

### Partners

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/partners` | `PARTNERS_VIEW` | List partners |
| `GET` | `/api/partners/{id}` | `PARTNERS_VIEW` | Get partner by ID |
| `POST` | `/api/partners` | `PARTNERS_CREATE` | Create partner |
| `PUT` | `/api/partners/{id}` | `PARTNERS_UPDATE` | Update partner |

### Catalog (Master Data)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/admin/catalog/{type}` | `CATALOG_VIEW` | Lấy danh sách catalog items theo type (sorted by sortOrder, name) |
| `POST` | `/api/admin/catalog/{type}` | `CATALOG_MANAGE` | Tạo catalog item mới; code auto-normalize UPPERCASE; 409 nếu trùng `(type, code)` |
| `PUT` | `/api/admin/catalog/{type}/{id}` | `CATALOG_MANAGE` | Cập nhật name, description, sortOrder |
| `DELETE` | `/api/admin/catalog/{type}/{id}` | `CATALOG_MANAGE` | Soft-delete; 409 nếu `is_system = TRUE` hoặc đang được dùng |

**Seed types có sẵn:**
| Type | Items |
|---|---|
| `DOCUMENT_TYPE` | `CONTRACT`, `CURRICULUM`, `REFERENCE`, `EXERCISE` |
| `DISPLAY_LABEL` | `NEW`, `FEATURED`, `RECOMMENDED` |

### Schools

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/admin/schools` | `SCHOOLS_VIEW` | List schools với pagination, filter, search |
| `GET` | `/api/admin/schools/{id}` | `SCHOOLS_VIEW` | Get school by ID |
| `POST` | `/api/admin/schools` | `SCHOOLS_CREATE` | Create school |
| `PUT` | `/api/admin/schools/{id}` | `SCHOOLS_UPDATE` | Update school details |
| `PATCH` | `/api/admin/schools/{id}/status` | `SCHOOLS_CHANGE_STATUS` | Change school status |

### Subscriptions (License & Contract)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/admin/schools/{schoolId}/subscriptions` | `SCHOOLS_VIEW` | List tất cả subscription của trường (join tenant) |
| `POST` | `/api/admin/schools/{schoolId}/subscriptions` | `SCHOOLS_UPDATE` | Tạo subscription — gắn trường vào tenant |
| `PUT` | `/api/admin/schools/{schoolId}/subscriptions/{id}` | `SCHOOLS_UPDATE` | Cập nhật hợp đồng (ngày, sessions, policy) |
| `DELETE` | `/api/admin/schools/{schoolId}/subscriptions/{id}` | `SCHOOLS_UPDATE` | Xóa subscription (soft-delete) |

### Curriculum (Task 3.1)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/tenants/{tenantId}/curriculum?parentId=&pageSize=&page=` | `CURRICULUM_VIEW` | List curriculum nodes with optional parent filter |
| `POST` | `/api/tenants/{tenantId}/curriculum` | `CURRICULUM_MANAGE` | Create curriculum node (group) |
| `GET` | `/api/tenants/{tenantId}/curriculum/{nodeId}` | `CURRICULUM_VIEW` | Get curriculum node detail |
| `PUT` | `/api/tenants/{tenantId}/curriculum/{nodeId}` | `CURRICULUM_MANAGE` | Update curriculum node |
| `DELETE` | `/api/tenants/{tenantId}/curriculum/{nodeId}` | `CURRICULUM_MANAGE` | Soft-delete curriculum node |

### Content Management (Task 3.2)

**Upload Flow (3 Steps):**
1. **POST create content** → Server generates presigned PUT URL (non-URL types only)
2. **Direct PUT to MinIO** → Client uploads file directly using presigned URL (bypasses API, faster)
3. **POST confirm upload** → Client confirms upload complete, server updates metadata

**Content Types:** `VIDEO`, `PDF`, `SLIDE`, `WORD`, `URL`  
**Publish Status:** `DRAFT`, `PUBLISHED`, `ARCHIVED`

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/tenants/{tenantId}/contents?nodeId=&type=&status=&search=&page=&pageSize=` | `CURRICULUM_VIEW` | List contents with optional filters (node, type, status, full-text search); results paginated |
| `POST` | `/api/tenants/{tenantId}/contents` | `CURRICULUM_MANAGE` | Create content (type: VIDEO/PDF/SLIDE/WORD/URL); generates presigned PUT URL for non-URL types; returns `{ contentId, uploadUrl, objectKey, uploadExpiresAt }` |
| `GET` | `/api/tenants/{tenantId}/contents/{contentId}` | `CURRICULUM_VIEW` | Get content detail with all metadata |
| `PUT` | `/api/tenants/{tenantId}/contents/{contentId}` | `CURRICULUM_MANAGE` | Update content metadata (title, description, watermark, download policy, visibility window); optional move to different curriculum node |
| `PATCH` | `/api/tenants/{tenantId}/contents/{contentId}/status` | `CURRICULUM_MANAGE` | Update publish status: DRAFT → PUBLISHED → ARCHIVED |
| `POST` | `/api/tenants/{tenantId}/contents/{contentId}/upload` | `CURRICULUM_MANAGE` | Confirm file upload complete; update file metadata (objectKey, mimeType, fileSizeBytes) |
| `DELETE` | `/api/tenants/{tenantId}/contents/{contentId}` | `CURRICULUM_MANAGE` | Soft-delete content; hidden from list/detail queries |

**Content Request Body (POST Create):**
```json
{
  "curriculumNodeId": "uuid",           // Required
  "type": "VIDEO|PDF|SLIDE|WORD|URL",  // Required
  "title": "string",                    // Required
  "description": "string",              // Optional
  "fileName": "string",                 // Required for VIDEO/PDF/SLIDE/WORD; null for URL
  "sourceUrl": "string",                // Required for URL type; ignored for others
  "watermarkEnabled": boolean,          // Optional, default: true
  "isDownloadable": boolean,            // Optional, default: false
  "visibilityFrom": "ISO8601",          // Optional, schedule drip content
  "visibilityTo": "ISO8601"             // Optional
}
```

**Upload Response (POST Create, non-URL types):**
```json
{
  "contentId": "uuid",
  "uploadUrl": "https://...(presigned PUT URL)...",
  "objectKey": "tenants/{tenantId}/contents/{contentId}/{fileName}",
  "uploadExpiresAt": "ISO8601"
}
```

**Confirm Upload Request Body (POST Upload):**
```json
{
  "fileName": "string",
  "objectKey": "string (same from uploadUrl)",
  "mimeType": "string (e.g. video/mp4)",
  "fileSizeBytes": 12345
}
```

**Key Features:**
- ✅ Multi-file format support (VIDEO, PDF, SLIDE, WORD, URL external links)
- ✅ Presigned PUT URLs for direct MinIO upload (faster, no API bottleneck)
- ✅ File metadata tracking (MIME type, size, path)
- ✅ Watermark policy enforcement (applied during streaming)
- ✅ Download permission control (restrictable per content)
- ✅ Visibility scheduling (drip content via visibilityFrom/visibilityTo)
- ✅ Content status lifecycle (DRAFT → PUBLISHED → ARCHIVED)
- ✅ Multi-tenant isolation (tenant_id scope on all queries)
- ✅ Soft-delete (preserved in DB, hidden from API)

**System Test Cases:**
- See `tests/SystemTest/ContentManagement/ContentManagement_System_Test_Cases_Task_3.2.md`

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Health check |
| `GET` | `/health/live` | Public | Liveness probe |
| `GET` | `/health/ready` | Public | Readiness probe |

---

## RBAC — Role Permission Matrix

| Permission | LMS_ADMIN | TENANT_ADMIN | SCHOOL_ADMIN | TEACHER |
|---|:---:|:---:|:---:|:---:|
| `USERS_VIEW` | ✅ | ✅ | ✅ | — |
| `USERS_CREATE` | ✅ | ✅ | ✅ | — |
| `USERS_UPDATE` | ✅ | ✅ | ✅ | — |
| `USERS_DELETE` | ✅ | — | — | — |
| `USERS_CHANGE_STATUS` | ✅ | ✅ | ✅ | — |
| `ROLES_VIEW` | ✅ | ✅ | ✅ | — |
| `ROLES_ASSIGN` | ✅ | ✅ | ✅ | — |
| `ROLES_REVOKE` | ✅ | ✅ | ✅ | — |
| `TENANTS_VIEW` | ✅ | — | — | — |
| `TENANTS_CREATE` | ✅ | — | — | — |
| `TENANTS_UPDATE` | ✅ | — | — | — |
| `TENANTS_CHANGE_STATUS` | ✅ | — | — | — |
| `SCHOOLS_VIEW` | ✅ | ✅ | — | — |
| `SCHOOLS_CREATE` | ✅ | — | — | — |
| `SCHOOLS_UPDATE` | ✅ | — | — | — |
| `SCHOOLS_CHANGE_STATUS` | ✅ | — | — | — |
| `CURRICULUM_VIEW` | ✅ | ✅ | ✅ | ✅ |
| `CURRICULUM_MANAGE` | ✅ | ✅ | — | — |
| `CONTENT_VIEW` | ✅ | ✅ | ✅ | ✅ |
| `CONTENT_CREATE` | ✅ | ✅ | — | — |
| `CONTENT_UPDATE` | ✅ | ✅ | — | — |
| `CONTENT_DELETE` | ✅ | ✅ | — | — |
| `CONTENT_PUBLISH` | ✅ | ✅ | — | — |
| `CONTENT_PERMISSION_GRANT` | ✅ | ✅ | — | — |
| `CONTENT_PERMISSION_REVOKE` | ✅ | ✅ | — | — |
| `AUDIT_LOGS_VIEW` | ✅ | ✅ | — | — |
| `AUDIT_LOGS_EXPORT` | ✅ | — | — | — |
| `CATALOG_VIEW` | ✅ | ✅ | — | — |
| `CATALOG_MANAGE` | ✅ | — | — | — |
| `REPORTS_VIEW` | ✅ | ✅ | — | — |
| `SESSIONS_VIEW` | ✅ | — | — | — |
| `SESSIONS_MANAGE` | ✅ | — | — | — |

> **LMS_ADMIN** bypasses all permission checks at the handler level (no DB query needed).
> **Account type scoping:** LMS_ADMIN → PLATFORM tenant, TENANT_ADMIN → assigned tenant, SCHOOL_ADMIN/TEACHER → school's contracted tenants (auto-inherited via `user_tenant_role_assignment`).

---

## Permission-Based Authorization

All permission-protected endpoints use dynamic policy resolution:

```
Endpoint: .RequireAuthorization("Permission:USERS_VIEW")
    ↓
PermissionPolicyProvider → creates policy with PermissionRequirement
    ↓
PermissionAuthorizationHandler:
  1. Extract role claims from JWT
  2. LMS_ADMIN → bypass all checks (no DB query)
  3. Others → query IPermissionService (cached 5 min)
     IPermissionService → GetPermissionCodesByRoleCodesAsync
     → SELECT DISTINCT p.code FROM permission JOIN role_permission JOIN role WHERE r.code = ANY(@roles)
  4. Check if user has required permission code
```

**Source of truth for roles/tenants:** `user_tenant_role_assignment` (single table for all account types). Login reads roles and tenant memberships from this table — no separate `user_role_assignment` lookup.

---

## Unit Testing

### Tech Stack

- **xUnit** — Test framework
- **NSubstitute** — Mocking library
- **FluentAssertions** — Readable assertions
- **Coverlet** — Code coverage collector
- **ReportGenerator** — HTML/Text coverage reports

### Chạy Tests

```bash
# Chạy tất cả unit tests
dotnet test tests/UnitTests/Aig.Lms.UnitTests

# Chạy với output chi tiết
dotnet test tests/UnitTests/Aig.Lms.UnitTests --verbosity normal

# Chạy test cụ thể theo tên class
dotnet test tests/UnitTests/Aig.Lms.UnitTests --filter "FullyQualifiedName~LoginCommandHandlerTests"

# Chạy test cụ thể theo tên method
dotnet test tests/UnitTests/Aig.Lms.UnitTests --filter "FullyQualifiedName~HandleAsync_ValidCredentials_ReturnsLoginResult"
```

### Chạy Test Coverage

```bash
# 1. Thu thập coverage data (output: cobertura XML)
dotnet test tests/UnitTests/Aig.Lms.UnitTests \
  --collect:"XPlat Code Coverage" \
  --results-directory tests/UnitTests/TestResults

# 2. Sinh coverage report (cần cài reportgenerator)
dotnet tool install --global dotnet-reportgenerator-globaltool

# 3. Tạo HTML report (filter theo module assemblies)
export DOTNET_ROOT="/opt/homebrew/Cellar/dotnet/10.0.105/libexec"  # macOS Homebrew
reportgenerator \
  -reports:"tests/UnitTests/TestResults/*/coverage.cobertura.xml" \
  -targetdir:"tests/UnitTests/CoverageReport" \
  -reporttypes:"Html;HtmlSummary" \
  -assemblyfilters:"+Aig.Lms.Modules.*"

# 4a. Xem summary text
cat tests/UnitTests/CoverageReport/Summary.txt

# 4b. Mở HTML report
open tests/UnitTests/CoverageReport/index.html
```

### Cấu trúc Tests

```
tests/UnitTests/Aig.Lms.UnitTests/
├── Identity/
│   ├── IdentifyCommandHandlerTests.cs           ← 12 tests (empty id, user-not-found no-leak, deleted-no-leak, single-tenant white-label, LMS_ADMIN no-branding, multi-tenant no-branding, domain priority, next-step-always-PASSWORD)
│   ├── LoginCommandHandlerTests.cs              ← 14 tests (brute-force, lockout, session, statuses)
│   ├── RefreshTokenCommandHandlerTests.cs       ← 4 tests (rotation, inactive user, empty tenant)
│   ├── ChangePasswordCommandHandlerTests.cs     ← 10 tests (validation, wrong password, session revoke, audit log)
│   ├── ResetPasswordCommandHandlerTests.cs      ← 3 tests (reset, revoke sessions)
│   └── LogoutCommandHandlerTests.cs             ← 2 tests (valid/invalid token)
├── Authorization/
│   ├── AssignRoleCommandHandlerTests.cs         ← 3 tests (assign, scope, not found)
│   ├── RevokeRoleCommandHandlerTests.cs         ← 2 tests (revoke, not found)
│   ├── QueryHandlerTests.cs                     ← 5 tests (ListRoles, GetUserRoles, ListPermissions, GetRolePermissions)
│   ├── PermissionServiceTests.cs                ← 4 tests (query, cache hit, sorted key, separate)
│   └── PermissionAuthorizationHandlerTests.cs   ← 5 tests (SUPER_ADMIN bypass, has/missing perm)
├── Users/
│   ├── CreateUserCommandHandlerTests.cs         ← 9 tests (valid, duplicate, null email, hash, auto-inherit, no-school, no-type, explicit role)
│   ├── UpdateUserCommandHandlerTests.cs         ← 5 tests (update, not found, ChangeStatus, records)
│   ├── ResetPasswordCommandHandlerTests.cs      ← 5 tests (success, not found, empty password, audit log, hash)
│   ├── ChangeUserStatusCommandHandlerTests.cs   ← 5 tests (active/inactive/locked, not found, audit log)
│   ├── UserTenantCommandHandlerTests.cs         ← 8 tests (GetTenants×2, AssignTenant×3, RemoveTenant×3)
│   └── GetSchoolUsersQueryHandlerTests.cs       ← 5 tests (list, empty, filter status, filter type, pagination)
├── Tenancy/
│   ├── TenantTests.cs                           ← 10 tests (entity creation, UpdateDetails, SetStatus, value objects)
│   ├── CreateTenantHandlerTests.cs              ← 5 tests (valid, duplicate code/subdomain, missing fields, name length)
│   ├── UpdateTenantHandlerTests.cs              ← 4 tests (valid, not found, empty name, duplicate check)
│   └── ChangeTenantStatusHandlerTests.cs        ← 4 tests (activate, deactivate, not found, invalid status)
├── Schools/
│   ├── CreateSchoolCommandHandlerTests.cs           ← 10 tests (valid, code uppercase, null fields, duplicate, validation, contract dates)
│   ├── UpdateSchoolCommandHandlerTests.cs           ← 7 tests (valid, not found, contract dates, empty/long name)
│   ├── CreateSubscriptionCommandHandlerTests.cs     ← 11 tests (valid, all policies, missing ids, end<start, maxSessions, invalid policy, school not found, duplicate)
│   └── UpdateSubscriptionCommandHandlerTests.cs     ← 6 tests (valid, not found, end<start, maxSessions, invalid policy)
└── Catalog/
    └── CatalogCommandHandlerTests.cs                ← 18 tests (GetByType sorted/empty/uppercase, Create valid/duplicate/empty-code/empty-name/normalize, Update valid/notfound/empty-name, Delete not-in-use/system-throws/in-use-throws/notfound, Domain code-normalize/system-delete-throws/user-delete-flag)
```

**Total: 221 unit tests | All passed**

### Integration Tests

```bash
# Chạy integration tests (không cần DB — dùng in-memory stubs)
dotnet test tests/IntegrationTests/Aig.Lms.IntegrationTests
```

```
tests/IntegrationTests/Aig.Lms.IntegrationTests/
├── TenantResolutionIntegrationTests.cs        ← 4 tests (resolve by domain, by Host header, admin domain, unknown domain)
└── Authorization/
    ├── AuthorizationApiFactory.cs             ← WebApplicationFactory with in-memory permission + auth repo stubs
    ├── InMemoryPermissionService.cs           ← Stub: TEACHER→CONTENT_VIEW, TENANT_ADMIN→ROLES_VIEW+...
    ├── InMemoryAuthorizationRepository.cs     ← Stub: 3 roles, fixed test user assignment
    ├── TestJwtHelper.cs                       ← Generates signed JWTs with dev secret
    └── PermissionAuthorizationIntegrationTests.cs ← 12 tests (2.8)
```

**Integration test coverage (2.8):**
- `GET /api/admin/roles` — 401 (no token), 200 (LMS_ADMIN bypass), 403 (TEACHER), 200 (TENANT_ADMIN), response shape
- `GET /api/admin/users/{id}/permissions` — 401, 200 (LMS_ADMIN), 200 (TENANT_ADMIN), 403 (TEACHER), payload shape, empty user

**Total: 16 integration tests | All passed**

### Coverage hiện tại (Application layer)

| Assembly | Line Coverage | Branch Coverage | Method Coverage |
|---|---|---|---|
| Identity.Application | 100% | 100% | 100% |
| Authorization.Application | 100% | 100% | 100% |
| Authorization.Infrastructure (PermissionService) | 100% | 100% | 100% |
| Users.Application | 100% | 100% | 100% |
| Users.Application (UserTenant + SchoolUsers) | 100% | 100% | 100% |
| Tenancy.Application + Domain | 100% | 100% | 100% |
| Schools.Application + Domain | 100% | 100% | 100% |
| Schools.Application (Subscriptions) | 100% | 100% | 100% |
| Api (PermissionAuthorizationHandler) | 100% | 100% | 100% |
| **Total** | **100%** | **98.3%** | **100%** |

> Integration tests (Authorization folder) cover the full HTTP pipeline: JWT validation → PermissionAuthorizationHandler → endpoint → handler → in-memory repo. No DB required — all external dependencies stubbed.

> **Lưu ý:** Coverage chỉ đo Application layer (Handlers, Services, Commands, Results). Infrastructure (Repository, DB access), API Endpoints, Middleware thuộc scope **Integration Test**, không đo trong unit test.

### Quy tắc viết Unit Test

1. **Naming convention:** `MethodName_Scenario_ExpectedResult`
2. **Arrange-Act-Assert** (AAA) pattern
3. **Mock tất cả dependencies** — dùng `NSubstitute.Substitute.For<T>()`
4. **Chỉ test Application layer** — Handler/Service logic, không test Repository (IO)
5. **Mỗi test chỉ assert 1 behavior** — tách riêng verify side-effect và return value nếu cần
6. **Dùng `[Theory]` + `[InlineData]`** cho các input validation tests

Ví dụ test mới:
```csharp
using FluentAssertions;
using NSubstitute;

public class MyHandlerTests
{
    private readonly IMyRepository _repo = Substitute.For<IMyRepository>();
    private readonly MyHandler _handler;

    public MyHandlerTests()
    {
        _handler = new MyHandler(_repo);
    }

    [Fact]
    public async Task HandleAsync_ValidInput_ReturnsExpectedResult()
    {
        // Arrange
        _repo.GetByIdAsync(Arg.Any<Guid>()).Returns(new MyEntity { Id = Guid.NewGuid() });

        // Act
        var result = await _handler.HandleAsync(new MyCommand(Guid.NewGuid()));

        // Assert
        result.Should().NotBeNull();
        await _repo.Received(1).GetByIdAsync(Arg.Any<Guid>());
    }
}
```

---
