# System Test Cases: Task 2.4 - Cấu hình License & Subscription cho Trường

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [docs/mockup/Admin/LicenseAndContract.html]  
**Id:** ST-SCHOOLS-2.4  

## Scope
- Task 2.4 — Cấu hình License & Subscription: CRUD subscription, enforce expiry, duplicate prevention, login policy validation
- API mở rộng: `GET /api/admin/subscriptions` hỗ trợ filter `tenantId`, `schoolId`, `status` và phân trang `page`, `pageSize`

## Acceptance Criteria Index

- `AC-2.4-01`: Gắn trường học vào một hoặc nhiều tenant
- `AC-2.4-02`: Cấu hình hợp đồng: ngày bắt đầu, ngày kết thúc, max concurrent sessions, login policy (BLOCK_NEW / KICK_OLDEST)
- `AC-2.4-03`: Cảnh báo khi hợp đồng sắp hết hạn (dữ liệu `contract_end` ≤ 30 ngày từ hôm nay được trả về đúng để UI hiển thị cảnh báo)
- `AC-2.4-04`: Không cho phép login khi hợp đồng đã hết hạn (`enforce_expiry = true` và `contract_end` < ngày hiện tại)

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.4-01 | Tạo mới Subscription đầy đủ thông tin (gắn trường vào tenant) | AC-2.4-01, AC-2.4-02 |
| TC-2.4-02 | Tạo Subscription thiếu trường bắt buộc | AC-2.4-01 |
| TC-2.4-03 | Không cho phép gắn trùng tenant cho cùng trường | AC-2.4-01 |
| TC-2.4-04 | Tạo Subscription với school không tồn tại | AC-2.4-01 |
| TC-2.4-05 | Validate dữ liệu hợp đồng không hợp lệ | AC-2.4-02 |
| TC-2.4-06 | Cập nhật Subscription (sửa hợp đồng, sessions, policy) | AC-2.4-02 |
| TC-2.4-07 | Xóa Subscription | AC-2.4-01 |
| TC-2.4-08 | Xem danh sách Subscription của một Trường | AC-2.4-01 |
| TC-2.4-11 | Xem danh sách Subscription toàn cục với filter status | AC-2.4-01 |
| TC-2.4-12 | Xem danh sách Subscription toàn cục có phân trang | AC-2.4-01 |
| TC-2.4-09 | Trường hợp hợp đồng sắp hết hạn — dữ liệu trả về đúng để UI hiển thị cảnh báo | AC-2.4-03 |
| TC-2.4-10 | Trường hợp hợp đồng đã hết hạn với enforce_expiry = true — dữ liệu trả về đúng | AC-2.4-04 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `4`
- Tổng số Test Case: `12`
- AC có coverage:
  - AC-2.4-01: 8 test case (TC-01, TC-02, TC-03, TC-04, TC-07, TC-08, TC-11, TC-12)
  - AC-2.4-02: 3 test case (TC-01, TC-05, TC-06)
  - AC-2.4-03: 1 test case (TC-09)
  - AC-2.4-04: 1 test case (TC-10)
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-2.4-01 - Tạo mới Subscription đầy đủ thông tin (gắn trường vào tenant)

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-01  
**AC Covered:** AC-2.4-01, AC-2.4-02  

### Description
Xác minh LMS Admin có thể tạo mới một subscription hợp lệ để gắn trường học vào một tenant, với đầy đủ thông tin hợp đồng: ngày bắt đầu / kết thúc, max concurrent sessions, login policy, enforce expiry.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn một trường học `ACTIVE` với `schoolId` hợp lệ (gọi là `{schoolId}`).
- Đã có sẵn một tenant `ACTIVE` với `tenantId` hợp lệ (gọi là `{tenantId}`).
- Trường chưa có subscription với tenant trên.

### Test Data
```json
{
  "tenantId": "{tenantId}",
  "contractStart": "2026-01-01",
  "contractEnd": "2026-12-31",
  "maxConcurrentSessions": 500,
  "loginPolicy": "KICK_OLDEST",
  "enforceExpiry": true
}
```

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `POST /api/admin/schools/{schoolId}/subscriptions` với payload đầy đủ | API trả về `201 Created` |
| 2 | Kiểm tra response body | Có `id` (UUID hợp lệ, không rỗng), `schoolId`, `tenantId` khớp payload |
| 3 | Kiểm tra các trường hợp đồng trong response | `contractStart = "2026-01-01"`, `contractEnd = "2026-12-31"`, `maxConcurrentSessions = 500` |
| 4 | Kiểm tra `loginPolicy` và `enforceExpiry` trong response | `loginPolicy = "KICK_OLDEST"`, `enforceExpiry = true` |
| 5 | Gọi API `GET /api/admin/schools/{schoolId}/subscriptions` | API trả về `200 OK`, subscription vừa tạo xuất hiện trong danh sách |
| 6 | Kiểm tra subscription trong danh sách | `tenantCode` và `tenantName` được join đúng từ bảng tenant |

