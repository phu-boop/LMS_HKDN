# System Test Cases: Task 1.2 - Authentication (Password + Token)

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [docs/mockup/Admin/id.lms.vn.html]  
**Id:** ST-IDENTITY-1.2  
**Branch:** `feat/authentication`

---

## Scope
- Task 1.2 - Authentication: xác thực mật khẩu, cấp token, kiểm tra trạng thái tài khoản/trường học, brute-force lockout, ghi audit log.
- API trong code hiện tại:
  - `POST /api/identity/auth/login`
  - `POST /api/identity/auth/refresh` (task ghi `refresh-token`, implementation thực tế là `refresh`)
  - `POST /api/identity/auth/logout`
  - `POST /api/identity/auth/change-password`

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

- (Khuyến nghị) Có quyền truy vấn DB để verify audit log:

```bash
docker exec -it <DB_CONTAINER> psql -U <DB_USER> -d <DB_NAME>
```

---

## Acceptance Criteria Index

- `AC-1.2-01`: Đăng nhập thành công trả về `access_token` + `refresh_token`
- `AC-1.2-02`: Tài khoản bị khóa hoặc trường hết hạn hợp đồng -> từ chối với thông báo rõ ràng
- `AC-1.2-03`: Brute-force protection: khóa tạm thời sau N lần sai liên tiếp
- `AC-1.2-04`: Ghi audit log mỗi lần login thành công/thất bại
- `AC-1.2-05`: Đổi mật khẩu -> tự động thu hồi tất cả session khác, ghi audit log `PASSWORD_CHANGED`

---

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | API | Acceptance Criteria Covered |
| :--- | :--- | :--- | :--- |
| TC-1.2-01 | Login thành công trả access token + refresh token | Login | AC-1.2-01 |
| TC-1.2-02 | Login sai mật khẩu -> 401 INVALID_CREDENTIALS | Login | AC-1.2-03, AC-1.2-04 |
| TC-1.2-03 | Tài khoản LOCKED -> 403 ACCOUNT_LOCKED | Login | AC-1.2-02 |
| TC-1.2-04 | Trường hết hạn hợp đồng -> 403 SCHOOL_CONTRACT_EXPIRED | Login | AC-1.2-02, AC-1.2-04 |
| TC-1.2-05 | Brute-force: sai liên tiếp đến ngưỡng -> 429 TEMPORARILY_LOCKED | Login | AC-1.2-03, AC-1.2-04 |
| TC-1.2-06 | Đang trong thời gian lockout -> 429 + retryAfterSeconds | Login | AC-1.2-03 |
| TC-1.2-07 | Refresh token hợp lệ -> access token mới + refresh token rotate | Refresh | AC-1.2-01 |
| TC-1.2-08 | Refresh token không hợp lệ -> 401 INVALID_REFRESH_TOKEN | Refresh | AC-1.2-01 |
| TC-1.2-09 | Logout -> revoke session, refresh cũ dùng lại phải fail | Logout + Refresh | AC-1.2-01 |
| TC-1.2-10 | Audit log LOGIN_SUCCESS được ghi sau login thành công | Login + DB | AC-1.2-04 |
| TC-1.2-11 | Audit log LOGIN_FAILED được ghi sau login thất bại | Login + DB | AC-1.2-04 |
| TC-1.2-12 | Change password thành công -> revoke các session khác | Change Password + Refresh | AC-1.2-05 |
| TC-1.2-13 | Change password sai current password -> không đổi mật khẩu, không revoke session | Change Password | AC-1.2-05 |
| TC-1.2-14 | Audit log PASSWORD_CHANGED được ghi sau đổi mật khẩu thành công | Change Password + DB | AC-1.2-05 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `5`
- Tổng số Test Case: `14`
- AC có coverage:
  - AC-1.2-01: TC-01, TC-07, TC-08, TC-09
  - AC-1.2-02: TC-03, TC-04
  - AC-1.2-03: TC-02, TC-05, TC-06
  - AC-1.2-04: TC-02, TC-04, TC-05, TC-10, TC-11
  - AC-1.2-05: TC-12, TC-13, TC-14
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-1.2-01 - Login thành công trả access token + refresh token

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.2-01  
**AC Covered:** AC-1.2-01

### Description
Xác minh user hợp lệ login thành công và response có đủ token fields.

