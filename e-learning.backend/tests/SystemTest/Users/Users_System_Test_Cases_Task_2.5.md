# System Test Cases: Task 2.5 - Quản lý Tài khoản Người dùng

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [docs/mockup/Admin/CreateUser.html]  
**Id:** ST-USERS-2.5  

## Scope
- Task 2.5 — Quản lý Tài khoản Người dùng: tạo / sửa / khóa tài khoản, quản lý accountType, reset password, audit log

## Acceptance Criteria Index

- `AC-2.5-01`: Tạo / sửa / khóa tài khoản user
- `AC-2.5-02`: Quản lý các trường: username, password, họ tên, email, avatar, loại tài khoản (`accountType`), trạng thái
- `AC-2.5-03`: Phân loại tài khoản: `LMS_ADMIN`, `TENANT_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`
- `AC-2.5-04`: Ghi audit log khi tạo / sửa / khóa / reset password

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.5-01 | Tạo user mới đầy đủ thông tin (TEACHER có school) | AC-2.5-01, AC-2.5-02, AC-2.5-03 |
| TC-2.5-02 | Tạo user LMS_ADMIN không có schoolId | AC-2.5-01, AC-2.5-03 |
| TC-2.5-03 | Tạo user với username trùng trong cùng trường | AC-2.5-01 |
| TC-2.5-04 | Tạo user thiếu trường bắt buộc | AC-2.5-02 |
| TC-2.5-05 | Xem danh sách user (filter theo accountType, status, search) | AC-2.5-01, AC-2.5-02, AC-2.5-03 |
| TC-2.5-06 | Xem chi tiết user theo ID | AC-2.5-01, AC-2.5-02 |
| TC-2.5-07 | Xem user không tồn tại (404) | AC-2.5-01 |
| TC-2.5-08 | Cập nhật thông tin user (fullName, email, accountType) | AC-2.5-01, AC-2.5-02, AC-2.5-04 |
| TC-2.5-09 | Khóa tài khoản user (PATCH status = LOCKED) | AC-2.5-01, AC-2.5-04 |
| TC-2.5-10 | Mở khóa tài khoản user (PATCH status = ACTIVE) | AC-2.5-01, AC-2.5-04 |
| TC-2.5-11 | Đổi trạng thái sang INACTIVE | AC-2.5-01, AC-2.5-04 |
| TC-2.5-12 | Reset mật khẩu user | AC-2.5-02, AC-2.5-04 |
| TC-2.5-13 | Reset mật khẩu user không tồn tại (404) | AC-2.5-02 |
| TC-2.5-14 | Reset mật khẩu với password rỗng (400) | AC-2.5-02 |
| TC-2.5-15 | Xóa (soft-delete) user | AC-2.5-01 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `4`
- Tổng số Test Case: `15`
- AC có coverage:
  - AC-2.5-01: TC-01 đến TC-03, TC-05 đến TC-11, TC-15
  - AC-2.5-02: TC-01 đến TC-02, TC-04 đến TC-06, TC-08, TC-12 đến TC-14
  - AC-2.5-03: TC-01 đến TC-03, TC-05
  - AC-2.5-04: TC-08, TC-09, TC-10, TC-11, TC-12
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-2.5-01 - Tạo user mới đầy đủ thông tin (TEACHER có school)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-01  
**AC Covered:** AC-2.5-01, AC-2.5-02, AC-2.5-03  

### Description
Xác minh LMS Admin có thể tạo user loại TEACHER với đầy đủ thông tin và gắn vào một trường học.

### Precondition
- Đã đăng nhập với quyền `USERS_CREATE`.
- Đã có `schoolId` hợp lệ của một trường ACTIVE.

### Test Data
```json
POST /api/admin/users
{
  "schoolId": "{schoolId}",
  "username": "teacher01",
  "password": "Teacher@123",
  "fullName": "Nguyễn Văn A",
  "email": "teacher01@school.edu.vn",
  "accountType": "TEACHER"
}
```

### Test Steps
1. Gọi `POST /api/admin/users` với body trên.

### Expected Result
- HTTP `201 Created`.
- Body chứa: `userId` (GUID), `username: "teacher01"`, `fullName: "Nguyễn Văn A"`, `email: "teacher01@school.edu.vn"`, `accountType: "TEACHER"`.
- Gọi lại `GET /api/admin/users/{userId}` → trả về đúng thông tin vừa tạo, `status: "ACTIVE"`.

