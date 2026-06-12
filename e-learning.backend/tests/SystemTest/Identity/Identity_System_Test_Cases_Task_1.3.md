# System Test Cases: Task 1.3 - Workspace Selector (Multi-tenant)

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [docs/mockup/Admin/id.lms.vn.html]  
**Id:** ST-IDENTITY-1.3  
**Branch:** `feat/tenant_workspace_selector`

---

## Scope
- Task 1.3 - Workspace Selector: liệt kê workspace (tenant) user được truy cập và chuyển tenant trong cùng session.
- API trong code hiện tại:
  - `GET /api/identity/workspaces`
  - `POST /api/identity/workspaces/{tenantId}/select`

---

## Prerequisites

- API đang chạy tại `http://localhost:5294`
- DB đã apply migration V1-V7
- Seed users từ `V2__seed_dev.sql`:

| Username | Password | Role | Scope |
|---|---|---|---|
| `superadmin` | `Admin@123` | LMS_ADMIN | PLATFORM |
| `stem_admin` | `Admin@123` | TENANT_ADMIN | STEM |
| `teacher01` | `Admin@123` | TEACHER | SCHOOL |

- Có `jq` để parse JSON:

```bash
brew install jq
```

---

## Acceptance Criteria Index

- `AC-1.3-01`: API trả về danh sách tenant user được gán (còn hiệu lực)
- `AC-1.3-02`: User chọn tenant -> token được scope vào tenant đó
- `AC-1.3-03`: Có thể chuyển tenant trong session (Tenant Switcher)
- `AC-1.3-04`: Tenant hết hạn/hết hiệu lực không hiển thị trong danh sách

---

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | API | Acceptance Criteria Covered |
| :--- | :--- | :--- | :--- |
| TC-1.3-01 | Lấy danh sách workspace thành công | GET Workspaces | AC-1.3-01 |
| TC-1.3-02 | Đánh dấu đúng workspace hiện tại (`isCurrentTenant`) | GET Workspaces | AC-1.3-01 |
| TC-1.3-03 | Không trả tenant INACTIVE trong danh sách | GET Workspaces | AC-1.3-04 |
| TC-1.3-04 | Chưa login gọi GET workspaces -> 401 | GET Workspaces | AC-1.3-01 |
| TC-1.3-05 | Chọn workspace hợp lệ -> trả bộ token mới | POST Select Workspace | AC-1.3-02, AC-1.3-03 |
| TC-1.3-06 | Chọn tenant không thuộc quyền user -> 403 | POST Select Workspace | AC-1.3-02 |
| TC-1.3-07 | Refresh token không hợp lệ khi select -> 401 | POST Select Workspace | AC-1.3-03 |
| TC-1.3-08 | Chuyển sang đúng tenant đang đứng vẫn rotate token | POST Select Workspace | AC-1.3-03 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `4`
- Tổng số Test Case: `8`
- AC có coverage:
  - AC-1.3-01: TC-01, TC-02, TC-04
  - AC-1.3-02: TC-05, TC-06
  - AC-1.3-03: TC-05, TC-07, TC-08
  - AC-1.3-04: TC-03
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-1.3-01 - Lấy danh sách workspace thành công

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.3-01  
**AC Covered:** AC-1.3-01

### Description
Xác minh user đã login có thể lấy danh sách workspace đang được gán.

### Precondition
- API đang chạy tại `http://localhost:5294`
- Có access token hợp lệ của user test

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login bằng `teacher01 / Admin@123` để lấy access token | HTTP `200 OK` |
| 2 | Gọi `GET /api/identity/workspaces` với Bearer token | HTTP `200 OK` |
| 3 | Kiểm tra response | Là array các workspace có `tenantId`, `tenantCode`, `name`, `isCurrentTenant` |

### Test Data
```bash
LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}')

AT=$(echo "$LOGIN" | jq -r '.accessToken')

curl -s http://localhost:5294/api/identity/workspaces \
  -H "Authorization: Bearer $AT" | jq .
```

---

## Test Case: TC-1.3-02 - Đánh dấu đúng workspace hiện tại (`isCurrentTenant`)

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.3-02  
**AC Covered:** AC-1.3-01

### Description
Xác minh danh sách workspace có đúng một tenant được đánh dấu `isCurrentTenant = true` (theo claim `tenant_id` trong access token hiện tại).

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login và gọi `GET /api/identity/workspaces` | HTTP `200 OK` |
| 2 | Đếm số phần tử có `isCurrentTenant = true` | Chỉ có đúng 1 phần tử |

