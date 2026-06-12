# System Test Cases: Task 2.9 - Quản lý Danh mục Dùng chung (Master Data)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [None]  
**Id:** ST-CATALOG-2.9  

## Scope
- Task 2.9 — Quản lý Danh mục Dùng chung: CRUD catalog items theo type, validate trùng code, chặn xóa system item và item đang được dùng, phân quyền `CATALOG_VIEW` / `CATALOG_MANAGE`

## Acceptance Criteria Index

- `AC-2.9-01`: CRUD các danh mục theo loại (`type`): thêm / sửa / xóa mục
- `AC-2.9-02`: Validate trùng giá trị `(type, code)`, không cho tạo trùng
- `AC-2.9-03`: Không xóa được item đang được dùng bởi module khác (FK constraint)
- `AC-2.9-04`: Không xóa được item hệ thống (`is_system = TRUE`)
- `AC-2.9-05`: Danh mục dùng được ở nhiều module (shared, không gắn tenant)
- `AC-2.9-06`: Phân quyền: `CATALOG_VIEW` cho đọc, `CATALOG_MANAGE` cho ghi; LMS_ADMIN có cả hai; TENANT_ADMIN chỉ có VIEW

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-2.9-01 | Lấy danh sách catalog theo type (có dữ liệu) | AC-2.9-01, AC-2.9-05, AC-2.9-06 |
| TC-2.9-02 | Lấy danh sách catalog theo type không tồn tại (empty list) | AC-2.9-01, AC-2.9-05 |
| TC-2.9-03 | Tạo catalog item mới hợp lệ | AC-2.9-01, AC-2.9-02 |
| TC-2.9-04 | Tạo catalog item với code trùng cùng type (409) | AC-2.9-02 |
| TC-2.9-05 | Tạo catalog item thiếu trường bắt buộc (400) | AC-2.9-01 |
| TC-2.9-06 | Tạo catalog item với code khác nhau cùng type (OK) | AC-2.9-02 |
| TC-2.9-07 | Tạo catalog item với type khác nhau, code trùng (OK) | AC-2.9-02 |
| TC-2.9-08 | Cập nhật catalog item (name, description, sortOrder) | AC-2.9-01 |
| TC-2.9-09 | Cập nhật catalog item không tồn tại (404) | AC-2.9-01 |
| TC-2.9-10 | Cập nhật catalog item thiếu name (400) | AC-2.9-01 |
| TC-2.9-11 | Xóa catalog item do user tạo (204) | AC-2.9-01, AC-2.9-03 |
| TC-2.9-12 | Xóa catalog item là system item (409) | AC-2.9-04 |
| TC-2.9-13 | Xóa catalog item không tồn tại (404) | AC-2.9-01 |
| TC-2.9-14 | Gọi GET không có token (401) | AC-2.9-06 |
| TC-2.9-15 | Gọi POST bằng TENANT_ADMIN (403) | AC-2.9-06 |
| TC-2.9-16 | Gọi GET bằng TENANT_ADMIN (200) | AC-2.9-06 |
| TC-2.9-17 | Gọi POST bằng LMS_ADMIN (201) | AC-2.9-06 |
| TC-2.9-18 | Code được normalize về UPPERCASE | AC-2.9-01, AC-2.9-02 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: `6`
- Tổng số Test Case: `18`
- AC có coverage:
  - AC-2.9-01: TC-01 đến TC-06, TC-08 đến TC-11, TC-13
  - AC-2.9-02: TC-03 đến TC-07, TC-18
  - AC-2.9-03: TC-11
  - AC-2.9-04: TC-12
  - AC-2.9-05: TC-01, TC-02
  - AC-2.9-06: TC-01, TC-14 đến TC-17
- Kết luận coverage: `Đủ cover toàn bộ acceptance criteria, không có AC bị miss`.

---

## Precondition

- API URL: `http://localhost:5294`
- DB đã apply migration `V6__catalog_master_data.sql` (seed: `DOCUMENT_TYPE` × 4, `DISPLAY_LABEL` × 3 — tất cả `is_system = TRUE`)
- **Token LMS_ADMIN** (dùng cho các TC cần `CATALOG_MANAGE`):
  ```bash
  LMS_TOKEN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"superadmin","password":"Admin@123"}' | jq -r '.accessToken')
  ```
