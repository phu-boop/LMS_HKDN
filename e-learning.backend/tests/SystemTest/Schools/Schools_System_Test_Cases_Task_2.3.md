# System Test Cases: Task 2.3 - Quản lý Trường học (Schools)

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [None]  
**Id:** ST-SCHOOLS-2.3  

## Scope
- Task 2.3 — Quản lý Trường học (Schools): CRUD, search, filter, paginate, change status

## Acceptance Criteria Index

- `AC-2.3-01`: Tạo / sửa / ngưng hoạt động trường học
- `AC-2.3-02`: Quản lý thông tin: tên trường, mã trường, địa chỉ, MST, người liên hệ (POC), tỉnh/thành phố
- `AC-2.3-03`: Thiết lập thời hạn hợp đồng (ngày bắt đầu / kết thúc)
- `AC-2.3-04`: Search, filter, xem chi tiết hồ sơ trường

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.3-01 | Tạo mới Trường học với đầy đủ thông tin | AC-2.3-01, AC-2.3-02, AC-2.3-03 |
| TC-2.3-02 | Tạo Trường học thiếu trường bắt buộc | AC-2.3-01 |
| TC-2.3-03 | Không cho phép trùng Mã trường | AC-2.3-01 |
| TC-2.3-04 | Cập nhật thông tin Trường học | AC-2.3-01, AC-2.3-02, AC-2.3-03 |
| TC-2.3-05 | Ngưng hoạt động và Kích hoạt lại Trường học | AC-2.3-01 |
| TC-2.3-06 | Xem danh sách Trường học có phân trang | AC-2.3-04 |
| TC-2.3-07 | Tìm kiếm Trường học theo tên hoặc mã | AC-2.3-04 |
| TC-2.3-08 | Filter Trường học theo trạng thái | AC-2.3-04 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `4`
- Tổng số Test Case: `8`
- AC có coverage:
  - AC-2.3-01: 4 test case (TC-01, TC-02, TC-03, TC-05)
  - AC-2.3-02: 2 test case (TC-01, TC-04)
  - AC-2.3-03: 2 test case (TC-01, TC-04)
  - AC-2.3-04: 3 test case (TC-06, TC-07, TC-08)
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-2.3-01 - Tạo mới Trường học với đầy đủ thông tin

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-01  
**AC Covered:** AC-2.3-01, AC-2.3-02, AC-2.3-03  

### Description
Xác minh LMS Admin có thể tạo mới một trường học với đầy đủ thông tin: tên trường, mã trường, địa chỉ, MST, người liên hệ (POC), tỉnh/thành phố, và thời hạn hợp đồng. Sau khi tạo, trường được hiển thị đúng trong danh sách và chi tiết.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `SCHOOLS_CREATE`.
- Có sẵn access token hợp lệ cho user admin.
- Header `Authorization: Bearer <token>` được thiết lập.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `POST /api/admin/schools` với payload đầy đủ: `code`, `name`, `taxId`, `province`, `district`, `address`, `contactName`, `contactEmail`, `contactPhone`, `contractStartDate`, `contractEndDate` | API trả về `201 Created` |
| 2 | Kiểm tra response body | Có `schoolId` hợp lệ và không rỗng |
| 3 | Gọi API `GET /api/admin/schools/{schoolId}` với `schoolId` từ bước 2 | API trả về `200 OK` |
| 4 | Đối chiếu toàn bộ các trường trong response chi tiết | Tất cả trường (mã, tên, MST, POC, địa chỉ, hợp đồng) khớp đúng với payload đã gửi |
| 5 | Kiểm tra trường `status` trong response chi tiết | `status` là `ACTIVE` |

---

## Test Case: TC-2.3-02 - Tạo Trường học thiếu trường bắt buộc

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.3-02  
**AC Covered:** AC-2.3-01  

### Description
Xác minh hệ thống từ chối tạo mới trường học khi thiếu các trường bắt buộc (`code` hoặc `name`).

