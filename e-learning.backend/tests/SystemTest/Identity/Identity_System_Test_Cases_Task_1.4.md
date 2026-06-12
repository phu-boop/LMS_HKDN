# System Test Cases: Task 1.4 - Concurrent Session Management

**Module:** Identity  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Id:** ST-IDENTITY-1.4  
**Branch:** `feat/concurrent_session_management`

---

## Scope
- Task 1.4 - Giới hạn số phiên đăng nhập đồng thời theo policy (`BLOCK` / `KICK_OLDEST`).
- API trong code hiện tại:
  - `GET /api/identity/auth/sessions` — Xem danh sách session của bản thân
  - `DELETE /api/identity/auth/sessions/{sessionId}` — Thu hồi 1 session
  - `DELETE /api/identity/auth/sessions` — Logout everywhere (thu hồi tất cả session khác)
  - `GET /api/identity/auth/admin/sessions/{userId}` — Admin xem session của user bất kỳ
  - `DELETE /api/identity/auth/admin/sessions/{sessionId}` — Admin thu hồi 1 session
  - `DELETE /api/identity/auth/admin/sessions/users/{userId}` — Admin thu hồi toàn bộ session của user

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

- `teacher01` cần có policy `BLOCK` hoặc `KICK_OLDEST` trong bảng `school_session_policy` để test TC-1.4-04, TC-1.4-05.
- Có `jq` để parse JSON:

```bash
brew install jq
```

---

## Acceptance Criteria Index

- `AC-1.4-01`: Cấu hình `max_concurrent_sessions` theo user hoặc loại tài khoản
- `AC-1.4-02`: Khi vượt ngưỡng: policy `BLOCK` từ chối login mới; policy `KICK_OLDEST` đá session cũ nhất
- `AC-1.4-03`: API xem danh sách session và thu hồi 1 session của bản thân
- `AC-1.4-04`: API cho Admin xem/hủy session của bất kỳ user nào
- `AC-1.4-05`: Ghi log đầy đủ các sự kiện session

---

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | API | Acceptance Criteria Covered |
| :--- | :--- | :--- | :--- |
| TC-1.4-01 | Xem danh sách session của bản thân | GET Sessions | AC-1.4-03 |
| TC-1.4-02 | Thu hồi 1 session của bản thân | DELETE Sessions/{id} | AC-1.4-03, AC-1.4-05 |
| TC-1.4-03 | Không thể thu hồi session của user khác | DELETE Sessions/{id} | AC-1.4-03 |
| TC-1.4-04 | Login vượt ngưỡng với policy BLOCK | POST Login | AC-1.4-01, AC-1.4-02, AC-1.4-05 |
| TC-1.4-05 | Login vượt ngưỡng với policy KICK_OLDEST | POST Login | AC-1.4-01, AC-1.4-02, AC-1.4-05 |
| TC-1.4-06 | Logout everywhere - thu hồi tất cả session khác | DELETE Sessions | AC-1.4-03, AC-1.4-05 |
| TC-1.4-07 | Admin xem danh sách session của user | GET Admin Sessions | AC-1.4-04 |
| TC-1.4-08 | Admin thu hồi 1 session của user | DELETE Admin Sessions/{id} | AC-1.4-04, AC-1.4-05 |
| TC-1.4-09 | Admin thu hồi toàn bộ session của user | DELETE Admin Sessions/users/{id} | AC-1.4-04, AC-1.4-05 |
| TC-1.4-10 | Audit log ghi nhận SESSION_REVOKED_ALL | DELETE Sessions | AC-1.4-05 |

---

## Test Cases

### TC-1.4-01: Xem danh sách session của bản thân

**Objective:** User xem được danh sách session active của chính mình.  
**AC:** AC-1.4-03

**Steps:**

```bash
# Step 1: Login để lấy token
IDENTIFY=$(curl -s -X POST http://localhost:5294/api/identity/identify \
  -H "Content-Type: application/json" \
  -d '{"identifier": "teacher01"}')
SCHOOL_ID=$(echo $IDENTIFY | jq -r '.schoolId')

LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

ACCESS_TOKEN=$(echo $LOGIN | jq -r '.accessToken')

# Step 2: Lấy danh sách sessions
curl -s http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**Expected Result:**
- HTTP 200
- Response là mảng JSON, mỗi item có: `id`, `userAgent`, `ipAddress`, `startedAt`, `lastSeenAt`, `status`
- Tất cả sessions có `status: "ACTIVE"`

---

### TC-1.4-02: Thu hồi 1 session của bản thân

**Objective:** User thu hồi 1 session cụ thể của mình.  
**AC:** AC-1.4-03, AC-1.4-05

**Steps:**

```bash
# Step 1: Login 2 lần để có 2 sessions
LOGIN1=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