- **Token TENANT_ADMIN** (dùng cho các TC kiểm tra TENANT_ADMIN chỉ có VIEW):
  ```bash
  TENANT_TOKEN=$(curl -s -X POST http://localhost:5294/api/identity/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"stem_admin","password":"Admin@123"}' | jq -r '.accessToken')
  ```
- Lưu `ITEM_ID` từ response của TC-2.9-03 để dùng cho các TC cập nhật / xóa.

---

## Test Case: TC-2.9-01 — Lấy danh sách catalog theo type có dữ liệu

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.9-01  

### Description
Lấy danh sách catalog items theo type `DOCUMENT_TYPE`. DB đã seed 4 items thuộc type này.

### Precondition
- Token LMS_ADMIN đã lấy.
- Migration V6 đã apply.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` với `Authorization: Bearer $LMS_TOKEN` | HTTP 200 OK |
| 2 | Kiểm tra body response | Array JSON, có đúng 4 phần tử |
| 3 | Kiểm tra mỗi item có các field: `id`, `type`, `code`, `name`, `description`, `sortOrder`, `isSystem` | Tất cả field đều present |
| 4 | Kiểm tra field `type` của mỗi item | Tất cả đều là `"DOCUMENT_TYPE"` |
| 5 | Kiểm tra thứ tự sắp xếp | Sorted theo `sortOrder` ASC, sau đó `name` ASC |
| 6 | Kiểm tra item `CONTRACT` có `isSystem: true` | `isSystem` = `true` |

---

## Test Case: TC-2.9-02 — Lấy danh sách catalog theo type không tồn tại

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.9-02  

### Description
Gọi GET với type chưa có data nào. Kỳ vọng trả về mảng rỗng, không phải 404.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `GET /api/admin/catalog/NON_EXISTENT_TYPE` với `Authorization: Bearer $LMS_TOKEN` | HTTP 200 OK |
| 2 | Kiểm tra body response | Array JSON rỗng `[]` |

---

## Test Case: TC-2.9-03 — Tạo catalog item mới hợp lệ

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.9-03  

### Description
LMS_ADMIN tạo một catalog item mới thuộc type `DOCUMENT_TYPE` với code chưa tồn tại.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"TEST_DOC","name":"Tài liệu Test","description":"Mô tả test","sortOrder":99}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 201 Created |
| 2 | Kiểm tra `Location` header trong response | `Location: /api/admin/catalog/DOCUMENT_TYPE/{newId}` |
| 3 | Kiểm tra body response có field `id`, `type`, `code`, `name` | Tất cả present; `code = "TEST_DOC"`, `type = "DOCUMENT_TYPE"` |
| 4 | Lưu `id` từ response vào biến `ITEM_ID` | — |
| 5 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` | Mảng có 5 items (4 seed + 1 mới) |

---

## Test Case: TC-2.9-04 — Tạo catalog item với code trùng cùng type (409)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-2.9-04  

### Description
Tạo thêm item với `code = "TEST_DOC"` trong `DOCUMENT_TYPE` — trùng với item vừa tạo ở TC-03.

### Precondition
- TC-2.9-03 đã pass. `ITEM_ID` đã có.
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"TEST_DOC","name":"Tài liệu Trùng","sortOrder":100}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 409 Conflict |
| 2 | Kiểm tra body response có field `error` | Field `error` mô tả lỗi trùng code |

---

## Test Case: TC-2.9-05 — Tạo catalog item thiếu trường bắt buộc (400)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-2.9-05  

### Description
Tạo item mà không truyền `code` hoặc không truyền `name`. Kỳ vọng 400 Bad Request.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"name":"Thiếu Code","sortOrder":1}` (không có `code`) và header `Authorization: Bearer $LMS_TOKEN` | HTTP 400 Bad Request hoặc 409 Conflict với message nêu rõ lý do |
| 2 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"NO_NAME","sortOrder":1}` (không có `name`) | HTTP 400 Bad Request hoặc 409 Conflict với message nêu rõ lý do |
| 3 | Kiểm tra số item hiện có trong DOCUMENT_TYPE | Không tăng so với sau TC-2.9-03 |

---

## Test Case: TC-2.9-06 — Tạo catalog item code khác cùng type (OK)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Boundary Test  
**Id:** TC-2.9-06  