### Precondition
- API đang chạy tại `http://localhost:5294`
- User `teacher01 / Admin@123` tồn tại và đang `ACTIVE`

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/identity/auth/login` với username/password hợp lệ | HTTP `200 OK` |
| 2 | Kiểm tra body response | Có `accessToken`, `refreshToken`, `expiresIn`, `tokenType = Bearer` |
| 3 | Kiểm tra token không rỗng | `accessToken` và `refreshToken` là string khác rỗng |

### Test Data
```bash
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq .
```

---

## Test Case: TC-1.2-02 - Login sai mật khẩu -> 401 INVALID_CREDENTIALS

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.2-02  
**AC Covered:** AC-1.2-03, AC-1.2-04

### Description
Xác minh hệ thống trả lỗi generic khi sai mật khẩu và không cấp token.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/identity/auth/login` với mật khẩu sai | HTTP `401 Unauthorized` (hoặc `429` nếu chạm lockout) |
| 2 | Kiểm tra body response | `code = INVALID_CREDENTIALS` (hoặc `TEMPORARILY_LOCKED` nếu tới ngưỡng) |
| 3 | Kiểm tra response không có token | Không có `accessToken`, `refreshToken` |

### Test Data
```bash
curl -i -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"WrongPass@123"}'
```

---

## Test Case: TC-1.2-03 - Tài khoản LOCKED -> 403 ACCOUNT_LOCKED

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.2-03  
**AC Covered:** AC-1.2-02

### Description
Xác minh tài khoản có status `LOCKED` bị từ chối login.

### Precondition
- Có user test với `status = LOCKED`

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login bằng user LOCKED | HTTP `403 Forbidden` |
| 2 | Kiểm tra lỗi | `code = ACCOUNT_LOCKED` |
| 3 | Kiểm tra message | Message rõ ràng về account bị khóa |

---

## Test Case: TC-1.2-04 - Trường hết hạn hợp đồng -> 403 SCHOOL_CONTRACT_EXPIRED

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.2-04  
**AC Covered:** AC-1.2-02, AC-1.2-04

### Description
Xác minh user thuộc trường đã hết hạn hợp đồng (và `enforce_expiry = true`) bị từ chối login với thông báo rõ ràng.

### Precondition
- Mapping của school đang test có `contract_end < CURRENT_DATE`, `enforce_expiry = true`, `status = ACTIVE`

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi login với user thuộc school đã hết hạn | HTTP `403 Forbidden` |
| 2 | Kiểm tra body response | `code = SCHOOL_CONTRACT_EXPIRED` |
| 3 | Kiểm tra message | Có thông báo trường/hợp đồng đã hết hạn |

### Test Data (chuẩn bị dữ liệu tạm)
```sql
UPDATE school_tenant_mapping
SET contract_end = CURRENT_DATE - INTERVAL '1 day',
    enforce_expiry = TRUE,
    updated_at = NOW()
WHERE school_id = '<teacher_school_id>'
  AND status = 'ACTIVE'
  AND is_deleted = FALSE;
```

---

## Test Case: TC-1.2-05 - Brute-force: sai liên tiếp đến ngưỡng -> 429 TEMPORARILY_LOCKED

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-1.2-05  
**AC Covered:** AC-1.2-03, AC-1.2-04

### Description
Xác minh user bị khóa tạm thời sau N lần sai liên tiếp (theo cấu hình `MaxFailedLoginAttempts`).

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login sai mật khẩu liên tiếp N-1 lần | HTTP `401`, `code = INVALID_CREDENTIALS` |
| 2 | Login sai lần thứ N | HTTP `429 Too Many Requests` |
| 3 | Kiểm tra lỗi lần N | `code = TEMPORARILY_LOCKED` + `retryAfterSeconds` |

### Test Data
```bash
for i in {1..5}; do
  curl -s -o /tmp/login_fail_$i.json -w "Attempt $i -> HTTP %{http_code}\n" \
    -X POST http://localhost:5294/api/identity/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"teacher01","password":"WrongPass@123"}'
done

cat /tmp/login_fail_5.json | jq .
```

---

## Test Case: TC-1.2-06 - Đang lockout -> 429 + retryAfterSeconds

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Security Test  
**Id:** TC-1.2-06  
**AC Covered:** AC-1.2-03

### Description
Xác minh trong thời gian lockout, dù nhập đúng mật khẩu vẫn bị chặn.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Sau TC-1.2-05, login ngay bằng mật khẩu đúng | HTTP `429 Too Many Requests` |
| 2 | Kiểm tra body response | `code = TEMPORARILY_LOCKED`, có `retryAfterSeconds` > 0 |

---

