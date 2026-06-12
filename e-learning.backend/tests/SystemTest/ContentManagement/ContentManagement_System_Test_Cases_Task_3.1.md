# System Test Cases: Task 3.1 - Quản lý Cây Học liệu (Curriculum Tree)

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional  
**Attachments:** [None]  
**Id:** ST-CONTENT-3.1  

## Scope
- Task 3.1 — Quản lý Cây Học liệu (Curriculum Tree)
- API phạm vi kiểm thử:
  - GET /api/tenants/{tenantId}/curriculum
  - GET /api/tenants/{tenantId}/curriculum/{nodeId}/children
  - POST /api/tenants/{tenantId}/curriculum
  - PUT /api/tenants/{tenantId}/curriculum/{nodeId}
  - DELETE /api/tenants/{tenantId}/curriculum/{nodeId}
  - PATCH /api/tenants/{tenantId}/curriculum/reorder

## Acceptance Criteria Index

- **AC-3.1-01:** Tạo / sửa / xóa node theo mô hình cây linh hoạt dựa trên parent_id
- **AC-3.1-02:** Hỗ trợ sắp xếp thứ tự hiển thị (sort_order)
- **AC-3.1-03:** Không xóa node đang có nội dung hoặc node con
- **AC-3.1-04:** Validate trùng tên trong cùng cấp
- **AC-3.1-05:** API trả về cây đầy đủ cho CMS và Client

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-3.1-01 | Lấy toàn bộ cây học liệu theo tenant | AC-3.1-05 |
| TC-3.1-02 | Lấy node con theo nodeId | AC-3.1-05 |
| TC-3.1-03 | Tạo root node với nodeType tự do thành công | AC-3.1-01 |
| TC-3.1-04 | Tạo node con với nodeType tự định nghĩa thành công | AC-3.1-01 |
| TC-3.1-05 | Từ chối tạo node khi parent không tồn tại | AC-3.1-01 |
| TC-3.1-06 | Không cho phép trùng title trong cùng parent | AC-3.1-04 |
| TC-3.1-07 | Cập nhật node thành công | AC-3.1-01 |
| TC-3.1-08 | Sắp xếp lại thứ tự node cùng cấp | AC-3.1-02 |
| TC-3.1-09 | Không cho xóa node còn child | AC-3.1-03 |
| TC-3.1-10 | Không cho xóa node còn content | AC-3.1-03 |
| TC-3.1-11 | Xóa node lá khi không còn phụ thuộc | AC-3.1-01, AC-3.1-03 |
| TC-3.1-12 | Tenant scope mismatch bị chặn | AC-3.1-01, AC-3.1-05 |

## Coverage Summary
- Tổng số Acceptance Criteria cần cover: **5**
- Tổng số Test Case: **12**
- AC có coverage:
  - AC-3.1-01: 6 test case
  - AC-3.1-02: 1 test case
  - AC-3.1-03: 3 test case
  - AC-3.1-04: 1 test case
  - AC-3.1-05: 3 test case
- Kết luận coverage: **Đủ cover toàn bộ acceptance criteria, không có AC bị miss**.

---

## Test Case: TC-3.1-01 - Lấy toàn bộ cây học liệu theo tenant

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-01  
**AC Covered:** AC-3.1-05  

### Description
Xác minh API trả về đầy đủ cây học liệu của một tenant, bao gồm quan hệ cha-con và thứ tự hiển thị.

### Precondition
- AppURL là URL môi trường test của API.
- User đăng nhập có quyền CURRICULUM_VIEW trong tenant đang test.
- Có sẵn ít nhất 1 cây dữ liệu mẫu với nhiều cấp node.
- Header Authorization: Bearer <token> hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi API GET /api/tenants/{tenantId}/curriculum | API trả 200 OK |
| 2 | Kiểm tra cấu trúc response | Response là mảng node root, mỗi node có trường children |
| 3 | Kiểm tra depth của cây | Dữ liệu thể hiện đúng quan hệ parent-child đã lưu |
| 4 | Kiểm tra tenantId của mọi node | Tất cả node đều thuộc tenantId đang gọi |
| 5 | Kiểm tra thứ tự node trong cùng cấp | Node được sắp theo sortOrder tăng dần, sau đó theo title |

