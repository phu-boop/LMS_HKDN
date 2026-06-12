# System Test Cases: Task 1.1 — Identifier-First Login Flow

**Module:** Identity  
**Status:** Updated  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [docs/mockup/Admin/id.lms.vn.html]  
**Id:** ST-IDENTITY-1.1  
**Branch:** `feat/identifier_first_login_flow`

---

## Scope
- Task 1.1 — Identifier-First Login Flow: bước nhập định danh (email/username) trước bước nhập mật khẩu
  - **Identify step** (`POST /api/identity/identify`): nhận `identifier`, chỉ trả về `{ nextStep: "PASSWORD" }` — **không** trả `tenantBranding`, **không** nhận `domain`
  - **Login step** (`POST /api/identity/auth/login`): sau khi xác thực thành công, trả về token và `tenantBranding` nếu user thuộc đúng 1 tenant
  - Nếu user thuộc 1 tenant duy nhất → login response có white-label branding
  - Nếu là LMS_ADMIN hoặc multi-tenant user → login response có `tenantBranding: null`
  - Identifier không tồn tại → **không tiết lộ** — vẫn trả `200 PASSWORD` ở bước identify
  - Identifier rỗng → `400 VALIDATION_ERROR`

> **Lý do thay đổi thiết kế:** Bước identify trước đây trả về `tenantBranding` ngay khi nhập username — điều này lộ thông tin tenant của user. Thiết kế mới chỉ trả branding sau khi login thành công.

---

## Prerequisites

- API đang chạy tại `http://localhost:5294`
- DB đã apply migration V1–V7
- Seed users từ `V2__seed_dev.sql`:

| Username | Password | Role | Tenant | Ghi chú |
|---|---|---|---|---|
| `superadmin` | `Admin@123` | `LMS_ADMIN` | PLATFORM | Bypass mọi permission check |
| `stem_admin` | `Admin@123` | `TENANT_ADMIN` | STEM | Chỉ thuộc 1 tenant (STEM) |
| `teacher01` | `Admin@123` | `TEACHER` | STEM | Chỉ thuộc 1 tenant (STEM) |

- **Không cần token** cho `/api/identity/identify` — endpoint là public (`AllowAnonymous`).
- `/api/identity/auth/login` cũng là public (không cần token).
- Chuẩn bị sẵn `jq` để parse JSON response:
  ```bash
  brew install jq
  ```

---

## Acceptance Criteria Index

- `AC-1.1-01`: Identify step nhận email/username, trả về `{ nextStep: "PASSWORD" }` và không tiết lộ branding
- `AC-1.1-02`: Login step: nếu user thuộc 1 tenant → response có white-label branding
- `AC-1.1-03`: Login step: nếu là LMS_ADMIN hoặc multi-tenant user → `tenantBranding: null`
- `AC-1.1-04`: Email/username không tồn tại tại bước identify → trả về `200 nextStep=PASSWORD`, không tiết lộ user có tồn tại hay không

---

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | API | Acceptance Criteria Covered |
| :--- | :--- | :--- | :--- |
| TC-1.1-01 | Identifier rỗng → 400 VALIDATION_ERROR | Identify | AC-1.1-01 |
| TC-1.1-02 | Identifier chỉ có khoảng trắng → 400 VALIDATION_ERROR | Identify | AC-1.1-01 |
| TC-1.1-03 | Identifier không tồn tại → 200 PASSWORD, không lộ user existence | Identify | AC-1.1-04 |
| TC-1.1-04 | User đã bị soft-delete → 200 PASSWORD, không lộ user existence | Identify | AC-1.1-04 |
| TC-1.1-05 | nextStep luôn là `PASSWORD` với mọi loại user | Identify | AC-1.1-01 |
| TC-1.1-06 | Identify response shape: chỉ có `nextStep`, không có `tenantBranding` | Identify | AC-1.1-01 |
| TC-1.1-07 | Login: single-tenant TEACHER → white-label branding trong response | Login | AC-1.1-02 |
| TC-1.1-08 | Login: single-tenant TENANT_ADMIN → white-label branding trong response | Login | AC-1.1-02 |
| TC-1.1-09 | Login: LMS_ADMIN → `tenantBranding` là `null` | Login | AC-1.1-03 |
| TC-1.1-10 | Login: response shape đầy đủ khi có branding | Login | AC-1.1-02 |
| TC-1.1-11 | Login: `isWhiteLabel = true` khi single-tenant user | Login | AC-1.1-02 |
| TC-1.1-12 | Login: không có sub-field branding khi `tenantBranding = null` | Login | AC-1.1-03 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `4`
- Tổng số Test Case: `12`
- AC có coverage:
  - AC-1.1-01: TC-01, TC-02, TC-05, TC-06
  - AC-1.1-02: TC-07, TC-08, TC-10, TC-11
  - AC-1.1-03: TC-09, TC-12
  - AC-1.1-04: TC-03, TC-04
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-1.1-01 — Identifier rỗng → 400 VALIDATION_ERROR

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.1-01  
**AC Covered:** AC-1.1-01