---

## Test Case: TC-2.4-02 - Tạo Subscription thiếu trường bắt buộc

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.4-02  
**AC Covered:** AC-2.4-01  

### Description
Xác minh hệ thống từ chối tạo subscription khi thiếu các trường bắt buộc (`tenantId`, `contractStart`, `contractEnd`).

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn `{schoolId}` hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/admin/schools/{schoolId}/subscriptions` không truyền `tenantId` (để là `00000000-0000-0000-0000-000000000000`) | API trả về `409 Conflict` hoặc `400 Bad Request` |
| 2 | Kiểm tra response body | Có thông báo lỗi đề cập `Tenant ID` |
| 3 | Gọi `POST /api/admin/schools/{schoolId}/subscriptions` với `contractEnd` trước `contractStart` | API trả về lỗi (4xx) |
| 4 | Kiểm tra response body bước 3 | Có thông báo lỗi đề cập ngày kết thúc |

---

## Test Case: TC-2.4-03 - Không cho phép gắn trùng tenant cho cùng trường

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.4-03  
**AC Covered:** AC-2.4-01  

### Description
Xác minh hệ thống từ chối tạo thêm subscription khi trường học đã có subscription với cùng một tenant (`UNIQUE(school_id, tenant_id)`).

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã tồn tại subscription cho cặp `{schoolId}` + `{tenantId}`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/admin/schools/{schoolId}/subscriptions` với cùng `{tenantId}` đã tồn tại | API trả về `409 Conflict` |
| 2 | Kiểm tra response body | Có thông báo lỗi đề cập subscription đã tồn tại cho tenant này |
| 3 | Gọi lại `GET /api/admin/schools/{schoolId}/subscriptions` | Chỉ có 1 subscription cho `{tenantId}` (không bị duplicate) |

---

## Test Case: TC-2.4-04 - Tạo Subscription với school không tồn tại

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.4-04  
**AC Covered:** AC-2.4-01  