---

## Test Case: TC-3.1-02 - Lấy node con theo nodeId

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-02  
**AC Covered:** AC-3.1-05  

### Description
Xác minh API trả đúng danh sách node con trực tiếp của một node cha.

### Precondition
- User có quyền CURRICULUM_VIEW.
- Có sẵn node cha có từ 2 node con trở lên.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Lấy nodeId cha từ cây hiện có | Có nodeId hợp lệ |
| 2 | Gọi API GET /api/tenants/{tenantId}/curriculum/{nodeId}/children | API trả 200 OK |
| 3 | Kiểm tra parentId trong các item trả về | Tất cả item có parentId = nodeId đã gọi |
| 4 | Kiểm tra không trả node cháu | Chỉ trả node con trực tiếp, không trả node sâu hơn |
| 5 | Kiểm tra thứ tự dữ liệu | Dữ liệu sắp theo sortOrder tăng dần |

---

## Test Case: TC-3.1-03 - Tạo root node với nodeType tự do thành công

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-03  
**AC Covered:** AC-3.1-01  

### Description
Xác minh có thể tạo node root với nodeType tự do khi không có parentId.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Tenant đang hoạt động.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi POST /api/tenants/{tenantId}/curriculum với body: { parentId: null, nodeType: "LearningTrack", title: "Chuong trinh test", sortOrder: 1 } | API trả 201 Created |
| 2 | Kiểm tra response body | Có nodeId hợp lệ |
| 3 | Gọi GET /api/tenants/{tenantId}/curriculum | Node mới xuất hiện ở root |
| 4 | Kiểm tra thuộc tính node mới | nodeType = LearningTrack, parentId = null |

---

## Test Case: TC-3.1-04 - Tạo node con với nodeType tự định nghĩa thành công

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-04  
**AC Covered:** AC-3.1-01  

### Description
Xác minh có thể tạo node con với nodeType tự định nghĩa miễn parent hợp lệ.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Đã có sẵn node cha hợp lệ.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi POST tạo node con với nodeType = "CapConTuDinhNghia" dưới parent hợp lệ | API trả 201 Created |
| 2 | Gọi POST tạo node cháu với nodeType = "CapTiepTheo" | API trả 201 Created |
| 3 | Gọi GET tree kiểm tra quan hệ | Cây hiển thị đúng quan hệ parent-child đã tạo |

---

## Test Case: TC-3.1-05 - Từ chối tạo node khi parent không tồn tại

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.1-05  
**AC Covered:** AC-3.1-01  

### Description
Xác minh API từ chối khi parentId không tồn tại trong tenant đang thao tác.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- User có quyền CURRICULUM_MANAGE.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi POST /api/tenants/{tenantId}/curriculum với parentId là GUID không tồn tại, nodeType = "AnyType" | API trả 400 Bad Request |
| 2 | Kiểm tra nội dung lỗi | Lỗi mô tả parent không tồn tại trong tenant |
| 3 | Gọi GET tree | Không có node mới được tạo |

---

## Test Case: TC-3.1-06 - Không cho phép trùng title trong cùng parent

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.1-06  
**AC Covered:** AC-3.1-04  

### Description
Xác minh không thể tạo hoặc sửa node dẫn đến trùng title trong cùng parent.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Dưới cùng một parent đã có node title = "Khoi 10".

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi POST tạo node mới cùng parent với title = "Khoi 10" | API trả 400 Bad Request |
| 2 | Kiểm tra thông báo lỗi | Có thông báo trùng title cùng cấp |
| 3 | Gọi PUT sửa node khác thành title = "Khoi 10" trong cùng parent | API trả 400 Bad Request |
| 4 | Kiểm tra dữ liệu hiện tại | Không có thay đổi ngoài ý muốn |

---

## Test Case: TC-3.1-07 - Cập nhật node thành công

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-07  
**AC Covered:** AC-3.1-01  