### Description
Gửi request với `identifier` là chuỗi rỗng. Kỳ vọng server từ chối với HTTP 400.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/identify` với body `{"identifier": ""}` | HTTP 400 Bad Request |
| 2 | Kiểm tra body response có field `code` | `code = "VALIDATION_ERROR"` |
| 3 | Kiểm tra body response có field `message` | Có nội dung mô tả lỗi validation |

### Test Data
```bash
curl -i -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": ""}'
```

### Expected Response
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Identifier is required."
}
```

---

## Test Case: TC-1.1-02 — Identifier chỉ có khoảng trắng → 400 VALIDATION_ERROR

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-1.1-02  
**AC Covered:** AC-1.1-01

### Description
Gửi request với `identifier` chỉ gồm khoảng trắng. Server phải xử lý như chuỗi rỗng và từ chối.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/identify` với body `{"identifier": "   "}` | HTTP 400 Bad Request |
| 2 | Kiểm tra body response | `code = "VALIDATION_ERROR"` |

### Test Data
```bash
curl -i -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "   "}'
```

---

## Test Case: TC-1.1-03 — Identifier không tồn tại → 200, không lộ user existence

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-1.1-03  
**AC Covered:** AC-1.1-04

### Description
Gửi identifier không tồn tại trong DB. Server không được trả về error hay hint nào về việc user không tồn tại. Response phải giống user hợp lệ ở bước identify.

### Precondition
- API đang chạy tại `http://localhost:5294`.
- `ghost_user_xyz_99999` chắc chắn không có trong DB.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/identify` với body `{"identifier": "ghost_user_xyz_99999"}` | HTTP 200 OK |
| 2 | Kiểm tra body response không có field `error`, `code`, `tenantBranding` | Không có các field này |
| 3 | Kiểm tra field `nextStep` | `nextStep = "PASSWORD"` |
| 4 | So sánh response này với response của TC-1.1-05 | Cấu trúc JSON giống nhau — không phân biệt được user tồn tại hay không |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "ghost_user_xyz_99999"}' | jq .

curl -s -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "teacher01"}' | jq .
```

### Expected Response
```json
{
  "nextStep": "PASSWORD"
}
```

---

## Test Case: TC-1.1-04 — User bị soft-delete → 200, không lộ user existence

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-1.1-04  
**AC Covered:** AC-1.1-04

### Description
User bị soft-delete không được xác nhận hay phủ nhận existence ở bước identify. Login mới là bước trả lỗi xác thực.

### Precondition
- API đang chạy tại `http://localhost:5294`.
- Cần tạo user soft-deleted để test:
  ```bash
  LMS_TOKEN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"superadmin","password":"Admin@123"}' | jq -r '.accessToken')

  DELETED_USER_ID=$(curl -s -X POST http://localhost:5294/api/admin/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LMS_TOKEN" \
    -d '{"username":"deleted_test_user","fullName":"Deleted Test","accountType":"TEACHER","password":"Test@123"}' \
    | jq -r '.id')

  curl -s -X DELETE "http://localhost:5294/api/admin/users/$DELETED_USER_ID" \
    -H "Authorization: Bearer $LMS_TOKEN"
  ```

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/identify` với body `{"identifier": "deleted_test_user"}` | HTTP 200 OK |
| 2 | Kiểm tra body response không có error và không có `tenantBranding` | Không có các field này |
| 3 | Kiểm tra field `nextStep` | `nextStep = "PASSWORD"` |
| 4 | Thử login với user bị xóa | `POST /api/identity/auth/login` trả về `401 INVALID_CREDENTIALS` |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "deleted_test_user"}' | jq .
```

---

## Test Case: TC-1.1-05 — nextStep luôn là `PASSWORD` với user hợp lệ

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-05  
**AC Covered:** AC-1.1-01

### Description
Xác minh `nextStep` luôn có giá trị `PASSWORD` với mọi loại user hợp lệ.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi identify với `superadmin` | `nextStep = "PASSWORD"` |
| 2 | Gửi identify với `stem_admin` | `nextStep = "PASSWORD"` |
| 3 | Gửi identify với `teacher01` | `nextStep = "PASSWORD"` |

### Test Data
```bash
for USER in superadmin stem_admin teacher01; do
  echo "=== $USER ==="
  curl -s -X POST http://localhost:5294/api/identity/identify \
    -H "Content-Type: application/json" \
    -d "{\"identifier\": \"$USER\"}" | jq '.nextStep'
done
```

### Expected Response
Tất cả đều trả về `"PASSWORD"`.

---

## Test Case: TC-1.1-06 — Identify response shape: chỉ có `nextStep`

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Contract Test  
**Id:** TC-1.1-06  
**AC Covered:** AC-1.1-01