LOGIN2=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

ACCESS_TOKEN=$(echo $LOGIN2 | jq -r '.accessToken')

# Step 2: Lấy session ID của login đầu tiên
SESSION_ID=$(curl -s http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

# Step 3: Thu hồi session đó
curl -s -X DELETE "http://localhost:5294/api/identity/auth/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Step 4: Xác nhận session bị revoked
curl -s http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**Expected Result:**
- Step 3: HTTP 204 No Content
- Step 4: Session đã bị thu hồi không còn xuất hiện trong danh sách active

---

### TC-1.4-03: Không thể thu hồi session của user khác

**Objective:** User không thể thu hồi session của người khác (security boundary).  
**AC:** AC-1.4-03

**Steps:**

```bash
# Step 1: Login với teacher01 và lấy session ID
TEACHER_LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")
TEACHER_TOKEN=$(echo $TEACHER_LOGIN | jq -r '.accessToken')
TEACHER_SESSION=$(curl -s http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $TEACHER_TOKEN" | jq -r '.[0].id')

# Step 2: Login với stem_admin
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "stem_admin", "password": "Admin@123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.accessToken')

# Step 3: Admin thử xóa session của teacher01 (qua user endpoint, không phải admin endpoint)
curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  "http://localhost:5294/api/identity/auth/sessions/$TEACHER_SESSION" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Result:**
- HTTP 403 Forbidden — user chỉ được thu hồi session của chính mình

---

### TC-1.4-04: Login vượt ngưỡng với policy BLOCK

**Prerequisite:** User `teacher01` có `max_concurrent_sessions = 2`, `policy = BLOCK` trong `school_session_policy`.

**Objective:** Khi đã đạt max sessions, login mới bị từ chối.  
**AC:** AC-1.4-01, AC-1.4-02, AC-1.4-05

**Setup:**
```sql
-- Chạy trên DB trực tiếp
UPDATE school_session_policy
SET max_concurrent_sessions = 2, session_policy = 'BLOCK'
WHERE school_id = (SELECT id FROM school WHERE subdomain = 'demo-school');
```

**Steps:**

```bash
# Login lần 1 và 2 (đạt ngưỡng)
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}" > /dev/null

curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}" > /dev/null

# Login lần 3 — phải bị BLOCK
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}"
```

**Expected Result:**
- HTTP 429 (Too Many Requests) hoặc HTTP 403
- Response body chứa thông báo rõ ràng về giới hạn session
- Audit log ghi `SESSION_BLOCKED`

---

### TC-1.4-05: Login vượt ngưỡng với policy KICK_OLDEST

**Prerequisite:** User `teacher01` có `max_concurrent_sessions = 2`, `policy = KICK_OLDEST`.

**Objective:** Khi đã đạt max sessions, session cũ nhất bị kick để nhường chỗ cho login mới.  
**AC:** AC-1.4-01, AC-1.4-02, AC-1.4-05

**Setup:**
```sql
UPDATE school_session_policy
SET max_concurrent_sessions = 2, session_policy = 'KICK_OLDEST'
WHERE school_id = (SELECT id FROM school WHERE subdomain = 'demo-school');
```

**Steps:**

```bash
# Login lần 1 — ghi lại session ID
LOGIN1=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")
TOKEN1=$(echo $LOGIN1 | jq -r '.accessToken')

# Login lần 2
curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}" > /dev/null

# Login lần 3 — phải kick session cũ nhất
LOGIN3=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")
echo $LOGIN3 | jq .

# Kiểm tra token cũ nhất đã bị revoked (refresh sẽ fail)
REFRESH_TOKEN1=$(echo $LOGIN1 | jq -r '.refreshToken')
curl -s -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN1\"}"
```

**Expected Result:**
- Login lần 3: HTTP 200, trả về token mới
- Dùng refresh token của login 1 để refresh → HTTP 401 (session đã bị kick)
- Audit log ghi `SESSION_KICKED` cho session bị đá

---

### TC-1.4-06: Logout everywhere — thu hồi tất cả session khác

**Objective:** User đăng xuất khỏi tất cả thiết bị khác, chỉ giữ lại session hiện tại.  
**AC:** AC-1.4-03, AC-1.4-05

**Steps:**

```bash
# Step 1: Login 3 lần để có 3 sessions
LOGIN1=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