## Test Case: TC-1.2-07 - Refresh token hợp lệ -> rotate token

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-1.2-07  
**AC Covered:** AC-1.2-01

### Description
Xác minh refresh token còn hiệu lực có thể đổi lấy cặp token mới.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login thành công, lấy `refreshToken` | Có refresh token hợp lệ |
| 2 | Gọi `POST /api/identity/auth/refresh` với refresh token đó | HTTP `200 OK` |
| 3 | Kiểm tra response | Có `accessToken` mới và `refreshToken` mới |
| 4 | So sánh refresh token | refresh token mới khác refresh token cũ |

### Test Data
```bash
REFRESH=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq -r '.refreshToken')

curl -s -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq .
```

---

## Test Case: TC-1.2-08 - Refresh token không hợp lệ -> 401 INVALID_REFRESH_TOKEN

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.2-08  
**AC Covered:** AC-1.2-01

### Description
Xác minh hệ thống từ chối refresh token sai/giả mạo.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/identity/auth/refresh` với refresh token giả | HTTP `401 Unauthorized` |
| 2 | Kiểm tra body response | `code = INVALID_REFRESH_TOKEN` |

### Test Data
```bash
curl -i -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"fake-token-value"}'
```

---

## Test Case: TC-1.2-09 - Logout -> revoke session, refresh cũ không dùng lại được

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security Test  
**Id:** TC-1.2-09  
**AC Covered:** AC-1.2-01

### Description
Xác minh logout revoke session thành công và refresh token cũ không thể dùng lại.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login lấy refresh token | Có refresh token |
| 2 | Gọi `POST /api/identity/auth/logout` với refresh token đó | HTTP `204 No Content` |
| 3 | Dùng lại refresh token cũ gọi `/refresh` | HTTP `401 Unauthorized`, `INVALID_REFRESH_TOKEN` |

### Test Data
```bash
R=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}' | jq -r '.refreshToken')

curl -i -X POST http://localhost:5294/api/identity/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$R\"}"

curl -i -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$R\"}"
```

---

## Test Case: TC-1.2-10 - Audit log LOGIN_SUCCESS được ghi sau login thành công

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security + Audit Test  
**Id:** TC-1.2-10  
**AC Covered:** AC-1.2-04

### Description
Xác minh sau login thành công, hệ thống ghi `LOGIN_SUCCESS` vào `audit_log`.

### Precondition
- Có quyền đọc DB (hoặc endpoint audit nếu môi trường đã mở)

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Ghi nhận `NOW()` trước khi login | Có timestamp mốc kiểm tra |
| 2 | Login thành công user `teacher01` | HTTP `200 OK` |
| 3 | Query `audit_log` theo action + actor + thời gian | Có ít nhất 1 bản ghi mới `LOGIN_SUCCESS` |

### Test Data
```sql
SELECT a.id, a.action, a.actor_user_id, a.created_at
FROM audit_log a
JOIN user_account u ON u.id = a.actor_user_id
WHERE a.action = 'LOGIN_SUCCESS'
  AND u.username = 'teacher01'
  AND a.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY a.created_at DESC
LIMIT 5;
```

---

## Test Case: TC-1.2-11 - Audit log LOGIN_FAILED được ghi sau login thất bại

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security + Audit Test  
**Id:** TC-1.2-11  
**AC Covered:** AC-1.2-04

### Description
Xác minh sau login thất bại (sai mật khẩu), hệ thống ghi `LOGIN_FAILED` vào `audit_log`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi login sai mật khẩu | HTTP `401` hoặc `429` |
| 2 | Query `audit_log` theo action + actor + thời gian | Có ít nhất 1 bản ghi `LOGIN_FAILED` mới |
| 3 | Kiểm tra metadata | Có lý do như `INVALID_PASSWORD` hoặc `MAX_FAILED_ATTEMPTS` |

### Test Data
```sql
SELECT a.id, a.action, a.actor_user_id, a.metadata, a.created_at
FROM audit_log a
JOIN user_account u ON u.id = a.actor_user_id
WHERE a.action = 'LOGIN_FAILED'
  AND u.username = 'teacher01'
  AND a.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY a.created_at DESC