### Description
Xác minh response của `/api/identity/identify` chỉ còn field `nextStep`, không còn `tenantBranding`, `domain`, `tenantId` hay field nhạy cảm khác.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi identify với `teacher01` | HTTP 200 OK |
| 2 | Kiểm tra response có đúng 1 key là `nextStep` | Đúng |
| 3 | Kiểm tra response không có `tenantBranding`, `tenantId`, `isAdminDomain` | Không tồn tại |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "teacher01"}' | jq 'keys'
```

### Expected Response
```json
{
  "nextStep": "PASSWORD"
}
```

---

## Test Case: TC-1.1-07 — Login: single-tenant TEACHER → white-label branding trong response

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-07  
**AC Covered:** AC-1.1-02

### Description
User `teacher01` chỉ thuộc 1 tenant. Sau khi login thành công, response phải có `tenantBranding` của tenant đó.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/auth/login` với `teacher01` và password đúng | HTTP 200 OK |
| 2 | Kiểm tra response có `accessToken`, `refreshToken`, `expiresIn` | Có đầy đủ |
| 3 | Kiểm tra `tenantBranding` không phải `null` | Có giá trị |
| 4 | Kiểm tra `tenantBranding.tenantCode` và `tenantBranding.name` | Trùng tenant STEM |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq .
```

---

## Test Case: TC-1.1-08 — Login: single-tenant TENANT_ADMIN → white-label branding trong response

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-08  
**AC Covered:** AC-1.1-02

### Description
User `stem_admin` cũng chỉ thuộc 1 tenant. Role khác nhưng không phải `LMS_ADMIN`, nên login response vẫn phải có white-label branding.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/auth/login` với `stem_admin` và password đúng | HTTP 200 OK |
| 2 | Kiểm tra `tenantBranding` không phải `null` | Có giá trị |
| 3 | Kiểm tra `tenantBranding.isWhiteLabel` | `true` |
| 4 | So sánh với TC-1.1-07 | Cùng tenant STEM — branding tương ứng giống nhau |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"stem_admin","password":"Admin@123"}' | jq .
```

---

## Test Case: TC-1.1-09 — Login: LMS_ADMIN → `tenantBranding` là `null`

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-09  
**AC Covered:** AC-1.1-03

### Description
User `superadmin` có role `LMS_ADMIN`. Login thành công nhưng không được áp white-label branding.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/identity/auth/login` với `superadmin` và password đúng | HTTP 200 OK |
| 2 | Kiểm tra `tenantBranding` | `null` |
| 3 | Kiểm tra token fields | Vẫn có `accessToken`, `refreshToken`, `expiresIn` |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}' | jq .
```

### Expected Response
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "tenantBranding": null,
  "tokenType": "Bearer"
}
```

---

## Test Case: TC-1.1-10 — Login response shape đầy đủ khi có branding

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Contract Test  
**Id:** TC-1.1-10  
**AC Covered:** AC-1.1-02

### Description
Xác minh login response khi có branding chứa đủ các field contract mới và không còn field nội bộ bị lộ.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login với `teacher01` | HTTP 200 OK |
| 2 | Kiểm tra các field top-level: `accessToken`, `refreshToken`, `expiresIn`, `tenantBranding`, `tokenType` | Có đầy đủ |
| 3 | Kiểm tra `tenantBranding` có đủ: `tenantCode`, `name`, `subdomain`, `domain`, `isWhiteLabel`, `logoUrl`, `avatarUrl`, `watermarkSettings` | Có đầy đủ |
| 4 | Kiểm tra response không có `tenantId`, `isAdminDomain`, `passwordHash`, `failedLoginCount` | Không tồn tại |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq 'keys, .tenantBranding | keys?'
```

---

## Test Case: TC-1.1-11 — Login: `isWhiteLabel = true` khi single-tenant user

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-11  
**AC Covered:** AC-1.1-02

### Description
Xác minh cờ `isWhiteLabel` được set đúng cho single-tenant user sau khi login thành công.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login với `teacher01` | `tenantBranding.isWhiteLabel = true` |
| 2 | Login với `stem_admin` | `tenantBranding.isWhiteLabel = true` |

### Test Data
```bash
for USER in teacher01 stem_admin; do
  echo "=== $USER ==="
  curl -s -X POST http://localhost:5294/api/identity/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USER\",\"password\":\"Admin@123\"}" | jq '.tenantBranding.isWhiteLabel'
done
```

### Expected Result
Cả hai đều trả về `true`.

---

## Test Case: TC-1.1-12 — Login: không có sub-field branding khi `tenantBranding = null`

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.1-12  
**AC Covered:** AC-1.1-03

### Description
Xác minh khi `tenantBranding` là `null`, response không có object branding con nào để frontend hiểu rằng phải dùng system branding mặc định.

### Precondition
- API đang chạy tại `http://localhost:5294`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login với `superadmin` | HTTP 200 OK |
| 2 | Kiểm tra `.tenantBranding` | `null` |
| 3 | Kiểm tra `.tenantBranding.isWhiteLabel` bằng `jq` | Kết quả là `null` |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}' | jq '.tenantBranding, .tenantBranding.isWhiteLabel'
```

### Expected Result
```text
null
null
```