### Precondition
- User đăng nhập có quyền `SCHOOLS_CREATE`.
- Header `Authorization: Bearer <token>` được thiết lập.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `POST /api/admin/schools` với payload thiếu trường `code` (chỉ truyền `name`) | API trả về lỗi (4xx) |
| 2 | Kiểm tra response body bước 1 | Có thông báo lỗi mô tả thiếu `code` |
| 3 | Gọi API `POST /api/admin/schools` với payload thiếu trường `name` (chỉ truyền `code`) | API trả về lỗi (4xx) |
| 4 | Kiểm tra response body bước 3 | Có thông báo lỗi mô tả thiếu `name` |

---

## Test Case: TC-2.3-03 - Không cho phép trùng Mã trường

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.3-03  
**AC Covered:** AC-2.3-01  

### Description
Xác minh hệ thống từ chối tạo mới trường học khi `code` (mã trường) đã tồn tại trong hệ thống.

### Precondition
- User đăng nhập có quyền `SCHOOLS_CREATE`.
- Đã tồn tại ít nhất một trường học với mã `SCH001`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `POST /api/admin/schools` với `code: "SCH001"` và `name: "Trường Test 1"` | API trả về `201 Created` hoặc trường đã có sẵn |
| 2 | Gọi lại API `POST /api/admin/schools` với cùng `code: "SCH001"` và `name: "Trường Test 2"` | API trả về `409 Conflict` |
| 3 | Kiểm tra response body bước 2 | Có thông báo lỗi đề cập mã `SCH001` đã tồn tại |

---

## Test Case: TC-2.3-04 - Cập nhật thông tin Trường học

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-04  
**AC Covered:** AC-2.3-01, AC-2.3-02, AC-2.3-03  

### Description
Xác minh LMS Admin có thể cập nhật tất cả các trường thông tin của trường học bao gồm thông tin định danh, địa chỉ, POC, và thời hạn hợp đồng. Dữ liệu sau cập nhật được phản ánh đúng khi xem chi tiết.

### Precondition
- User đăng nhập có quyền `SCHOOLS_UPDATE`.
- Đã có sẵn một trường học đang `ACTIVE` với mã `SCH-TEST`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi `GET /api/admin/schools?search=SCH-TEST` để lấy `schoolId` | Lấy được `schoolId` hợp lệ |
| 2 | Gọi API `PUT /api/admin/schools/{schoolId}` với payload mới: `name`, `taxId`, `province`, `district`, `address`, `contactName`, `contactEmail`, `contactPhone`, `contractStartDate`, `contractEndDate` | API trả về `200 OK` |
| 3 | Kiểm tra response body của bước 2 | Các trường trong response phản ánh đúng dữ liệu mới đã truyền vào |
| 4 | Gọi `GET /api/admin/schools/{schoolId}` để lấy chi tiết sau cập nhật | API trả về `200 OK` |
| 5 | Đối chiếu toàn bộ trường trong response chi tiết với payload đã cập nhật | Tất cả trường khớp chính xác |

---

## Test Case: TC-2.3-05 - Ngưng hoạt động và Kích hoạt lại Trường học

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-05  
**AC Covered:** AC-2.3-01  

### Description
Xác minh LMS Admin có thể thay đổi trạng thái trường học từ `ACTIVE` sang `INACTIVE` (ngưng hoạt động) và ngược lại (kích hoạt lại). Trạng thái sau thay đổi được phản ánh đúng trong chi tiết.