LIMIT 5;
```

---

## Test Case: TC-1.2-12 - Change password thành công -> revoke các session khác

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security Test  
**Id:** TC-1.2-12  
**AC Covered:** AC-1.2-05

### Description
Xác minh đổi mật khẩu thành công sẽ giữ lại session hiện tại nếu gửi đúng `refreshToken`, đồng thời revoke các session còn lại.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login 2 lần để tạo 2 session và lưu lại `refreshToken` của từng lần | Có `refreshToken` thứ nhất và thứ hai |
| 2 | Gọi `POST /api/identity/auth/change-password` bằng access token của session thứ hai, body gồm `currentPassword`, `newPassword`, `refreshToken` của session thứ hai | HTTP `200 OK`, response có `revokedSessionCount >= 1` |
| 3 | Dùng lại `refreshToken` của session thứ nhất để gọi `/refresh` | HTTP `401 Unauthorized`, `INVALID_REFRESH_TOKEN` |
| 4 | Login lại bằng mật khẩu mới | HTTP `200 OK` |
| 5 | Login bằng mật khẩu cũ | HTTP `401 Unauthorized` |

### Test Data
```bash
LOGIN1=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}')

LOGIN2=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123"}')

ACCESS2=$(echo "$LOGIN2" | jq -r '.accessToken')
REFRESH1=$(echo "$LOGIN1" | jq -r '.refreshToken')
REFRESH2=$(echo "$LOGIN2" | jq -r '.refreshToken')

curl -i -X POST http://localhost:5294/api/identity/auth/change-password \
  -H "Authorization: Bearer $ACCESS2" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"Admin@123\",\"newPassword\":\"Admin@123!\",\"refreshToken\":\"$REFRESH2\"}"

curl -i -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH1\"}"
```

---

## Test Case: TC-1.2-13 - Change password sai current password -> không đổi mật khẩu, không revoke session

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-1.2-13  
**AC Covered:** AC-1.2-05

### Description
Xác minh khi nhập sai `currentPassword`, hệ thống từ chối đổi mật khẩu và không ảnh hưởng session hiện tại.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Login lấy `accessToken` và `refreshToken` hợp lệ | HTTP `200 OK` |
| 2 | Gọi `POST /api/identity/auth/change-password` với `currentPassword` sai | HTTP `400 Bad Request` |
| 3 | Kiểm tra body response | Có `error = Current password is incorrect.` |
| 4 | Dùng lại `refreshToken` vừa login gọi `/refresh` | HTTP `200 OK` |

### Test Data
```bash
LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher01","password":"Admin@123!"}')

ACCESS=$(echo "$LOGIN" | jq -r '.accessToken')
REFRESH=$(echo "$LOGIN" | jq -r '.refreshToken')

curl -i -X POST http://localhost:5294/api/identity/auth/change-password \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"WrongPass@123\",\"newPassword\":\"Admin@123\",\"refreshToken\":\"$REFRESH\"}"

curl -i -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

---

## Test Case: TC-1.2-14 - Audit log PASSWORD_CHANGED được ghi sau đổi mật khẩu thành công

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security + Audit Test  
**Id:** TC-1.2-14  
**AC Covered:** AC-1.2-05

### Description
Xác minh sau đổi mật khẩu thành công, hệ thống ghi `PASSWORD_CHANGED` vào `audit_log` kèm metadata số session bị revoke.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Thực hiện TC-1.2-12 thành công | Password được đổi và các session khác bị revoke |
| 2 | Query `audit_log` theo action + actor + thời gian | Có ít nhất 1 bản ghi `PASSWORD_CHANGED` mới |
| 3 | Kiểm tra metadata | Có `revokedSessions` trong metadata |

### Test Data
```sql
SELECT a.id, a.action, a.actor_user_id, a.metadata, a.created_at
FROM audit_log a
JOIN user_account u ON u.id = a.actor_user_id
WHERE a.action = 'PASSWORD_CHANGED'
  AND u.username = 'teacher01'
  AND a.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY a.created_at DESC
LIMIT 5;
```

---

## Notes
- Sau khi chạy các test brute-force (TC-1.2-05, TC-1.2-06), cần reset trạng thái user test trước khi chạy regression khác:

```sql
UPDATE user_account
SET failed_attempts = 0,
    locked_until = NULL,
    updated_at = NOW()
WHERE username = 'teacher01';
```

- Nếu test contract expiry bằng cách cập nhật DB, nhớ rollback data sau khi test xong để tránh ảnh hưởng user thực tế.
- Sau khi chạy TC-1.2-12 hoặc TC-1.2-14, đổi lại password test user về giá trị ban đầu để không ảnh hưởng các test khác:

```bash
curl -i -X POST http://localhost:5294/api/identity/auth/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN_MOI>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Admin@123!","newPassword":"Admin@123"}'
```