### Description
Xác minh hệ thống từ chối tạo subscription khi `schoolId` không tồn tại trong hệ thống.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST /api/admin/schools/{nonExistentSchoolId}/subscriptions` với UUID bất kỳ không tồn tại | API trả về `409 Conflict` hoặc `404 Not Found` |
| 2 | Kiểm tra response body | Có thông báo lỗi đề cập school không tìm thấy |

---

## Test Case: TC-2.4-05 - Validate dữ liệu hợp đồng không hợp lệ

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.4-05  
**AC Covered:** AC-2.4-02  

### Description
Xác minh hệ thống validate đúng các ràng buộc dữ liệu của hợp đồng: `maxConcurrentSessions` < 1, `loginPolicy` không hợp lệ, `contractEnd` < `contractStart`.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn `{schoolId}` và `{tenantId}` hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `POST .../subscriptions` với `maxConcurrentSessions = 0` | API trả về `409 Conflict` hoặc `400 Bad Request` |
| 2 | Kiểm tra message | Đề cập `concurrent sessions` phải ≥ 1 |
| 3 | Gọi `POST .../subscriptions` với `loginPolicy = "INVALID_POLICY"` | API trả về lỗi (4xx) |
| 4 | Kiểm tra message | Đề cập login policy hợp lệ (`BLOCK_NEW` hoặc `KICK_OLDEST`) |
| 5 | Gọi `POST .../subscriptions` với `contractEnd = "2025-01-01"`, `contractStart = "2025-12-31"` (end < start) | API trả về lỗi (4xx) |
| 6 | Kiểm tra message | Đề cập ngày kết thúc không được trước ngày bắt đầu |

---

## Test Case: TC-2.4-06 - Cập nhật Subscription (sửa hợp đồng, sessions, policy)

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-06  
**AC Covered:** AC-2.4-02  

### Description
Xác minh LMS Admin có thể cập nhật thông tin hợp đồng của một subscription: thay đổi ngày hợp đồng, max sessions, và login policy. Dữ liệu được cập nhật đúng sau khi gọi API.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn subscription với `{subscriptionId}` thuộc `{schoolId}`.

### Test Data (payload cập nhật)
```json
{
  "contractStart": "2026-06-01",
  "contractEnd": "2027-05-31",
  "maxConcurrentSessions": 200,
  "loginPolicy": "BLOCK_NEW",
  "enforceExpiry": false
}
```

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `PUT /api/admin/schools/{schoolId}/subscriptions/{subscriptionId}` với payload mới | API trả về `200 OK` |
| 2 | Kiểm tra response body | Các trường phản ánh đúng payload mới: `contractStart`, `contractEnd`, `maxConcurrentSessions`, `loginPolicy`, `enforceExpiry` |
| 3 | Gọi `GET /api/admin/schools/{schoolId}/subscriptions` để xác nhận | Subscription trong danh sách có dữ liệu mới |
| 4 | Gọi `PUT .../subscriptions/{subscriptionId}` với `subscriptionId` không thuộc `{schoolId}` | API trả về `404 Not Found` |

---

## Test Case: TC-2.4-07 - Xóa Subscription

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-07  
**AC Covered:** AC-2.4-01  

### Description
Xác minh LMS Admin có thể xóa (soft-delete) một subscription. Sau khi xóa, subscription không còn xuất hiện trong danh sách và không thể thêm lại subscription cho cùng tenant khi cần.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn subscription `{subscriptionId}` thuộc `{schoolId}`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `DELETE /api/admin/schools/{schoolId}/subscriptions/{subscriptionId}` | API trả về `204 No Content` |
| 2 | Gọi `GET /api/admin/schools/{schoolId}/subscriptions` | Subscription đã xóa không còn trong danh sách |
| 3 | Gọi lại `DELETE /api/admin/schools/{schoolId}/subscriptions/{subscriptionId}` (lần 2) | API trả về `404 Not Found` (đã xóa rồi) |
| 4 | Gọi `DELETE .../subscriptions/{nonExistentId}` với UUID không tồn tại | API trả về `404 Not Found` |
| 5 | Sau khi xóa, gọi `POST .../subscriptions` lại với cùng `{tenantId}` | API trả về `201 Created` (sau khi xóa có thể gắn lại) |

---

## Test Case: TC-2.4-08 - Xem danh sách Subscription của một Trường

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-08  
**AC Covered:** AC-2.4-01  

### Description
Xác minh API danh sách subscription của một trường trả về đúng tất cả subscription đang active (chưa xóa), có join tên và mã tenant, sắp xếp theo `created_at DESC`.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Trường `{schoolId}` có ít nhất 2 subscription với 2 tenant khác nhau.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/schools/{schoolId}/subscriptions` | API trả về `200 OK` |
| 2 | Kiểm tra cấu trúc mỗi item trong mảng | Có các trường: `id`, `schoolId`, `tenantId`, `tenantCode`, `tenantName`, `contractStart`, `contractEnd`, `maxConcurrentSessions`, `loginPolicy`, `enforceExpiry`, `status`, `createdAt`, `updatedAt` |
| 3 | Kiểm tra `tenantCode` và `tenantName` | Khớp đúng với thông tin tenant tương ứng (JOIN đúng) |
| 4 | Gọi `GET /api/admin/schools/{nonExistentSchoolId}/subscriptions` với schoolId không tồn tại | API trả về `200 OK` với mảng rỗng `[]` (không có subscription) |
| 5 | Kiểm tra thứ tự sắp xếp | Subscription tạo sau xuất hiện trước (DESC theo `createdAt`) |

---

## Test Case: TC-2.4-11 - Xem danh sách Subscription toàn cục với filter status

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-11  
**AC Covered:** AC-2.4-01

### Description
Xác minh API `GET /api/admin/subscriptions` hỗ trợ filter theo `status` đúng dữ liệu trả về.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Dữ liệu có tối thiểu 2 subscription với trạng thái khác nhau (ví dụ: `ACTIVE`, `INACTIVE`).

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/subscriptions?status=ACTIVE` | API trả về `200 OK` |
| 2 | Kiểm tra response envelope | Có `items`, `total`, `page`, `pageSize` |
| 3 | Kiểm tra từng item trong `items` | Tất cả item có `status = ACTIVE` |
| 4 | Gọi `GET /api/admin/subscriptions?status=INACTIVE` | API trả về `200 OK`, chỉ trả về item `INACTIVE` |
| 5 | Gọi `GET /api/admin/subscriptions?status=invalid_status` | API trả về lỗi 4xx (do status không hợp lệ theo enum) |

---

## Test Case: TC-2.4-12 - Xem danh sách Subscription toàn cục có phân trang

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-12  
**AC Covered:** AC-2.4-01

### Description
Xác minh API `GET /api/admin/subscriptions` phân trang đúng theo `page`, `pageSize`, trả về `total` chính xác, và có thể kết hợp filter `schoolId`/`tenantId`.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Có ít nhất 5 subscription trong hệ thống để kiểm tra phân trang.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/subscriptions?page=1&pageSize=2` | API trả về `200 OK` |
| 2 | Kiểm tra response | `page = 1`, `pageSize = 2`, `items.length <= 2`, `total >= items.length` |
| 3 | Gọi `GET /api/admin/subscriptions?page=2&pageSize=2` | API trả về `200 OK`, dữ liệu trang 2 khác trang 1 (nếu đủ dữ liệu) |
| 4 | Gọi `GET /api/admin/subscriptions?page=0&pageSize=1000` | API trả về `200 OK`, backend clamp thành `page = 1`, `pageSize = 100` |
| 5 | Gọi `GET /api/admin/subscriptions?schoolId={schoolId}&tenantId={tenantId}&page=1&pageSize=20` | API trả về `200 OK`, `items` chỉ thuộc đúng `schoolId` và `tenantId` đã filter |