### Postcondition
- Ghi nhớ `{userId}` để dùng cho TC tiếp theo.

---

## Test Case: TC-2.5-02 - Tạo user LMS_ADMIN không có schoolId

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-02  
**AC Covered:** AC-2.5-01, AC-2.5-03  

### Description
Xác minh có thể tạo tài khoản LMS_ADMIN mà không cần gắn schoolId (null).

### Precondition
- Đã đăng nhập với quyền `USERS_CREATE`.

### Test Data
```json
POST /api/admin/users
{
  "schoolId": null,
  "username": "lms.admin02",
  "password": "LmsAdmin@123",
  "fullName": "LMS Admin 02",
  "email": "lms.admin02@system.vn",
  "accountType": "LMS_ADMIN"
}
```

### Test Steps
1. Gọi `POST /api/admin/users` với body trên.

### Expected Result
- HTTP `201 Created`.
- Body chứa: `username: "lms.admin02"`, `accountType: "LMS_ADMIN"`.
- `schoolId` trong response là `null`.
- Gọi `GET /api/admin/users/{userId}` → `accountType: "LMS_ADMIN"`, `schoolId: null`.

---

## Test Case: TC-2.5-03 - Tạo user với username trùng trong cùng trường

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-2.5-03  
**AC Covered:** AC-2.5-01  

### Description
Xác minh hệ thống từ chối tạo user nếu username đã tồn tại trong cùng trường.

### Precondition
- User `teacher01` đã tồn tại ở trường `{schoolId}` (xem TC-2.5-01).

### Test Data
```json
POST /api/admin/users
{
  "schoolId": "{schoolId}",
  "username": "teacher01",
  "password": "NewPass@123",
  "fullName": "Người khác",
  "accountType": "TEACHER"
}
```

### Test Steps
1. Gọi `POST /api/admin/users` với body trên.

### Expected Result
- HTTP `409 Conflict`.
- Body chứa `error` với nội dung đề cập `"teacher01"` và `"already exists"`.

---

## Test Case: TC-2.5-04 - Tạo user thiếu trường bắt buộc

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.5-04  
**AC Covered:** AC-2.5-02  

### Description
Xác minh server trả lỗi validation khi thiếu `username`, `password`, hoặc `fullName`.

### Test Data
```json
POST /api/admin/users
{
  "schoolId": "{schoolId}",
  "username": "",
  "password": "Pass@123",
  "fullName": ""
}
```

### Test Steps
1. Gọi `POST /api/admin/users` với username và fullName rỗng.

### Expected Result
- HTTP `400 Bad Request`.
- Body chứa thông tin validation error.

---

## Test Case: TC-2.5-05 - Xem danh sách user (filter theo accountType, status, search)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-05  
**AC Covered:** AC-2.5-01, AC-2.5-02, AC-2.5-03  

### Description
Xác minh endpoint danh sách user hỗ trợ filter theo `accountType`, `status`, `search`, `schoolId` và phân trang.

### Precondition
- Có ít nhất 1 user TEACHER và 1 user LMS_ADMIN trong hệ thống.

### Test Steps
1. `GET /api/admin/users?accountType=TEACHER&status=ACTIVE&page=1&pageSize=10`
2. `GET /api/admin/users?schoolId={schoolId}&search=teacher01&page=1&pageSize=10`
3. `GET /api/admin/users?page=1&pageSize=10` (không filter — liệt kê tất cả)

### Expected Result
**Step 1:**
- HTTP `200 OK`.
- `items` chỉ chứa user có `accountType: "TEACHER"` và `status: "ACTIVE"`.
- Response chứa `totalCount`, `page`, `pageSize`.

**Step 2:**
- HTTP `200 OK`.
- `items` chứa user `teacher01` từ trường `{schoolId}`.

**Step 3:**
- HTTP `200 OK`.
- Trả về tất cả user với phân trang.

---

## Test Case: TC-2.5-06 - Xem chi tiết user theo ID

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-06  
**AC Covered:** AC-2.5-01, AC-2.5-02  

### Description
Xác minh lấy đúng thông tin chi tiết user theo `userId`.

### Precondition
- Đã có `{userId}` từ TC-2.5-01.