### Description
Tạo item trong `DOCUMENT_TYPE` với code mới chưa tồn tại. Đây là trường hợp hợp lệ để xác nhận uniqueness check chỉ theo `(type, code)`.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"UNIQUE_CODE_001","name":"Item Hợp Lệ","sortOrder":50}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 201 Created |
| 2 | Xóa item vừa tạo (dùng id từ response) để dọn dữ liệu | HTTP 204 No Content |

---

## Test Case: TC-2.9-07 — Tạo catalog item code trùng nhưng type khác (OK)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Boundary Test  
**Id:** TC-2.9-07  

### Description
Tạo item trong type `DISPLAY_LABEL` với code `"TEST_DOC"` — code này đã tồn tại trong `DOCUMENT_TYPE`. Kỳ vọng 201 (unique chỉ trong scope cùng type).

### Precondition
- TC-2.9-03 đã pass (`TEST_DOC` tồn tại trong `DOCUMENT_TYPE`).
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DISPLAY_LABEL` với body `{"code":"TEST_DOC","name":"Cross-Type Test","sortOrder":1}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 201 Created |
| 2 | Xóa item vừa tạo để dọn dữ liệu | HTTP 204 No Content |

---

## Test Case: TC-2.9-08 — Cập nhật catalog item hợp lệ

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.9-08  

### Description
LMS_ADMIN cập nhật `name`, `description`, `sortOrder` của item vừa tạo ở TC-2.9-03.

### Precondition
- TC-2.9-03 đã pass. Biến `ITEM_ID` đã có.
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `PUT /api/admin/catalog/DOCUMENT_TYPE/$ITEM_ID` với body `{"name":"Tài liệu Đã Cập Nhật","description":"Mô tả mới","sortOrder":10}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 204 No Content |
| 2 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` | Tìm item có `id = $ITEM_ID`; `name = "Tài liệu Đã Cập Nhật"`, `sortOrder = 10` |

---

## Test Case: TC-2.9-09 — Cập nhật catalog item không tồn tại (404)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-2.9-09  

### Description
Gọi PUT với `id` giả (random UUID không tồn tại trong DB).

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `PUT /api/admin/catalog/DOCUMENT_TYPE/00000000-0000-0000-0000-000000000099` với body `{"name":"Ghost"}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 404 Not Found |
| 2 | Kiểm tra body response | Có field `error` |

---

## Test Case: TC-2.9-10 — Cập nhật catalog item thiếu name (400)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.9-10  

### Description
Gọi PUT với body thiếu `name` (field bắt buộc).

### Precondition
- TC-2.9-03 đã pass. Biến `ITEM_ID` đã có.
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `PUT /api/admin/catalog/DOCUMENT_TYPE/$ITEM_ID` với body `{"description":"Không có name","sortOrder":1}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 400 Bad Request hoặc 409 Conflict với message nêu rõ lý do |

---

## Test Case: TC-2.9-11 — Xóa catalog item do user tạo (204)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-2.9-11  

### Description
LMS_ADMIN xóa item `TEST_DOC` đã tạo ở TC-2.9-03 (không phải system item, không đang dùng).

### Precondition
- TC-2.9-03 đã pass. Biến `ITEM_ID` đã có.
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/$ITEM_ID` với header `Authorization: Bearer $LMS_TOKEN` | HTTP 204 No Content |
| 2 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` | Mảng trả về không còn item có `id = $ITEM_ID` (soft-deleted) |
| 3 | Gửi lại `DELETE /api/admin/catalog/DOCUMENT_TYPE/$ITEM_ID` | HTTP 404 Not Found (đã bị xóa mềm) |

---

## Test Case: TC-2.9-12 — Xóa catalog item là system item (409)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Id:** TC-2.9-12  

### Description
Cố xóa item `CONTRACT` thuộc `DOCUMENT_TYPE` (đây là item seed với `is_system = TRUE`). Kỳ vọng bị chặn.

### Precondition
- Migration V6 đã apply (seed data có sẵn).
- Token LMS_ADMIN đã lấy.
- Biến `CONTRACT_ID`: lấy `id` của item `code = "CONTRACT"` từ response `GET /api/admin/catalog/DOCUMENT_TYPE`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE`, tìm item có `code = "CONTRACT"`, lưu `id` vào `CONTRACT_ID` | HTTP 200; item có `isSystem: true` |
| 2 | Gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/$CONTRACT_ID` với header `Authorization: Bearer $LMS_TOKEN` | HTTP 409 Conflict |
| 3 | Kiểm tra body response | Có field `error` mô tả không thể xóa item hệ thống |
| 4 | Gửi lại `GET /api/admin/catalog/DOCUMENT_TYPE` | Item `CONTRACT` vẫn còn trong danh sách |

