# System Test Cases: Task 2.8 — Phân quyền Hệ thống theo Account Type & Tenant

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [None]  
**Id:** ST-AUTH-2.8  
**Branch:** `feat/account_permission`

---

## Scope
- Task 2.8 — Phân quyền hệ thống theo Account Type & Tenant:
  - `LMS_ADMIN` bypass toàn bộ permission checks, scoped vào PLATFORM tenant
  - `TENANT_ADMIN` chỉ truy cập trong tenant được gán, bị từ chối nếu không có quyền
  - `SCHOOL_ADMIN` / `TEACHER` chỉ thấy nội dung trong tenant đã được kế thừa từ school
  - Middleware Authorization áp dụng nhất quán trên tất cả API endpoint có `RequireAuthorization`
  - `GET /api/admin/roles` — danh sách roles kèm permission codes
  - `GET /api/admin/users/{userId}/permissions` — quyền hiệu lực của user

---

## Prerequisites
- Seed data V1–V5 đã apply (schema + dev data)
- Ba users từ `V2__seed_dev.sql`:

| Username | Password | Role | Tenant | Ghi chú |
|---|---|---|---|---|
| `superadmin` | `Admin@123` | `LMS_ADMIN` | PLATFORM | Bypass mọi permission check |
| `stem_admin` | `Admin@123` | `TENANT_ADMIN` | STEM | Có `ROLES_VIEW`, `USERS_VIEW`... |
| `teacher01` | `Admin@123` | `TEACHER` | STEM | Chỉ có `CONTENT_VIEW`, `CURRICULUM_VIEW` |

- Lấy token cho từng user:
```bash
# LMS_ADMIN token
curl -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "Admin@123"}' \
  | jq -r '.accessToken'

# TENANT_ADMIN token
curl -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "stem_admin", "password": "Admin@123"}' \
  | jq -r '.accessToken'

# TEACHER token
curl -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "teacher01", "password": "Admin@123"}' \
  | jq -r '.accessToken'
```

---

## Acceptance Criteria Index

- `AC-2.8-01`: `LMS_ADMIN` → toàn quyền hệ thống, bypass permission check
- `AC-2.8-02`: `TENANT_ADMIN` → chỉ trong tenant được gán, bị từ chối endpoint ngoài quyền
- `AC-2.8-03`: `SCHOOL_ADMIN` / `TEACHER` → chỉ thấy nội dung được cấp quyền trong tenant đang context
- `AC-2.8-04`: Request không có token → 401 Unauthorized
- `AC-2.8-05`: Middleware Authorization áp dụng nhất quán trên tất cả endpoint có `RequireAuthorization`
- `AC-2.8-06`: `GET /api/admin/roles` trả về danh sách roles kèm `permissionCodes`
- `AC-2.8-07`: `GET /api/admin/users/{userId}/permissions` trả về quyền hiệu lực của user

---

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.8-01 | Không có token → 401 trên các endpoint bảo vệ | AC-2.8-04, AC-2.8-05 |
| TC-2.8-02 | LMS_ADMIN bypass toàn bộ permission check | AC-2.8-01, AC-2.8-05 |
| TC-2.8-03 | LMS_ADMIN login thành công — JWT chứa đúng claims | AC-2.8-01 |
| TC-2.8-04 | TENANT_ADMIN truy cập endpoint có quyền | AC-2.8-02, AC-2.8-05 |
| TC-2.8-05 | TENANT_ADMIN bị từ chối endpoint ngoài quyền | AC-2.8-02, AC-2.8-05 |
| TC-2.8-06 | TEACHER bị từ chối tất cả endpoint admin | AC-2.8-03, AC-2.8-05 |
| TC-2.8-07 | TEACHER được truy cập endpoint phù hợp với quyền | AC-2.8-03, AC-2.8-05 |
| TC-2.8-08 | GET /api/admin/roles — LMS_ADMIN nhận danh sách đầy đủ | AC-2.8-06 |
| TC-2.8-09 | GET /api/admin/roles — TENANT_ADMIN nhận danh sách đầy đủ | AC-2.8-06 |
| TC-2.8-10 | GET /api/admin/roles — TEACHER bị từ chối (403) | AC-2.8-06 |
| TC-2.8-11 | GET /api/admin/users/{id}/permissions — LMS_ADMIN xem quyền của user | AC-2.8-07 |
| TC-2.8-12 | GET /api/admin/users/{id}/permissions — TENANT_ADMIN xem quyền | AC-2.8-07 |
| TC-2.8-13 | GET /api/admin/users/{id}/permissions — TEACHER bị từ chối (403) | AC-2.8-07 |
| TC-2.8-14 | GET /api/admin/users/{id}/permissions — user không tồn tại → 200 empty | AC-2.8-07 |
| TC-2.8-15 | Token hết hạn → 401 trên mọi endpoint bảo vệ | AC-2.8-04, AC-2.8-05 |
| TC-2.8-16 | Token bị giả mạo (sai chữ ký) → 401 | AC-2.8-04 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `7`
- Tổng số Test Case: `16`
- AC có coverage:
  - AC-2.8-01: TC-02, TC-03
  - AC-2.8-02: TC-04, TC-05
  - AC-2.8-03: TC-06, TC-07
  - AC-2.8-04: TC-01, TC-15, TC-16
  - AC-2.8-05: TC-01, TC-02, TC-04, TC-05, TC-06, TC-07, TC-15
  - AC-2.8-06: TC-08, TC-09, TC-10
  - AC-2.8-07: TC-11, TC-12, TC-13, TC-14
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-2.8-01 — Không có token → 401 trên các endpoint bảo vệ

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-01  
**AC Covered:** AC-2.8-04, AC-2.8-05