### Test Steps
1. Gọi `GET /api/admin/users/{userId}`.

### Expected Result
- HTTP `200 OK`.
- Body chứa: `id`, `username`, `fullName`, `email`, `accountType`, `status`, `schoolId`.
- Không chứa `password_hash`.

---

## Test Case: TC-2.5-07 - Xem user không tồn tại (404)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.5-07  
**AC Covered:** AC-2.5-01  

### Description
Xác minh hệ thống trả `404 Not Found` khi userId không tồn tại.

### Test Data
```
GET /api/admin/users/00000000-0000-0000-0000-000000000000
```

### Test Steps
1. Gọi endpoint với GUID không hợp lệ.

### Expected Result
- HTTP `404 Not Found`.

---

## Test Case: TC-2.5-08 - Cập nhật thông tin user (fullName, email, accountType)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-08  
**AC Covered:** AC-2.5-01, AC-2.5-02, AC-2.5-04  

### Description
Xác minh LMS Admin có thể cập nhật fullName, email, accountType của user và hệ thống ghi audit log.

### Precondition
- Đã có `{userId}` từ TC-2.5-01.
- Đã đăng nhập với quyền `USERS_UPDATE`.

### Test Data
```json
PUT /api/admin/users/{userId}
{
  "fullName": "Nguyễn Văn A (Updated)",
  "email": "teacher01.updated@school.edu.vn",
  "status": "ACTIVE",
  "accountType": "SCHOOL_ADMIN"
}
```

### Test Steps
1. Gọi `PUT /api/admin/users/{userId}` với body trên.
2. Gọi `GET /api/admin/users/{userId}` để xác nhận.

### Expected Result
**Step 1:**
- HTTP `200 OK`.
- Body trả về `fullName: "Nguyễn Văn A (Updated)"`, `accountType: "SCHOOL_ADMIN"`.

**Step 2:**
- Thông tin user đã cập nhật đúng.

### Audit Log
- Ghi nhớ: trong bảng `audit_log`, xuất hiện bản ghi với `action = "USER_UPDATED"`, `entity_id = {userId}`.

---

## Test Case: TC-2.5-09 - Khóa tài khoản user (PATCH status = LOCKED)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-09  
**AC Covered:** AC-2.5-01, AC-2.5-04  

### Description
Xác minh LMS Admin có thể khóa tài khoản user và hệ thống ghi audit log.

### Precondition
- Đã có `{userId}` từ TC-2.5-01, đang ACTIVE.
- Đã đăng nhập với quyền `USERS_CHANGE_STATUS`.

### Test Data
```json
PATCH /api/admin/users/{userId}/status
{
  "status": "LOCKED"
}
```

### Test Steps
1. Gọi `PATCH /api/admin/users/{userId}/status` với `status: "LOCKED"`.
2. Gọi `GET /api/admin/users/{userId}` để xác nhận.

### Expected Result
**Step 1:** HTTP `204 No Content`.  
**Step 2:** `status: "LOCKED"`.

### Audit Log
- Bảng `audit_log`: `action = "USER_STATUS_CHANGED"`, `metadata` chứa `"LOCKED"`.

---

## Test Case: TC-2.5-10 - Mở khóa tài khoản user (PATCH status = ACTIVE)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-10  
**AC Covered:** AC-2.5-01, AC-2.5-04  

### Description
Xác minh LMS Admin có thể mở khóa tài khoản user đang LOCKED.

### Precondition
- User `{userId}` đang có status `LOCKED` (xem TC-2.5-09).

### Test Data
```json
PATCH /api/admin/users/{userId}/status
{
  "status": "ACTIVE"
}
```

### Test Steps
1. Gọi `PATCH /api/admin/users/{userId}/status` với `status: "ACTIVE"`.
2. Gọi `GET /api/admin/users/{userId}`.

### Expected Result
**Step 1:** HTTP `204 No Content`.  
**Step 2:** `status: "ACTIVE"`.

### Audit Log
- Bảng `audit_log`: `action = "USER_STATUS_CHANGED"`, `metadata` chứa `"ACTIVE"`.

---

## Test Case: TC-2.5-11 - Đổi trạng thái sang INACTIVE

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.5-11  
**AC Covered:** AC-2.5-01, AC-2.5-04  

### Description
Xác minh LMS Admin có thể đổi trạng thái user sang INACTIVE.