---

## Test Case: TC-1.3-03 - Không trả tenant INACTIVE trong danh sách

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-1.3-03  
**AC Covered:** AC-1.3-04

### Description
Xác minh tenant INACTIVE không xuất hiện trong danh sách workspace của user.

### Precondition
- User test có tối thiểu 2 tenant assignment, trong đó 1 tenant ở trạng thái `INACTIVE`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login bằng user test đa tenant | HTTP `200 OK` |
| 2 | Gọi `GET /api/identity/workspaces` | HTTP `200 OK` |
| 3 | Kiểm tra response | Không có tenant `INACTIVE` |

---

## Test Case: TC-1.3-04 - Chưa login gọi GET workspaces -> 401

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Security Test  
**Id:** TC-1.3-04  
**AC Covered:** AC-1.3-01

### Description
Xác minh endpoint workspace bắt buộc xác thực.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/identity/workspaces` không truyền Authorization header | HTTP `401 Unauthorized` |

### Test Data
```bash
curl -i http://localhost:5294/api/identity/workspaces
```

---

## Test Case: TC-1.3-05 - Chọn workspace hợp lệ -> trả bộ token mới

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.3-05  
**AC Covered:** AC-1.3-02, AC-1.3-03

### Description
Xác minh chọn tenant hợp lệ trả về access token mới + refresh token mới.

### Precondition
- User test thuộc nhiều tenant đang ACTIVE.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login lấy `accessToken` và `refreshToken` hiện tại | HTTP `200 OK` |
| 2 | Gọi `GET /api/identity/workspaces` lấy `targetTenantId` khác tenant hiện tại | Có `targetTenantId` hợp lệ |
| 3 | Gọi `POST /api/identity/workspaces/{targetTenantId}/select` với refresh token trong body | HTTP `200 OK` |
| 4 | Kiểm tra response | Có `accessToken` mới và `refreshToken` mới, khác token cũ |

### Test Data
```bash
LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<multi_tenant_user>","password":"<password>"}')

AT=$(echo "$LOGIN" | jq -r '.accessToken')
RT=$(echo "$LOGIN" | jq -r '.refreshToken')

TARGET=$(curl -s http://localhost:5294/api/identity/workspaces \
  -H "Authorization: Bearer $AT" \
  | jq -r '.[] | select(.isCurrentTenant == false) | .tenantId' | head -1)

curl -s -X POST "http://localhost:5294/api/identity/workspaces/$TARGET/select" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AT" \
  -d "{\"refreshToken\":\"$RT\"}" | jq .
```

---

## Test Case: TC-1.3-06 - Chọn tenant không thuộc quyền user -> 403

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-1.3-06  
**AC Covered:** AC-1.3-02

### Description
Xác minh user không thể switch sang tenant không thuộc danh sách được cấp quyền.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login lấy token hợp lệ | HTTP `200 OK` |
| 2 | Gọi `POST /api/identity/workspaces/{tenantId-khong-thuoc-user}/select` | HTTP `403 Forbidden` |
| 3 | Kiểm tra body response | `code = TENANT_NOT_ACCESSIBLE` |

---

## Test Case: TC-1.3-07 - Refresh token không hợp lệ khi select -> 401

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.3-07  
**AC Covered:** AC-1.3-03

### Description
Xác minh request chọn workspace với refresh token sai bị từ chối.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login lấy access token hợp lệ | HTTP `200 OK` |
| 2 | Gọi `POST /api/identity/workspaces/{tenantId}/select` với refresh token giả | HTTP `401 Unauthorized` |
| 3 | Kiểm tra body response | `code = INVALID_TOKEN` |

### Test Data
```bash
curl -i -X POST "http://localhost:5294/api/identity/workspaces/<tenantId>/select" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"refreshToken":"invalid-refresh-token"}'
```

---

## Test Case: TC-1.3-08 - Chuyển sang tenant hiện tại vẫn rotate token

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-1.3-08  
**AC Covered:** AC-1.3-03

### Description
Xác minh dù chọn lại đúng tenant hiện tại, hệ thống vẫn rotate refresh token và trả access token mới.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login và lấy tenant hiện tại từ `GET /api/identity/workspaces` (`isCurrentTenant = true`) | Có `currentTenantId` |
| 2 | Gọi `POST /api/identity/workspaces/{currentTenantId}/select` với refresh token hiện tại | HTTP `200 OK` |
| 3 | So sánh token trước/sau | Refresh token mới khác refresh token cũ |
