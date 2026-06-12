# System Test Cases — Tenant Members & Content Team Roles

**Module:** Users / Authorization  
**Endpoints:**
- `GET /api/admin/tenants/{tenantId}/members`
- `POST /api/admin/users/{id}/tenants` (gán role mới: CONTENT_CREATOR, CONTENT_REVIEWER)
- `DELETE /api/admin/users/{id}/tenants/{tenantId}`
- `GET /api/admin/roles` (verify 2 roles mới)

**Migration prerequisite:** `V11__content_team_roles.sql` đã apply  
**Date:** 2026-05-12

---

## Prerequisites

### Seed data cần có:
- Migration V1–V11 đã apply
- Users từ V2: `superadmin` (LMS_ADMIN), `stem_admin` (TENANT_ADMIN), `teacher01` (TEACHER)
- STEM tenant ID: `00000000-0000-0000-0000-000000000002`

### Apply migration V11:
```bash
cat database/V11__content_team_roles.sql | docker exec -i lms-postgres psql -U lms_dev -d lms_dev
```

### Lấy token LMS_ADMIN:
```bash
AT=$(curl -sS -X POST http://localhost:5294/api/identity/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"superadmin","password":"Admin@123"}' | jq -r '.accessToken')
```

---

## Acceptance Criteria Index

| AC ID | Mô tả |
|---|---|
| AC-TM-01 | Sau migration V11, `GET /api/admin/roles` trả về CONTENT_CREATOR và CONTENT_REVIEWER |
| AC-TM-02 | `GET /api/admin/tenants/{tenantId}/members` trả về danh sách user + role trong tenant |
| AC-TM-03 | Gán user với role CONTENT_CREATOR vào tenant → xuất hiện trong members |
| AC-TM-04 | Gán user với role CONTENT_REVIEWER vào tenant → xuất hiện trong members |
| AC-TM-05 | Gán trùng user+tenant+role → không tạo duplicate (idempotent) |
| AC-TM-06 | Thu hồi user khỏi tenant → không còn xuất hiện trong members |
| AC-TM-07 | `GET /api/admin/tenants/{tenantId}/members?search=` filter đúng theo tên/email |
| AC-TM-08 | Phân trang hoạt động đúng (page, pageSize) |
| AC-TM-09 | Không có token → 401 |
| AC-TM-10 | TEACHER token (thiếu USERS_VIEW) → 403 trên endpoint members |

---

## Coverage Matrix

| TC ID | Tên | AC Covered |
|---|---|---|
| TC-TM-01 | Verify 2 roles mới sau migration | AC-TM-01 |
| TC-TM-02 | Load members của tenant rỗng (không có ai) | AC-TM-02 |
| TC-TM-03 | Load members sau khi đã có assignments | AC-TM-02 |
| TC-TM-04 | Gán CONTENT_CREATOR vào tenant | AC-TM-03 |
| TC-TM-05 | Gán CONTENT_REVIEWER vào tenant | AC-TM-04 |
| TC-TM-06 | Gán trùng không tạo duplicate | AC-TM-05 |
| TC-TM-07 | Thu hồi user → mất khỏi members | AC-TM-06 |
| TC-TM-08 | Search filter theo tên | AC-TM-07 |
| TC-TM-09 | Search filter theo email | AC-TM-07 |
| TC-TM-10 | Phân trang page 1 | AC-TM-08 |
| TC-TM-11 | Không có token → 401 | AC-TM-09 |
| TC-TM-12 | TEACHER token → 403 | AC-TM-10 |

---

## Test Cases

### TC-TM-01: Verify 2 roles mới sau migration V11

**Endpoint:** `GET /api/admin/roles`  
**Auth:** LMS_ADMIN token

```bash
curl -sS http://localhost:5294/api/admin/roles \
  -H "Authorization: Bearer $AT" | jq '[.[] | {code, name}]'
```

**Expected:**
- HTTP 200
- Response array chứa:
  ```json
  { "code": "CONTENT_CREATOR", "name": "Content Creator" }
  { "code": "CONTENT_REVIEWER", "name": "Content Reviewer" }
  ```
- `CONTENT_CREATOR.permissionCodes` gồm: `CURRICULUM_VIEW`, `CATALOG_VIEW`, `CONTENT_VIEW`, `CONTENT_CREATE`, `CONTENT_UPDATE`
- `CONTENT_REVIEWER.permissionCodes` gồm: `CURRICULUM_VIEW`, `CATALOG_VIEW`, `CONTENT_VIEW`, `CONTENT_UPDATE`, `CONTENT_PUBLISH`
- `CONTENT_REVIEWER` **không có** `CONTENT_CREATE`
- `CONTENT_CREATOR` **không có** `CONTENT_PUBLISH`

---

### TC-TM-02: Load members của tenant STEM — trạng thái ban đầu

**Endpoint:** `GET /api/admin/tenants/{tenantId}/members`  
**Auth:** LMS_ADMIN token  
**tenantId:** `00000000-0000-0000-0000-000000000002` (STEM)

```bash
TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS "http://localhost:5294/api/admin/tenants/$TENANT_ID/members" \
  -H "Authorization: Bearer $AT" | jq '{total, itemCount: (.items | length)}'
```

**Expected:**
- HTTP 200
- Response có shape: `{ items: [...], total: N, page: 1, pageSize: 20 }`
- Mỗi item có đủ fields: `userId`, `username`, `fullName`, `avatarUrl`, `email`, `roleId`, `roleCode`, `roleName`, `isInherited`, `assignedAt`
- `total` >= 1 (ít nhất `teacher01` đã inherited TEACHER role từ V2 seed)