LOGIN2=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

LOGIN3=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"teacher01\", \"password\": \"Admin@123\", \"schoolId\": \"$SCHOOL_ID\"}")

ACCESS3=$(echo $LOGIN3 | jq -r '.accessToken')
REFRESH3=$(echo $LOGIN3 | jq -r '.refreshToken')

# Step 2: Logout everywhere từ session 3
curl -s -X DELETE http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $ACCESS3" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH3\"}"

# Step 3: Xác nhận sessions 1 và 2 không thể refresh
REFRESH1=$(echo $LOGIN1 | jq -r '.refreshToken')
curl -s -X POST http://localhost:5294/api/identity/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH1\"}"

# Step 4: Session 3 vẫn còn hiệu lực
curl -s http://localhost:5294/api/identity/auth/sessions \
  -H "Authorization: Bearer $ACCESS3" | jq .
```

**Expected Result:**
- Step 2: HTTP 200, `{ "revokedCount": 2 }`
- Step 3: HTTP 401 (refresh token của session 1 đã bị revoked)
- Step 4: Chỉ còn 1 session active (session 3)

---

### TC-1.4-07: Admin xem danh sách session của user

**Objective:** Admin xem được tất cả session của bất kỳ user nào.  
**AC:** AC-1.4-04

**Steps:**

```bash
# Step 1: Login với superadmin
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "Admin@123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.accessToken')

# Step 2: Lấy userId của teacher01
TEACHER_ID=$(curl -s "http://localhost:5294/api/identity/admin/users?username=teacher01" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.items[0].id')

# Step 3: Admin xem sessions của teacher01
curl -s "http://localhost:5294/api/identity/auth/admin/sessions/$TEACHER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

**Expected Result:**
- HTTP 200
- Trả về danh sách session của `teacher01` gồm cả ACTIVE và REVOKED

---

### TC-1.4-08: Admin thu hồi 1 session của user

**Objective:** Admin có thể thu hồi 1 session cụ thể của bất kỳ user nào.  
**AC:** AC-1.4-04, AC-1.4-05

**Steps:**

```bash
# Lấy danh sách sessions của teacher01 và chọn 1 session để xóa
SESSION_ID=$(curl -s "http://localhost:5294/api/identity/auth/admin/sessions/$TEACHER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

# Admin revoke session đó
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "http://localhost:5294/api/identity/auth/admin/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Result:**
- HTTP 204 No Content

---

### TC-1.4-09: Admin thu hồi toàn bộ session của user

**Objective:** Admin thu hồi tất cả session của 1 user.  
**AC:** AC-1.4-04, AC-1.4-05

**Steps:**

```bash
# Admin revoke ALL sessions của teacher01
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "http://localhost:5294/api/identity/auth/admin/sessions/users/$TEACHER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Xác nhận không còn active sessions
curl -s "http://localhost:5294/api/identity/auth/admin/sessions/$TEACHER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '[.[] | select(.status == "ACTIVE")]'
```

**Expected Result:**
- HTTP 204 No Content
- Không còn session ACTIVE nào của teacher01

---

### TC-1.4-10: Audit log ghi nhận SESSION_REVOKED_ALL

**Objective:** Kiểm tra audit log có ghi đúng action khi thu hồi tất cả session.  
**AC:** AC-1.4-05

**Steps:**

```bash
# Thực hiện logout everywhere (TC-1.4-06)
# Sau đó kiểm tra audit log
curl -s "http://localhost:5294/api/audit-logs?action=SESSION_REVOKED_ALL" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

**Expected Result:**
- Audit log có entry với `action = "SESSION_REVOKED_ALL"`
- `actorUserId` = userId của user thực hiện logout
- `ipAddress` và `userAgent` được ghi

---

## Cleanup

```bash
# Reset session policy về mặc định sau khi test
UPDATE school_session_policy
SET max_concurrent_sessions = 10, session_policy = 'KICK_OLDEST'
WHERE school_id = (SELECT id FROM school WHERE subdomain = 'demo-school');
```