### Description
Xác minh tất cả endpoint có `RequireAuthorization` đều trả về `401 Unauthorized` khi không gửi token.

### Precondition
- API đang chạy tại `http://localhost:5294`.
- Không có `Authorization` header.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` không có token | `401 Unauthorized` |
| 2 | Gọi `GET /api/admin/users/{anyGuid}/permissions` không có token | `401 Unauthorized` |
| 3 | Gọi `GET /api/admin/users` không có token | `401 Unauthorized` |
| 4 | Gọi `GET /api/admin/tenants` không có token | `401 Unauthorized` |
| 5 | Gọi `GET /api/admin/schools` không có token | `401 Unauthorized` |

### Expected Result
- Tất cả 5 requests đều trả về `401 Unauthorized`.
- Body có thể rỗng hoặc chứa `{"title":"Unauthorized"}` — không expose thông tin nội bộ.

### Test Data
```bash
# Tất cả gọi không có header Authorization
curl -i http://localhost:5294/api/admin/roles
curl -i http://localhost:5294/api/admin/users
curl -i http://localhost:5294/api/admin/tenants
curl -i http://localhost:5294/api/admin/schools
```

---

## Test Case: TC-2.8-02 — LMS_ADMIN bypass toàn bộ permission check

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.8-02  
**AC Covered:** AC-2.8-01, AC-2.8-05

### Description
Xác minh `LMS_ADMIN` có thể truy cập tất cả endpoint admin mà không bị chặn bởi permission check — `PermissionAuthorizationHandler` short-circuit ngay khi thấy role `LMS_ADMIN`.

### Precondition
- Đã lấy JWT token cho `superadmin` / `Admin@123`.
- Token được lưu trong biến `$LMS_TOKEN`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với `Authorization: Bearer $LMS_TOKEN` | `200 OK` — trả về danh sách roles |
| 2 | Gọi `GET /api/admin/tenants` với token LMS_ADMIN | `200 OK` |
| 3 | Gọi `GET /api/admin/users` với token LMS_ADMIN | `200 OK` |
| 4 | Gọi `GET /api/admin/schools` với token LMS_ADMIN | `200 OK` |
| 5 | Gọi `GET /api/authorization/roles` với token LMS_ADMIN | `200 OK` |
| 6 | Gọi `GET /api/authorization/permissions` với token LMS_ADMIN | `200 OK` |

### Expected Result
- Tất cả 6 requests trả về `200 OK`.
- Không có request nào trả về `403 Forbidden`.

### Test Data
```bash
LMS_TOKEN="<token của superadmin>"

curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/admin/roles
curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/admin/tenants
curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/admin/users
curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/admin/schools
curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/authorization/roles
curl -i -H "Authorization: Bearer $LMS_TOKEN" http://localhost:5294/api/authorization/permissions
```

---

## Test Case: TC-2.8-03 — LMS_ADMIN login thành công — JWT chứa đúng claims

**Module:** Authorization / Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.8-03  
**AC Covered:** AC-2.8-01

### Description
Xác minh sau khi login, JWT của `superadmin` chứa đúng claims: `role = LMS_ADMIN`, `tenant_id = PLATFORM tenant id`.

### Precondition
- Seed data V1–V5 đã apply.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/identity/auth/login` với `{"username":"superadmin","password":"Admin@123"}` | `200 OK`, body chứa `accessToken` và `refreshToken` |
| 2 | Decode JWT payload (base64 phần thứ 2) | Có claim `role: "LMS_ADMIN"` |
| 3 | Kiểm tra claim `tenant_id` trong JWT | Bằng `00000000-0000-0000-0000-000000000001` (PLATFORM tenant) |
| 4 | Kiểm tra claim `school_id` trong JWT | Rỗng hoặc không có (LMS_ADMIN không thuộc trường) |

### Expected Result
- JWT payload chứa:
  ```json
  {
    "role": "LMS_ADMIN",
    "tenant_id": "00000000-0000-0000-0000-000000000001"
  }
  ```

### Test Data
```bash
RESPONSE=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}')

# Lấy access token
TOKEN=$(echo $RESPONSE | jq -r '.accessToken')

# Decode payload (phần giữa của JWT)
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

---

## Test Case: TC-2.8-04 — TENANT_ADMIN truy cập endpoint có quyền

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.8-04  
**AC Covered:** AC-2.8-02, AC-2.8-05

### Description
Xác minh `TENANT_ADMIN` (`stem_admin`) có thể truy cập các endpoint mà role này được cấp quyền: `ROLES_VIEW`, `USERS_VIEW`, `SCHOOLS_VIEW`.

### Precondition
- Đã lấy JWT token cho `stem_admin` / `Admin@123`.
- Token được lưu trong biến `$TA_TOKEN`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với token `stem_admin` | `200 OK` — trả về danh sách roles |
| 2 | Gọi `GET /api/admin/users` với token `stem_admin` | `200 OK` — trả về danh sách users |
| 3 | Gọi `GET /api/admin/schools` với token `stem_admin` | `200 OK` |
| 4 | Gọi `GET /api/authorization/roles` với token `stem_admin` | `200 OK` |
| 5 | Gọi `GET /api/admin/users/{userId}/permissions` với token `stem_admin` | `200 OK` |

### Expected Result
- Tất cả 5 requests trả về `200 OK`.
- Không bị `403 Forbidden` trên các endpoint trong quyền.

### Test Data
```bash
TA_TOKEN="<token của stem_admin>"

curl -i -H "Authorization: Bearer $TA_TOKEN" http://localhost:5294/api/admin/roles
curl -i -H "Authorization: Bearer $TA_TOKEN" http://localhost:5294/api/admin/users
curl -i -H "Authorization: Bearer $TA_TOKEN" http://localhost:5294/api/admin/schools
```

---

## Test Case: TC-2.8-05 — TENANT_ADMIN bị từ chối endpoint ngoài quyền

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-05  
**AC Covered:** AC-2.8-02, AC-2.8-05

### Description
Xác minh `TENANT_ADMIN` bị chặn (`403 Forbidden`) khi gọi endpoint yêu cầu quyền `TENANTS_CREATE`, `TENANTS_CHANGE_STATUS`, `SCHOOLS_CREATE`, `SESSIONS_VIEW` — là các quyền chỉ `LMS_ADMIN` có.

### Precondition
- Đã lấy JWT token cho `stem_admin`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/admin/tenants` với token `stem_admin` và body hợp lệ | `403 Forbidden` |
| 2 | Gọi `PATCH /api/admin/tenants/{id}/status` với token `stem_admin` | `403 Forbidden` |
| 3 | Gọi `POST /api/admin/schools` với token `stem_admin` | `403 Forbidden` |
| 4 | Gọi `DELETE /api/admin/users/{id}` với token `stem_admin` | `403 Forbidden` |

### Expected Result
- Tất cả 4 requests trả về `403 Forbidden`.
- Body không expose stack trace hay thông tin nội bộ.

### Test Data
```bash
TA_TOKEN="<token của stem_admin>"

curl -i -X POST -H "Authorization: Bearer $TA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"X","name":"X","subdomain":"x"}' \
  http://localhost:5294/api/admin/tenants

curl -i -X POST -H "Authorization: Bearer $TA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"S","name":"S"}' \
  http://localhost:5294/api/admin/schools
```