---

### TC-TM-03: Load members sau khi gán thủ công — verify data đầy đủ

**Setup:** Chạy TC-TM-04 trước (gán `teacher01` với `CONTENT_CREATOR`)

```bash
TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS "http://localhost:5294/api/admin/tenants/$TENANT_ID/members" \
  -H "Authorization: Bearer $AT" | jq '.items[] | {username, roleCode, isInherited, assignedAt}'
```

**Expected:**
- HTTP 200
- Row có `roleCode: "CONTENT_CREATOR"` xuất hiện trong danh sách
- `isInherited: false` cho assignment thủ công
- `assignedAt` là timestamp hợp lệ (ISO 8601)

---

### TC-TM-04: Gán user với role CONTENT_CREATOR vào tenant

**Setup:** Lấy userId của `teacher01`:
```bash
TEACHER_ID=$(curl -sS "http://localhost:5294/api/admin/users?search=teacher01" \
  -H "Authorization: Bearer $AT" | jq -r '.items[0].id')
```

**Endpoint:** `POST /api/admin/users/{id}/tenants`

```bash
TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS -X POST "http://localhost:5294/api/admin/users/$TEACHER_ID/tenants" \
  -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\", \"roleCode\": \"CONTENT_CREATOR\"}"
```

**Expected:**
- HTTP 200 hoặc 201
- `GET /api/admin/tenants/$TENANT_ID/members` sau đó: `teacher01` xuất hiện với `roleCode: "CONTENT_CREATOR"`

---

### TC-TM-05: Gán user với role CONTENT_REVIEWER vào tenant

**Setup:** Tạo user test mới hoặc dùng `stem_admin`:
```bash
STEM_ADMIN_ID=$(curl -sS "http://localhost:5294/api/admin/users?search=stem_admin" \
  -H "Authorization: Bearer $AT" | jq -r '.items[0].id')

TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS -X POST "http://localhost:5294/api/admin/users/$STEM_ADMIN_ID/tenants" \
  -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\", \"roleCode\": \"CONTENT_REVIEWER\"}"
```

**Expected:**
- HTTP 200 hoặc 201
- `GET members` sau đó: user xuất hiện với `roleCode: "CONTENT_REVIEWER"`

---

### TC-TM-06: Gán trùng — không tạo duplicate

**Setup:** Dùng lại cùng user + tenant + roleCode từ TC-TM-04. Gọi lại POST lần 2.

```bash
# Gọi lần 2 với cùng body
curl -sS -X POST "http://localhost:5294/api/admin/users/$TEACHER_ID/tenants" \
  -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\": \"$TENANT_ID\", \"roleCode\": \"CONTENT_CREATOR\"}"
```

**Expected:**
- HTTP 200 (hoặc 409 nếu đã tồn tại — behavior hiện tại trả về `false` thay vì insert)
- `GET members` chỉ hiện **1 row** cho user này với role CONTENT_CREATOR (không duplicate)

---

### TC-TM-07: Thu hồi user khỏi tenant

**Setup:** Đã có assignment từ TC-TM-04.

```bash
curl -sS -X DELETE "http://localhost:5294/api/admin/users/$TEACHER_ID/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $AT"
```

**Expected:**
- HTTP 204
- `GET /api/admin/tenants/$TENANT_ID/members` sau đó: không còn row với `roleCode: "CONTENT_CREATOR"` cho `teacher01`

> **Lưu ý:** DELETE thu hồi **tất cả roles** của user trong tenant, kể cả inherited. Kiểm tra `GET /api/admin/users/{id}/tenants` sau đó cũng không còn entry cho tenant này.

---

### TC-TM-08: Search filter theo tên

```bash
TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS "http://localhost:5294/api/admin/tenants/$TENANT_ID/members?search=teacher" \
  -H "Authorization: Bearer $AT" | jq '{total, items: [.items[].username]}'
```

**Expected:**
- HTTP 200
- Chỉ trả về users có `username` hoặc `fullName` chứa "teacher" (case-insensitive)
- Users không match không xuất hiện

---

### TC-TM-09: Search filter theo email

```bash
curl -sS "http://localhost:5294/api/admin/tenants/$TENANT_ID/members?search=lms.dev" \
  -H "Authorization: Bearer $AT" | jq '.items[].email'
```

**Expected:**
- HTTP 200
- Chỉ trả về users có email chứa "lms.dev"

---

### TC-TM-10: Phân trang — pageSize=1

```bash
curl -sS "http://localhost:5294/api/admin/tenants/$TENANT_ID/members?page=1&pageSize=1" \
  -H "Authorization: Bearer $AT" | jq '{total, itemCount: (.items | length), page, pageSize}'
```

**Expected:**
- HTTP 200
- `items` có đúng **1 phần tử**
- `total` > 1 (nếu có nhiều members)
- `page: 1`, `pageSize: 1`

---

### TC-TM-11: Không có token → 401

```bash
TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS -o /dev/null -w "%{http_code}" \
  "http://localhost:5294/api/admin/tenants/$TENANT_ID/members"
```

**Expected:** `401`

---

### TC-TM-12: TEACHER token → 403

```bash
TEACHER_AT=$(curl -sS -X POST http://localhost:5294/api/identity/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq -r '.accessToken')

TENANT_ID="00000000-0000-0000-0000-000000000002"
curl -sS -o /dev/null -w "%{http_code}" \
  "http://localhost:5294/api/admin/tenants/$TENANT_ID/members" \
  -H "Authorization: Bearer $TEACHER_AT"
```

**Expected:** `403` (TEACHER thiếu `USERS_VIEW` permission)