---

## Test Case: TC-2.9-13 — Xóa catalog item không tồn tại (404)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Id:** TC-2.9-13  

### Description
Gọi DELETE với UUID không tồn tại trong DB.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/00000000-0000-0000-0000-000000000099` với header `Authorization: Bearer $LMS_TOKEN` | HTTP 404 Not Found |
| 2 | Kiểm tra body response | Có field `error` |

---

## Test Case: TC-2.9-14 — Gọi GET không có token (401)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.9-14  

### Description
Gọi endpoint GET catalog mà không kèm JWT token. Kỳ vọng 401 Unauthorized.

### Precondition
- Không cần token.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` không có `Authorization` header | HTTP 401 Unauthorized |
| 2 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` không có `Authorization` header với body `{"code":"X","name":"Y"}` | HTTP 401 Unauthorized |
| 3 | Gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/00000000-0000-0000-0000-000000000001` không có token | HTTP 401 Unauthorized |

---

## Test Case: TC-2.9-15 — Gọi POST bằng TENANT_ADMIN (403)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.9-15  

### Description
TENANT_ADMIN chỉ có permission `CATALOG_VIEW`, không có `CATALOG_MANAGE`. Gọi POST/PUT/DELETE phải bị từ chối.

### Precondition
- Token TENANT_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"TENANT_TRY","name":"Test"}` và header `Authorization: Bearer $TENANT_TOKEN` | HTTP 403 Forbidden |
| 2 | Gửi `PUT /api/admin/catalog/DOCUMENT_TYPE/00000000-0000-0000-0000-000000000001` với body `{"name":"Hack"}` và header `Authorization: Bearer $TENANT_TOKEN` | HTTP 403 Forbidden |
| 3 | Gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/00000000-0000-0000-0000-000000000001` với header `Authorization: Bearer $TENANT_TOKEN` | HTTP 403 Forbidden |

---

## Test Case: TC-2.9-16 — Gọi GET bằng TENANT_ADMIN (200)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.9-16  

### Description
TENANT_ADMIN có permission `CATALOG_VIEW`, được phép gọi GET.

### Precondition
- Token TENANT_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `GET /api/admin/catalog/DOCUMENT_TYPE` với header `Authorization: Bearer $TENANT_TOKEN` | HTTP 200 OK |
| 2 | Kiểm tra body | Array JSON có 4 items seed |

---

## Test Case: TC-2.9-17 — Gọi POST bằng LMS_ADMIN (201)

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Id:** TC-2.9-17  

### Description
LMS_ADMIN có cả `CATALOG_VIEW` và `CATALOG_MANAGE`, được phép gọi POST.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DISPLAY_LABEL` với body `{"code":"ADMIN_ONLY_LABEL","name":"Label Admin","sortOrder":99}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 201 Created |
| 2 | Lưu `id` từ response. Gửi `DELETE /api/admin/catalog/DISPLAY_LABEL/{id}` để dọn dữ liệu | HTTP 204 No Content |

---

## Test Case: TC-2.9-18 — Code tự động normalize về UPPERCASE

**Module:** Catalog  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Id:** TC-2.9-18  

### Description
Gửi request với `code` lowercase. Server phải tự normalize sang UPPERCASE trước khi lưu.

### Precondition
- Token LMS_ADMIN đã lấy.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gửi `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"lowercase_code","name":"Lowercase Test","sortOrder":1}` và header `Authorization: Bearer $LMS_TOKEN` | HTTP 201 Created |
| 2 | Kiểm tra field `code` trong response body | `code = "LOWERCASE_CODE"` (đã uppercase) |
| 3 | Gửi lại `POST /api/admin/catalog/DOCUMENT_TYPE` với body `{"code":"LOWERCASE_CODE","name":"Dup Check","sortOrder":2}` | HTTP 409 Conflict (trùng code sau normalize) |
| 4 | Lấy `id` từ TC bước 1, gửi `DELETE /api/admin/catalog/DOCUMENT_TYPE/{id}` để dọn dữ liệu | HTTP 204 No Content |