---

## Test Case: TC-2.8-06 — TEACHER bị từ chối tất cả endpoint admin

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-06  
**AC Covered:** AC-2.8-03, AC-2.8-05

### Description
Xác minh `TEACHER` (`teacher01`) bị chặn `403 Forbidden` trên tất cả endpoint admin yêu cầu quyền vượt quá `CONTENT_VIEW` / `CURRICULUM_VIEW`.

### Precondition
- Đã lấy JWT token cho `teacher01`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với token TEACHER | `403 Forbidden` |
| 2 | Gọi `GET /api/admin/users/{id}/permissions` với token TEACHER | `403 Forbidden` |
| 3 | Gọi `GET /api/admin/users` với token TEACHER | `403 Forbidden` |
| 4 | Gọi `GET /api/admin/tenants` với token TEACHER | `403 Forbidden` |
| 5 | Gọi `GET /api/admin/schools` với token TEACHER | `403 Forbidden` |
| 6 | Gọi `POST /api/admin/users` với token TEACHER | `403 Forbidden` |
| 7 | Gọi `GET /api/authorization/roles` với token TEACHER | `403 Forbidden` |
| 8 | Gọi `DELETE /api/admin/users/{id}` với token TEACHER | `403 Forbidden` |

### Expected Result
- Tất cả 8 requests trả về `403 Forbidden`.

### Test Data
```bash
T_TOKEN="<token của teacher01>"

curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/admin/roles
curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/admin/users
curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/admin/tenants
curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/admin/schools
curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/authorization/roles
```

---

## Test Case: TC-2.8-07 — TEACHER được truy cập endpoint phù hợp với quyền

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.8-07  
**AC Covered:** AC-2.8-03, AC-2.8-05

### Description
Xác minh `TEACHER` được truy cập các endpoint yêu cầu `CONTENT_VIEW` hoặc `CURRICULUM_VIEW` — đây là hai permission được seed cho role TEACHER.

### Precondition
- Đã lấy JWT token cho `teacher01`.
- Phase 3 content endpoints chưa implement — test case này reserved cho tương lai khi `GET /client/curriculum` và `GET /client/contents` được triển khai.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/authorization/users/{teacherUserId}/roles` với token LMS_ADMIN | `200 OK` — thấy TEACHER role được assign |
| 2 | Gọi `GET /api/admin/users/{teacherUserId}/permissions` với token LMS_ADMIN | `200 OK` — `permissionCodes` chứa `CONTENT_VIEW` và `CURRICULUM_VIEW` |

### Expected Result
- `permissionCodes` của TEACHER user chứa đúng 2 codes: `["CONTENT_VIEW", "CURRICULUM_VIEW"]`.
- Không chứa `ROLES_VIEW`, `USERS_VIEW`, hay bất kỳ admin permission nào.

---

## Test Case: TC-2.8-08 — GET /api/admin/roles — LMS_ADMIN nhận danh sách đầy đủ

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.8-08  
**AC Covered:** AC-2.8-06

### Description
Xác minh `GET /api/admin/roles` trả về đúng danh sách roles kèm `permissionCodes` đã được seed.

### Precondition
- Đã lấy JWT token cho `superadmin`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với token LMS_ADMIN | `200 OK` |
| 2 | Kiểm tra response body | Array gồm ít nhất 5 roles đã seed |
| 3 | Kiểm tra role `TEACHER` | `permissionCodes` chứa `CONTENT_VIEW`, `CURRICULUM_VIEW` (đúng 2 entries) |
| 4 | Kiểm tra role `LMS_ADMIN` | `permissionCodes` chứa đầy đủ tất cả permissions (≥ 26 entries) |
| 5 | Kiểm tra thứ tự `permissionCodes` | Được sắp xếp ascending (A → Z) |

### Expected Result
- Response là array, mỗi phần tử có shape:
  ```json
  {
    "id": "<guid>",
    "code": "TEACHER",
    "name": "Teacher",
    "permissionCodes": ["CONTENT_VIEW", "CURRICULUM_VIEW"]
  }
  ```
- `permissionCodes` sorted ascending.

### Test Data
```bash
LMS_TOKEN="<token của superadmin>"