### Description
Xác minh cập nhật được title, code, sortOrder, status của node hiện có.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Có node hợp lệ để cập nhật.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi PUT /api/tenants/{tenantId}/curriculum/{nodeId} với title/code/sortOrder/status mới | API trả 200 OK |
| 2 | Kiểm tra response body | Dữ liệu phản ánh giá trị mới |
| 3 | Gọi GET tree | Node hiển thị đúng thông tin sau cập nhật |
| 4 | Thử cập nhật status không hợp lệ (VD: DISABLED) | API trả 400 Bad Request |

---

## Test Case: TC-3.1-08 - Sắp xếp lại thứ tự node cùng cấp

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-08  
**AC Covered:** AC-3.1-02  

### Description
Xác minh API reorder cập nhật sortOrder của toàn bộ sibling đúng theo thứ tự mới.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Có ít nhất 3 node cùng parent.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Lấy danh sách sibling hiện tại | Có danh sách ID node cùng cấp |
| 2 | Gọi PATCH /api/tenants/{tenantId}/curriculum/reorder với orderedNodeIds đảo thứ tự | API trả 204 No Content |
| 3 | Gọi lại GET children của parent | Thứ tự node đã đổi đúng theo payload reorder |
| 4 | Gọi reorder với danh sách thiếu 1 sibling | API trả 400 Bad Request |
| 5 | Gọi reorder có ID trùng lặp | API trả 400 Bad Request |

---

## Test Case: TC-3.1-09 - Không cho xóa node còn child

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.1-09  
**AC Covered:** AC-3.1-03  

### Description
Xác minh hệ thống từ chối xóa node nếu node đó vẫn còn node con.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Có node cha đang chứa ít nhất 1 node con.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi DELETE /api/tenants/{tenantId}/curriculum/{nodeChaId} | API trả 400 Bad Request |
| 2 | Kiểm tra thông báo lỗi | Có thông báo không thể xóa node còn child |
| 3 | Gọi GET tree | Node cha và node con vẫn tồn tại |

---

## Test Case: TC-3.1-10 - Không cho xóa node còn content

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.1-10  
**AC Covered:** AC-3.1-03  

### Description
Xác minh hệ thống từ chối xóa node nếu node đó đã gắn content_item.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Có node lá đã có ít nhất 1 content_item liên kết.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi DELETE /api/tenants/{tenantId}/curriculum/{nodeLaId} | API trả 400 Bad Request |
| 2 | Kiểm tra thông báo lỗi | Có thông báo không thể xóa node còn content |
| 3 | Kiểm tra dữ liệu trong tree | Node vẫn tồn tại |

---

## Test Case: TC-3.1-11 - Xóa node lá khi không còn phụ thuộc

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.1-11  
**AC Covered:** AC-3.1-01, AC-3.1-03  

### Description
Xác minh có thể xóa node lá khi node không có child và không có content.

### Precondition
- User có quyền CURRICULUM_MANAGE.
- Có node lá không còn phụ thuộc.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi DELETE /api/tenants/{tenantId}/curriculum/{nodeId} | API trả 204 No Content |
| 2 | Gọi GET children của parent | Node vừa xóa không còn xuất hiện |
| 3 | Gọi lại DELETE node đó | API trả 404 Not Found |

---

## Test Case: TC-3.1-12 - Tenant scope mismatch bị chặn

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Attachments:** [None]  
**Id:** TC-3.1-12  
**AC Covered:** AC-3.1-01, AC-3.1-05  

### Description
Xác minh user không thể thao tác curriculum của tenant khác dù biết tenantId trên URL.

### Precondition
- Token hiện tại thuộc tenant A.
- Hệ thống có tenant B khác tenant A.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Gọi GET /api/tenants/{tenantB}/curriculum bằng token tenant A | API trả 403 Forbidden |
| 2 | Gọi POST /api/tenants/{tenantB}/curriculum bằng token tenant A | API trả 403 Forbidden |
| 3 | Gọi PATCH reorder của tenant B bằng token tenant A | API trả 403 Forbidden |
| 4 | Kiểm tra dữ liệu tenant B | Không có thay đổi dữ liệu |