### Precondition
- User `{userId}` đang ACTIVE.

### Test Data
```json
PATCH /api/admin/users/{userId}/status
{ "status": "INACTIVE" }
```

### Test Steps
1. Gọi `PATCH /api/admin/users/{userId}/status` với `status: "INACTIVE"`.
2. Gọi `GET /api/admin/users/{userId}`.

### Expected Result
**Step 1:** HTTP `204 No Content`.  
**Step 2:** `status: "INACTIVE"`.

---

## Test Case: TC-2.5-12 - Reset mật khẩu user

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.5-12  
**AC Covered:** AC-2.5-02, AC-2.5-04  

### Description
Xác minh LMS Admin có thể reset mật khẩu user. Sau khi reset, `failed_login_count` về 0 và `locked_until` về NULL. Audit log được ghi.

### Precondition
- Đã có `{userId}` từ TC-2.5-01.
- Đã đăng nhập với quyền `USERS_UPDATE`.

### Test Data
```json
POST /api/admin/users/{userId}/reset-password
{
  "newPassword": "NewPass@2026"
}
```

### Test Steps
1. Gọi `POST /api/admin/users/{userId}/reset-password` với body trên.
2. (Optional) Kiểm tra DB trực tiếp: `SELECT failed_login_count, locked_until FROM user_account WHERE id = '{userId}'`.
3. Thử đăng nhập với mật khẩu cũ → phải thất bại.
4. Thử đăng nhập với mật khẩu mới → phải thành công.

### Expected Result
**Step 1:** HTTP `204 No Content`.  
**Step 2:** `failed_login_count = 0`, `locked_until = NULL`.  
**Step 3:** Đăng nhập với mật khẩu cũ → `401 Unauthorized`.  
**Step 4:** Đăng nhập với mật khẩu mới → `200 OK`, nhận được access token.

### Audit Log
- Bảng `audit_log`: `action = "USER_PASSWORD_RESET"`, `entity_id = {userId}`.

---

## Test Case: TC-2.5-13 - Reset mật khẩu user không tồn tại (404)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.5-13  
**AC Covered:** AC-2.5-02  

### Description
Xác minh hệ thống trả `404 Not Found` khi reset mật khẩu cho userId không tồn tại.

### Test Data
```json
POST /api/admin/users/00000000-0000-0000-0000-000000000000/reset-password
{
  "newPassword": "SomePass@123"
}
```

### Test Steps
1. Gọi endpoint với GUID không hợp lệ.

### Expected Result
- HTTP `404 Not Found`.

---

## Test Case: TC-2.5-14 - Reset mật khẩu với password rỗng (400)

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.5-14  
**AC Covered:** AC-2.5-02  

### Description
Xác minh hệ thống trả `400 Bad Request` khi `newPassword` rỗng hoặc chỉ có khoảng trắng.

### Test Data
```json
POST /api/admin/users/{userId}/reset-password
{
  "newPassword": "   "
}
```

### Test Steps
1. Gọi `POST /api/admin/users/{userId}/reset-password` với `newPassword: "   "`.

### Expected Result
- HTTP `400 Bad Request`.
- Body chứa `error` đề cập đến `password`.

---

## Test Case: TC-2.5-15 - Xóa (soft-delete) user

**Module:** Users  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.5-15  
**AC Covered:** AC-2.5-01  

### Description
Xác minh LMS Admin có thể soft-delete user. Sau khi xóa, user không còn xuất hiện trong danh sách và `GET /{userId}` trả 404.

### Precondition
- Đã có `{userId}` của một user không phải user đang dùng để test.
- Đã đăng nhập với quyền `USERS_DELETE`.

### Test Data
```
DELETE /api/admin/users/{userId}
```

### Test Steps
1. Gọi `DELETE /api/admin/users/{userId}`.
2. Gọi `GET /api/admin/users/{userId}`.
3. Gọi `GET /api/admin/users?search={username}` để kiểm tra không còn xuất hiện.

### Expected Result
**Step 1:** HTTP `204 No Content`.  
**Step 2:** HTTP `404 Not Found`.  
**Step 3:** `totalCount = 0` hoặc user không có trong `items`.

### Note
- Soft-delete: bản ghi vẫn còn trong DB với `is_deleted = TRUE`, `status = "DELETED"`.
- Không thể khôi phục qua API (irreversible).