curl -s -H "Authorization: Bearer $LMS_TOKEN" \
  http://localhost:5294/api/admin/roles | jq .
```

### Postcondition
- Ghi nhớ `id` của role `TEACHER` từ response để dùng cho TC khác.

---

## Test Case: TC-2.8-09 — GET /api/admin/roles — TENANT_ADMIN nhận danh sách đầy đủ

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.8-09  
**AC Covered:** AC-2.8-06

### Description
Xác minh `TENANT_ADMIN` (có quyền `ROLES_VIEW`) cũng nhận được danh sách roles đầy đủ.

### Precondition
- Đã lấy JWT token cho `stem_admin`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với token TENANT_ADMIN | `200 OK` |
| 2 | Kiểm tra số lượng roles trả về | Bằng với số lượng khi gọi bằng LMS_ADMIN |
| 3 | Kiểm tra `permissionCodes` của một role bất kỳ | Không rỗng, sắp xếp ascending |

### Expected Result
- Cùng response với LMS_ADMIN — không bị filter theo tenant của người gọi.

---

## Test Case: TC-2.8-10 — GET /api/admin/roles — TEACHER bị từ chối (403)

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-10  
**AC Covered:** AC-2.8-06

### Description
Xác minh `TEACHER` bị từ chối khi gọi `GET /api/admin/roles` vì thiếu quyền `ROLES_VIEW`.

### Precondition
- Đã lấy JWT token cho `teacher01`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/roles` với token TEACHER | `403 Forbidden` |
| 2 | Kiểm tra body response | Không trả về danh sách roles, không expose thông tin nội bộ |

### Test Data
```bash
T_TOKEN="<token của teacher01>"
curl -i -H "Authorization: Bearer $T_TOKEN" http://localhost:5294/api/admin/roles
```

---

## Test Case: TC-2.8-11 — GET /api/admin/users/{id}/permissions — LMS_ADMIN xem quyền của user

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.8-11  
**AC Covered:** AC-2.8-07

### Description
Xác minh LMS_ADMIN có thể xem quyền hiệu lực của bất kỳ user nào — response chứa `userId`, `roleCodes`, `permissionCodes`.

### Precondition
- Đã lấy JWT token cho `superadmin`.
- Biết `userId` của `teacher01` (từ `GET /api/admin/users?search=teacher01`):
  - Seed id: `00000000-0000-0000-0004-000000000003`

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/users/00000000-0000-0000-0004-000000000003/permissions` với token LMS_ADMIN | `200 OK` |
| 2 | Kiểm tra `userId` trong response | Bằng `00000000-0000-0000-0004-000000000003` |
| 3 | Kiểm tra `roleCodes` | Chứa `"TEACHER"` |
| 4 | Kiểm tra `permissionCodes` | Chứa `"CONTENT_VIEW"` và `"CURRICULUM_VIEW"` |
| 5 | Kiểm tra `permissionCodes` không chứa admin permissions | Không có `ROLES_VIEW`, `USERS_VIEW`, `TENANTS_CREATE` |
| 6 | Kiểm tra `permissionCodes` được sắp xếp ascending | `CONTENT_VIEW` đứng trước `CURRICULUM_VIEW` |

### Expected Result
```json
{
  "userId": "00000000-0000-0000-0004-000000000003",
  "roleCodes": ["TEACHER"],
  "permissionCodes": ["CONTENT_VIEW", "CURRICULUM_VIEW"]
}
```

### Test Data
```bash
LMS_TOKEN="<token của superadmin>"
TEACHER_ID="00000000-0000-0000-0004-000000000003"

curl -s -H "Authorization: Bearer $LMS_TOKEN" \
  http://localhost:5294/api/admin/users/$TEACHER_ID/permissions | jq .
```

---

## Test Case: TC-2.8-12 — GET /api/admin/users/{id}/permissions — TENANT_ADMIN xem quyền

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.8-12  
**AC Covered:** AC-2.8-07

### Description
Xác minh `TENANT_ADMIN` (có `ROLES_VIEW`) cũng có thể gọi endpoint xem quyền của user.

### Precondition
- Đã lấy JWT token cho `stem_admin`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/users/{teacher01Id}/permissions` với token TENANT_ADMIN | `200 OK` |
| 2 | So sánh kết quả với TC-2.8-11 | Giống nhau — không bị filter |

