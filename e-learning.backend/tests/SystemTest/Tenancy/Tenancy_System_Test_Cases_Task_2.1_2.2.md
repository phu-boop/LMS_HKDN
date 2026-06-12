# System Test Cases: Task 2.1 & 2.2 - Tenancy

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [None]  
**Id:** ST-TENANCY-2.1-2.2  

## Scope
- Task 2.1 - Quản lý Tenant và Branding
- Task 2.2 - Resolve Tenant theo Domain (Tenant Context Middleware)

## Acceptance Criteria Index

### Task 2.1
- `AC-2.1-01`: Tạo / sửa / ngưng hoạt động tenant
- `AC-2.1-02`: Quản lý code, name, domain, logo, avatar, mô tả, trạng thái
- `AC-2.1-03`: Không cho phép trùng domain hoặc tenant_code
- `AC-2.1-04`: Danh sách tenant có search, filter theo trạng thái, phân trang

### Task 2.2
- `AC-2.2-01`: Middleware resolve đúng tenant từ Host header hoặc query param
- `AC-2.2-02`: Domain không khớp trả 404 hoặc trang lỗi phù hợp
- `AC-2.2-03`: Branding config được trả về theo tenant đã resolve
- `AC-2.2-04`: Fallback về admin domain (id.daihoc.io.vn)

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.1-01 | Tạo mới Tenant với đầy đủ Branding | AC-2.1-01, AC-2.1-02 |
| TC-2.1-02 | Cập nhật thông tin Tenant và Branding | AC-2.1-01, AC-2.1-02, AC-2.2-03 |
| TC-2.1-03 | Ngưng hoạt động và kích hoạt lại Tenant | AC-2.1-01, AC-2.1-02 |
| TC-2.1-04 | Không cho phép trùng Tenant Code hoặc Domain | AC-2.1-03 |
| TC-2.1-05 | Danh sách Tenant hỗ trợ Search, Filter, Pagination | AC-2.1-04 |
| TC-2.2-01 | Resolve Tenant theo Query Domain | AC-2.2-01, AC-2.2-03 |
| TC-2.2-02 | Middleware Resolve Tenant theo Host Header | AC-2.2-01, AC-2.2-02 |
| TC-2.2-03 | Fallback Admin Domain và Domain không hợp lệ | AC-2.2-02, AC-2.2-04 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `8`
- Tổng số Test Case: `8`
- AC có coverage:
  - AC-2.1-01: 3 test case
  - AC-2.1-02: 3 test case
  - AC-2.1-03: 1 test case
  - AC-2.1-04: 1 test case
  - AC-2.2-01: 2 test case
  - AC-2.2-02: 2 test case
  - AC-2.2-03: 2 test case
  - AC-2.2-04: 1 test case
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Test Case: TC-2.1-01 - Tạo mới Tenant với đầy đủ Branding

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.1-01  
**AC Covered:** AC-2.1-01, AC-2.1-02  

### Description
Xác minh LMS Admin có thể tạo mới tenant với đầy đủ thông tin code, name, domain (subdomain), logo, avatar, mô tả, watermark settings và trạng thái mặc định.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `TENANTS_CREATE`.
- Có sẵn access token hợp lệ cho user admin.
- Header `Authorization: Bearer <token>` được thiết lập.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `POST /api/admin/tenants` với payload hợp lệ gồm `name`, `code`, `subdomain`, `logoUrl`, `avatarUrl`, `description`, `watermarkSettings` | API trả về `201 Created` |
| 2 | Kiểm tra response body của API create | Có `tenantId` hợp lệ và không rỗng |
| 3 | Gọi API `GET /api/admin/tenants/{tenantId}` với `tenantId` từ bước 2 | API trả về `200 OK` với đúng tenant vừa tạo |
| 4 | Đối chiếu các trường branding trong response chi tiết tenant | `logoUrl`, `avatarUrl`, `description`, `watermarkSettings` khớp payload đã gửi |
| 5 | Gọi API `GET /api/admin/tenants?page=1&pageSize=20&search=<code>` | Tenant mới xuất hiện trong danh sách |

---

## Test Case: TC-2.1-02 - Cập nhật thông tin Tenant và Branding

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.1-02  
**AC Covered:** AC-2.1-01, AC-2.1-02, AC-2.2-03  