---

## Test Case: TC-2.4-09 - Hợp đồng sắp hết hạn — dữ liệu trả về đúng để UI hiển thị cảnh báo

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-09  
**AC Covered:** AC-2.4-03  

### Description
Xác minh rằng khi subscription có `contractEnd` trong vòng ≤ 30 ngày kể từ hôm nay, API trả về đầy đủ dữ liệu `contractEnd` chính xác để frontend có thể tính toán và hiển thị cảnh báo "Sắp hết hạn". Backend không bắt buộc phải tính toán sẵn flag cảnh báo, nhưng dữ liệu phải đủ và đúng.

> **Lưu ý:** Ngày hiện tại khi test là **25/04/2026**. Subscription sắp hết hạn cần có `contractEnd` trong khoảng từ **25/04/2026 đến 25/05/2026**.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW` và `SCHOOLS_UPDATE`.
- Đã có sẵn `{schoolId}` và `{tenantId}` hợp lệ.

### Test Data
```json
{
  "tenantId": "{tenantId}",
  "contractStart": "2025-05-01",
  "contractEnd": "2026-05-01",
  "maxConcurrentSessions": 100,
  "loginPolicy": "BLOCK_NEW",
  "enforceExpiry": true
}
```
*(contractEnd cách hôm nay 6 ngày — nằm trong ngưỡng 30 ngày cảnh báo)*

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Tạo subscription với `contractEnd = "2026-05-01"` (còn 6 ngày từ 25/04/2026) | API trả về `201 Created` |
| 2 | Gọi `GET /api/admin/schools/{schoolId}/subscriptions` | API trả về `200 OK` |
| 3 | Kiểm tra trường `contractEnd` trong response | Giá trị là `"2026-05-01"` (đúng, không bị biến đổi) |
| 4 | Tính toán phía client: `contractEnd - today ≤ 30 ngày` | Kết quả là `true` → UI nên hiển thị cảnh báo "Sắp hết hạn (Còn X ngày)" |
| 5 | Kiểm tra trường `enforceExpiry` trong response | Giá trị là `true` → xác nhận sau khi hết hạn sẽ bị chặn |

---

## Test Case: TC-2.4-10 - Hợp đồng đã hết hạn với enforce_expiry = true — dữ liệu trả về đúng

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.4-10  
**AC Covered:** AC-2.4-04  

### Description
Xác minh rằng khi subscription có `contractEnd` đã qua (`contractEnd < today`) và `enforceExpiry = true`, API trả về dữ liệu chính xác phản ánh trạng thái hết hạn. Dữ liệu này là căn cứ để Identity module (task 1.2) chặn đăng nhập.

> **Lưu ý:** Ngày hiện tại khi test là **25/04/2026**. Hợp đồng hết hạn cần có `contractEnd < "2026-04-25"`.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW` và `SCHOOLS_UPDATE`.
- Đã có sẵn `{schoolId}` và `{tenantId}` hợp lệ, chưa có subscription.

### Test Data
```json
{
  "tenantId": "{tenantId}",
  "contractStart": "2025-01-01",
  "contractEnd": "2026-03-31",
  "maxConcurrentSessions": 100,
  "loginPolicy": "BLOCK_NEW",
  "enforceExpiry": true
}
```
*(contractEnd = 31/03/2026 — đã qua ngày hôm nay 25/04/2026)*

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Tạo subscription với `contractEnd = "2026-03-31"` (đã qua 25 ngày) | API trả về `201 Created` (API không chặn tạo subscription hết hạn) |
| 2 | Gọi `GET /api/admin/schools/{schoolId}/subscriptions` | API trả về `200 OK` |
| 3 | Kiểm tra `contractEnd` trong response | Giá trị là `"2026-03-31"` (chính xác) |
| 4 | Kiểm tra `enforceExpiry` trong response | Giá trị là `true` |
| 5 | Tính toán phía Identity module: `today > contractEnd && enforceExpiry == true` | Điều kiện là `true` → Identity module phải từ chối login của user thuộc trường này trong tenant này |
| 6 | Cập nhật `contractEnd = "2027-12-31"` và `enforceExpiry = false` qua `PUT .../subscriptions/{id}` | API trả về `200 OK` |
| 7 | Kiểm tra lại GET subscription | `enforceExpiry = false` → Identity module không chặn login ngay cả khi hợp đồng hết hạn |