### Expected Result
- `200 OK`, cùng response với khi LMS_ADMIN gọi.

---

## Test Case: TC-2.8-13 — GET /api/admin/users/{id}/permissions — TEACHER bị từ chối (403)

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-13  
**AC Covered:** AC-2.8-07

### Description
Xác minh `TEACHER` bị `403 Forbidden` khi gọi endpoint xem quyền — thiếu `ROLES_VIEW`.

### Precondition
- Đã lấy JWT token cho `teacher01`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/users/{anyUserId}/permissions` với token TEACHER | `403 Forbidden` |

### Test Data
```bash
T_TOKEN="<token của teacher01>"
curl -i -H "Authorization: Bearer $T_TOKEN" \
  http://localhost:5294/api/admin/users/00000000-0000-0000-0004-000000000001/permissions
```

---

## Test Case: TC-2.8-14 — GET /api/admin/users/{id}/permissions — user không tồn tại → 200 empty

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.8-14  
**AC Covered:** AC-2.8-07

### Description
Xác minh endpoint trả về `200 OK` với `roleCodes: []` và `permissionCodes: []` khi userId không tồn tại — không trả `404`.

### Precondition
- Đã lấy JWT token cho `superadmin`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/users/{randomGuid}/permissions` với token LMS_ADMIN | `200 OK` |
| 2 | Kiểm tra body | `roleCodes: []`, `permissionCodes: []` |

### Test Data
```bash
LMS_TOKEN="<token của superadmin>"
RANDOM_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -s -H "Authorization: Bearer $LMS_TOKEN" \
  http://localhost:5294/api/admin/users/$RANDOM_ID/permissions | jq .
```

### Expected Result
```json
{
  "userId": "<randomGuid>",
  "roleCodes": [],
  "permissionCodes": []
}
```

---

## Test Case: TC-2.8-15 — Token hết hạn → 401 trên mọi endpoint bảo vệ

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-15  
**AC Covered:** AC-2.8-04, AC-2.8-05

### Description
Xác minh JWT hết hạn bị từ chối với `401 Unauthorized` trên mọi endpoint có `RequireAuthorization`.

### Precondition
- Có một JWT đã hết hạn (exp trong quá khứ).
- Có thể tạo bằng cách chỉnh sửa `ExpiryMinutes` = 0 tạm thời hoặc dùng JWT với `exp` manually set vào quá khứ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Lấy token hợp lệ và đợi hết hạn, hoặc craft token với `exp` quá khứ | Token hết hạn |
| 2 | Gọi `GET /api/admin/roles` với expired token | `401 Unauthorized` |
| 3 | Gọi `GET /api/admin/users` với expired token | `401 Unauthorized` |

### Expected Result
- `401 Unauthorized` — không leak thông tin về lý do hết hạn.

---

## Test Case: TC-2.8-16 — Token bị giả mạo (sai chữ ký) → 401

**Module:** Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.8-16  
**AC Covered:** AC-2.8-04

### Description
Xác minh JWT với chữ ký sai (tampered payload hoặc sai secret) bị từ chối `401`.

### Precondition
- Có JWT hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Lấy JWT hợp lệ, sửa phần payload (base64 middle) để thêm role `LMS_ADMIN` | JWT bị tamper |
| 2 | Gọi `GET /api/admin/roles` với JWT giả mạo | `401 Unauthorized` |
| 3 | Gọi `GET /api/admin/tenants` với JWT giả mạo | `401 Unauthorized` |

### Expected Result
- `401 Unauthorized` — chữ ký JWT không hợp lệ luôn bị reject.
- Server không trust bất kỳ claim nào trong token bị giả mạo.

### Test Data
```bash
VALID_TOKEN="<token hợp lệ>"

# Sửa phần payload (phần 2) để thêm role — chữ ký sẽ không khớp
HEADER=$(echo $VALID_TOKEN | cut -d. -f1)
PAYLOAD=$(echo '{"sub":"fake","role":"LMS_ADMIN","exp":9999999999}' | base64 | tr -d '=')
SIG=$(echo $VALID_TOKEN | cut -d. -f3)
FAKE_TOKEN="${HEADER}.${PAYLOAD}.${SIG}"

curl -i -H "Authorization: Bearer $FAKE_TOKEN" http://localhost:5294/api/admin/roles
```