### Description
Xác minh LMS Admin có thể cập nhật thông tin tenant và các trường branding, dữ liệu sau cập nhật được phản ánh đúng ở API chi tiết và danh sách.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `TENANTS_UPDATE`.
- Đã có sẵn 1 tenant đang hoạt động.
- Có sẵn access token admin hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/tenants` để lấy `tenantId` cần cập nhật | Lấy được một `tenantId` hợp lệ |
| 2 | Gọi API `PUT /api/admin/tenants/{tenantId}` với dữ liệu mới cho `name`, `code`, `subdomain`, `logoUrl`, `avatarUrl`, `description`, `watermarkSettings` | API trả về `200 OK` |
| 3 | Gọi API `GET /api/admin/tenants/{tenantId}` | API trả về `200 OK` |
| 4 | So sánh dữ liệu chi tiết tenant sau cập nhật với payload cập nhật | Tất cả trường đã thay đổi phản ánh chính xác |
| 5 | Gọi API `GET /api/tenants/resolve?domain=<subdomain_moi>.daihoc.io.vn` | API resolve trả về tenant đã cập nhật và branding mới |

---

## Test Case: TC-2.1-03 - Ngưng hoạt động và kích hoạt lại Tenant

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.1-03  
**AC Covered:** AC-2.1-01, AC-2.1-02  

### Description
Xác minh API đổi trạng thái tenant hoạt động đúng cho các trạng thái hỗ trợ và phản ánh chính xác lên dữ liệu tenant.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `TENANTS_CHANGE_STATUS`.
- Có sẵn tenant ở trạng thái `ACTIVE`.
- Có sẵn access token admin hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `PATCH /api/admin/tenants/{tenantId}/status` với body `{ "status": "INACTIVE" }` | API trả về `204 No Content` |
| 2 | Gọi API `GET /api/admin/tenants/{tenantId}` | Tenant có `status = INACTIVE` |
| 3 | Gọi lại API đổi trạng thái với body `{ "status": "ACTIVE" }` | API trả về `204 No Content` |
| 4 | Gọi lại API chi tiết tenant | Tenant có `status = ACTIVE` |
| 5 | Gọi API đổi trạng thái với giá trị không hợp lệ (ví dụ `DISABLE`) | API trả về `400 Bad Request` |

---

## Test Case: TC-2.1-04 - Không cho phép trùng Tenant Code hoặc Domain

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-2.1-04  
**AC Covered:** AC-2.1-03  

### Description
Xác minh hệ thống từ chối tạo hoặc cập nhật tenant khi `code` hoặc `subdomain` đã tồn tại.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `TENANTS_CREATE` và `TENANTS_UPDATE`.
- Có sẵn ít nhất 2 tenant khác nhau.
- Có sẵn access token admin hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/tenants` lấy tenant A (`codeA`, `subdomainA`) và tenant B (`tenantIdB`) | Lấy được dữ liệu 2 tenant khác nhau |
| 2 | Gọi API `POST /api/admin/tenants` với `code = codeA` nhưng `subdomain` mới | API trả về `409 Conflict` hoặc `400 Bad Request` với thông báo trùng code |
| 3 | Gọi API `POST /api/admin/tenants` với `subdomain = subdomainA` nhưng `code` mới | API trả về `409 Conflict` hoặc `400 Bad Request` với thông báo trùng domain/subdomain |
| 4 | Gọi API `PUT /api/admin/tenants/{tenantIdB}` với `code = codeA` | API trả về lỗi trùng code |
| 5 | Gọi API `PUT /api/admin/tenants/{tenantIdB}` với `subdomain = subdomainA` | API trả về lỗi trùng domain/subdomain |

---

## Test Case: TC-2.1-05 - Danh sách Tenant hỗ trợ Search, Filter, Pagination

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.1-05  
**AC Covered:** AC-2.1-04  