### Precondition
- User đăng nhập có quyền `SCHOOLS_CHANGE_STATUS`.
- Đã có sẵn một trường học đang `ACTIVE`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `PATCH /api/admin/schools/{schoolId}/status` với body `{ "status": "INACTIVE" }` | API trả về `204 No Content` |
| 2 | Gọi API `GET /api/admin/schools/{schoolId}` để kiểm tra chi tiết | API trả về `200 OK` với `status = "INACTIVE"` |
| 3 | Gọi API `PATCH /api/admin/schools/{schoolId}/status` với body `{ "status": "ACTIVE" }` | API trả về `204 No Content` |
| 4 | Gọi API `GET /api/admin/schools/{schoolId}` để kiểm tra chi tiết | API trả về `200 OK` với `status = "ACTIVE"` |
| 5 | Gọi API `PATCH /api/admin/schools/{schoolId}/status` với `schoolId` không tồn tại | API trả về `404 Not Found` |

---

## Test Case: TC-2.3-06 - Xem danh sách Trường học có phân trang

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-06  
**AC Covered:** AC-2.3-04  

### Description
Xác minh API danh sách trường học trả về đúng cấu trúc phân trang với `items`, `total`, `page`, `pageSize`. Kết quả thay đổi đúng khi chuyển page.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Đã có ít nhất 15 trường học trong hệ thống.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/schools?page=1&pageSize=10` | API trả về `200 OK` |
| 2 | Kiểm tra response body | Có trường `items` (mảng ≤ 10 phần tử), `total` ≥ 10, `page = 1`, `pageSize = 10` |
| 3 | Gọi API `GET /api/admin/schools?page=2&pageSize=10` | API trả về `200 OK` |
| 4 | Kiểm tra danh sách `items` trang 2 | Không trùng với danh sách `items` trang 1 |
| 5 | Gọi API `GET /api/admin/schools?page=1&pageSize=200` (vượt giới hạn max) | API trả về `200 OK` với `pageSize` bị clamp xuống `100` hoặc tương đương |

---

## Test Case: TC-2.3-07 - Tìm kiếm Trường học theo tên hoặc mã

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-07  
**AC Covered:** AC-2.3-04  

### Description
Xác minh tính năng tìm kiếm free-text (`search`) hoạt động đúng với cả tên trường và mã trường (không phân biệt hoa thường).

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Đã có trường học với tên `"THPT Lê Hồng Phong"` và mã `"LHP-HCM"`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/schools?search=Lê Hồng Phong` | API trả về `200 OK` |
| 2 | Kiểm tra `items` trong response | Có kết quả chứa trường `"THPT Lê Hồng Phong"` |
| 3 | Gọi API `GET /api/admin/schools?search=lhp-hcm` (chữ thường) | API trả về `200 OK` |
| 4 | Kiểm tra `items` trong response | Có kết quả chứa trường với mã `"LHP-HCM"` (case-insensitive) |
| 5 | Gọi API `GET /api/admin/schools?search=XXXXXXXXXXX` (chuỗi không tồn tại) | API trả về `200 OK` với `items` là mảng rỗng và `total = 0` |

---

## Test Case: TC-2.3-08 - Filter Trường học theo trạng thái

**Module:** Schools  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.3-08  
**AC Covered:** AC-2.3-04  

### Description
Xác minh tính năng lọc danh sách trường theo `status`. Kết quả chỉ trả về đúng các trường có trạng thái được yêu cầu.

### Precondition
- User đăng nhập có quyền `SCHOOLS_VIEW`.
- Đã có ít nhất 1 trường `ACTIVE` và 1 trường `INACTIVE` trong hệ thống.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/schools?status=ACTIVE` | API trả về `200 OK` |
| 2 | Kiểm tra tất cả `items` trong response | Tất cả phần tử đều có `status = "ACTIVE"` |
| 3 | Gọi API `GET /api/admin/schools?status=INACTIVE` | API trả về `200 OK` |
| 4 | Kiểm tra tất cả `items` trong response | Tất cả phần tử đều có `status = "INACTIVE"` |
| 5 | Gọi API `GET /api/admin/schools` (không truyền `status`) | API trả về `200 OK` với cả trường `ACTIVE` lẫn `INACTIVE` (không lọc) |