### Description
Xác minh endpoint danh sách tenant hoạt động đúng với phân trang, tìm kiếm theo từ khóa và lọc theo trạng thái.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- User đăng nhập có quyền `TENANTS_VIEW`.
- Hệ thống có nhiều tenant với trạng thái khác nhau.
- Có sẵn access token admin hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/admin/tenants?page=1&pageSize=2` | API trả `200 OK`, có `items`, `total`, `page`, `pageSize` |
| 2 | Gọi API `GET /api/admin/tenants?page=2&pageSize=2` | Dữ liệu trang 2 khác trang 1 (nếu tổng bản ghi > 2) |
| 3 | Gọi API `GET /api/admin/tenants?search=<keyword_code_or_name>` | Chỉ trả về tenant khớp keyword ở `code`, `name` hoặc `subdomain` |
| 4 | Gọi API `GET /api/admin/tenants?status=ACTIVE` | Tất cả item trả về có `status = ACTIVE` |
| 5 | Kết hợp query `status`, `search`, `page`, `pageSize` | Kết quả vẫn chính xác theo bộ lọc và phân trang |

---

## Test Case: TC-2.2-01 - Resolve Tenant theo Query Domain

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.2-01  
**AC Covered:** AC-2.2-01, AC-2.2-03  

### Description
Xác minh endpoint resolve tenant hoạt động đúng khi nhận domain qua query param và trả về đầy đủ branding config của tenant tương ứng.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- Có sẵn tenant `stem` với domain hợp lệ `stem.daihoc.io.vn`.
- Endpoint resolve cho phép truy cập anonymous.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/tenants/resolve?domain=stem.daihoc.io.vn` | API trả về `200 OK` |
| 2 | Kiểm tra thông tin tenant trong response | `tenantCode`, `name`, `subdomain`, `domain` đúng với tenant `stem` |
| 3 | Kiểm tra trường `isAdminDomain` | Giá trị là `false` |
| 4 | Kiểm tra object `branding` | Có dữ liệu `logoUrl`, `avatarUrl`, `watermarkSettings` đúng theo tenant |
| 5 | Gọi lại endpoint với query domain viết hoa/thường khác nhau | Vẫn resolve đúng tenant (không phân biệt hoa thường) |

---

## Test Case: TC-2.2-02 - Middleware Resolve Tenant theo Host Header

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Integration Test  
**Attachments:** [None]  
**Id:** TC-2.2-02  
**AC Covered:** AC-2.2-01, AC-2.2-02  

### Description
Xác minh middleware resolve tenant tự động nhận diện tenant từ `Host` header và áp tenant context cho request.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- Có sẵn tenant `stem` active với domain `stem.daihoc.io.vn`.
- Có endpoint kiểm tra tenant context trong môi trường test (ví dụ endpoint probe nội bộ).

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi request đến endpoint probe tenant context với `Host: stem.daihoc.io.vn` | Request được xử lý thành công |
| 2 | Quan sát response của endpoint probe | Tenant context đã được resolve (`isResolved = true`) |
| 3 | Kiểm tra giá trị context trả về | `tenantId`, `tenantCode`, `subdomain` khớp tenant `stem` |
| 4 | Gửi request tương tự với `Host: unknown.daihoc.io.vn` | Middleware chặn request và trả `404 Not Found` |
| 5 | Gửi request với host local (`localhost`) | Middleware bỏ qua resolve tenant và không gán tenant context |

---

## Test Case: TC-2.2-03 - Fallback Admin Domain và Domain không hợp lệ

**Module:** Tenancy  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-2.2-03  
**AC Covered:** AC-2.2-02, AC-2.2-04  

### Description
Xác minh hệ thống fallback đúng về admin domain và xử lý đúng các domain không thể resolve.

### Precondition
- **AppURL:** `http://localhost` hoặc URL môi trường test của API.
- Có tenant admin với subdomain `admin` và domain admin cấu hình `id.daihoc.io.vn`.
- Endpoint resolve cho phép truy cập anonymous.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API `GET /api/tenants/resolve?domain=id.daihoc.io.vn` | API trả `200 OK` |
| 2 | Kiểm tra response khi resolve admin domain | `isAdminDomain = true`, tenant trả về là tenant admin |
| 3 | Gọi API `GET /api/tenants/resolve?domain=unknown.daihoc.io.vn` (domain đúng pattern nhưng tenant không tồn tại) | API trả `404 Not Found` |
| 4 | Gọi API `GET /api/tenants/resolve?domain=invalid-domain-format` (domain không hợp lệ theo rule) | API trả `400 Bad Request` |
| 5 | Kiểm tra thông điệp lỗi của step 3 và 4 | Message lỗi phản ánh đúng trường hợp không resolve được tenant hoặc domain không hợp lệ |
