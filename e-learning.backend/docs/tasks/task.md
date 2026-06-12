# LMS Task Roadmap

> Các task được tổ chức theo **5 Phase phát triển**, gắn với từng Portal và Backend Module cụ thể.  
> Mỗi task có: Portal chủ, Module backend, Dependencies, API endpoints cần xây dựng.

---

## Chú giải

| Ký hiệu | Ý nghĩa |
|---|---|
| **Portal** | Centralized Auth · Admin Portal · Tenant Portal · Client Portal |
| **Module** | Backend module phụ trách trong `src/Modules/` |
| **Status** | `[ ]` not-started · `[~]` in-progress · `[x]` completed |

---

# PHASE 0 — Infrastructure & Core Setup

## P0.1 — Database Schema & Seed Data
**Module:** Database  
**Dependencies:** —

- [x] `V1__initial_schema.sql` — toàn bộ bảng chính (tenants, users, schools, content, permissions, audit_logs)
- [x] `V2__seed_dev.sql` — dữ liệu mẫu để dev/test
- [x] Đảm bảo indexes cho các cột truy vấn thường xuyên: `tenant_id`, `user_id`, `content_id`, `domain`
- [x] `V5__remove_student_cleanup.sql` — xóa STUDENT khỏi enum, thêm `is_inherited` vào user_tenant_role_assignment
- [x] `V11__content_team_roles.sql` — thêm roles CONTENT_CREATOR, CONTENT_REVIEWER với permission mapping tương ứng

---

# PHASE 1 — Centralized Identity Portal (id.daihoc.io.vn)

> Đây là cửa ngõ xác thực duy nhất. Tất cả 3 portal đều redirect về đây để đăng nhập.

## 1.1 — Identifier-First Login Flow (Bước nhập định danh)
**Portal:** Centralized Auth  
**Module:** Identity  
**Dependencies:** P0.1

**Mô tả:** User nhập email/username → hệ thống tra cứu tenant → trả về config branding phù hợp trước khi hiển thị bước nhập mật khẩu.

**Acceptance Criteria**
- [x] API nhận email/username, trả về tenant info + branding config (logo, màu, tên)
- [x] Nếu user thuộc 1 tenant → tự động áp branding white-label
- [x] Nếu là Super Admin hoặc multi-tenant user → giữ branding mặc định hệ thống
- [x] Email/username không tồn tại → trả về lỗi generic (không tiết lộ user có tồn tại hay không)

**Backend Endpoints:**
```
POST /identity/identify    - Nhận identifier, trả về { tenantBranding?, nextStep }
```

---

## 1.2 — Authentication (Bước xác thực mật khẩu + cấp token)
**Portal:** Centralized Auth  
**Module:** Identity  
**Dependencies:** 1.1

**Mô tả:** User nhập mật khẩu → hệ thống xác thực, kiểm tra trạng thái tài khoản/trường học, cấp JWT.

**Acceptance Criteria**
- [x] Đăng nhập thành công trả về `access_token` + `refresh_token`
- [x] Kiểm tra tài khoản bị khóa, trường hết hạn hợp đồng → từ chối với thông báo rõ ràng
- [x] Brute-force protection: khóa tạm thời sau N lần sai liên tiếp
- [x] Ghi audit log mỗi lần login thành công/thất bại
- [x] Đổi mật khẩu → tự động thu hồi tất cả session khác, ghi audit log `PASSWORD_CHANGED`

**Backend Endpoints:**
```
POST /identity/login                - Đăng nhập, cấp token
POST /identity/refresh-token        - Làm mới access token
POST /identity/logout               - Thu hồi refresh token, kết thúc session
POST /identity/auth/change-password - Đổi mật khẩu + revoke other sessions
```

---

## 1.3 — Workspace Selector (Chọn tenant khi đa tenant)
**Portal:** Centralized Auth  
**Module:** Identity  
**Dependencies:** 1.2

**Mô tả:** User thuộc nhiều tenant → sau khi login hiển thị màn hình chọn workspace (tenant) trước khi vào dashboard.

**Acceptance Criteria**
- [x] API trả về danh sách tenant user được gán (còn hiệu lực)
- [x] User chọn tenant → token được scope vào tenant đó
- [x] Có thể chuyển tenant trong session (Tenant Switcher)
- [x] Tenant hết hạn hợp đồng không hiển thị trong danh sách

**Backend Endpoints:**
```
GET  /identity/workspaces                        - Danh sách tenant user được phép truy cập
POST /identity/workspaces/{tenantId}/select      - Chọn/chuyển sang tenant
```

---

## 1.4 — Concurrent Session Management (Giới hạn đăng nhập đồng thời)
**Portal:** Centralized Auth  
**Module:** Identity  
**Dependencies:** 1.2

**Mô tả:** Kiểm soát số session đồng thời theo cấu hình, xử lý vượt ngưỡng (block hoặc kick session cũ).

**Acceptance Criteria**
- [x] Cấu hình `max_concurrent_sessions` theo user hoặc loại tài khoản
- [x] Khi vượt ngưỡng: thực hiện policy `Block` (từ chối login mới) hoặc `Kick` (đá session cũ nhất)
- [x] API xem danh sách session đang active của bản thân
- [x] API cho Admin xem/hủy session của bất kỳ user nào
- [x] Ghi log đầy đủ các sự kiện session

**Backend Endpoints:**
```
GET    /identity/sessions              - Danh sách session active của current user
DELETE /identity/sessions/{sessionId}  - Thu hồi 1 session
DELETE /identity/sessions              - Thu hồi tất cả session khác (logout everywhere)
GET    /admin/users/{userId}/sessions  - Admin xem session của user bất kỳ
DELETE /admin/users/{userId}/sessions  - Admin hủy toàn bộ session của user
```

---

# PHASE 2 — LMS Admin Portal

> Dành cho Super Admin. Quản lý toàn hệ thống: Tenant, Schools, Users, License, Audit.

## 2.1 — Quản lý Tenant và Branding
**Portal:** Admin Portal  
**Module:** Tenancy  
**Dependencies:** P0.1  
**Mockup:** `docs/mockup/Admin/Tenant.html`

**Acceptance Criteria**
- [x] Tạo / sửa / ngưng hoạt động tenant
- [x] Quản lý: code, name, domain, logo, avatar, mô tả, trạng thái
- [x] Không cho phép trùng `domain` hoặc `tenant_code`
- [x] Danh sách tenant có search, filter theo trạng thái, phân trang

**Backend Endpoints:**
```
GET    /admin/tenants                       - Danh sách (filter, search, paginate)
POST   /admin/tenants                       - Tạo tenant mới
GET    /admin/tenants/{tenantId}            - Chi tiết
PUT    /admin/tenants/{tenantId}            - Cập nhật thông tin + branding
PATCH  /admin/tenants/{tenantId}/status     - Ngưng/kích hoạt
```

---

## 2.2 — Resolve Tenant theo Domain (Tenant Context Middleware)
**Portal:** Tất cả Portal  
**Module:** Tenancy  
**Dependencies:** 2.1

**Acceptance Criteria**
- [x] Middleware resolve đúng tenant từ `Host` header hoặc query param
- [x] Domain không khớp → trả về 404 hoặc redirect trang lỗi phù hợp
- [x] Branding config được trả về theo tenant đã resolve
- [x] Fallback về admin domain (`id.daihoc.io.vn`) nếu không match tenant nào

**Backend Endpoints:**
```
GET /tenants/resolve?domain={domain}   - Resolve tenant + trả branding config
```

---

## 2.3 — Quản lý Trường học (Schools)
**Portal:** Admin Portal  
**Module:** Schools  
**Dependencies:** P0.1  
**Mockup:** `docs/mockup/Admin/school.html`

**Acceptance Criteria**
- [x] Tạo / sửa / ngưng hoạt động trường học
- [x] Thông tin: tên trường, mã trường, địa chỉ, MST, người liên hệ (POC), tỉnh/thành phố
- [x] Thiết lập thời hạn hợp đồng (ngày bắt đầu / kết thúc)
- [x] Search, filter, xem chi tiết hồ sơ trường

**Backend Endpoints:**
```
GET    /admin/schools                    - Danh sách trường (filter, paginate)
POST   /admin/schools                    - Tạo trường mới
GET    /admin/schools/{schoolId}         - Chi tiết trường
PUT    /admin/schools/{schoolId}         - Cập nhật thông tin
PATCH  /admin/schools/{schoolId}/status  - Ngưng/kích hoạt
```

---

## 2.4 — Cấu hình License & Subscription cho Trường
**Portal:** Admin Portal  
**Module:** Schools  
**Dependencies:** 2.1, 2.3  
**Mockup:** `docs/mockup/Admin/LicenseAndContract.html`

**Acceptance Criteria**
- [x] Gắn trường học vào một hoặc nhiều tenant (mỗi tenant = một row `school_tenant_mapping`; form tạo hỗ trợ chọn nhiều tenant cùng lúc)
- [x] Cấu hình hợp đồng: ngày bắt đầu, ngày kết thúc, max concurrent sessions, login policy (Block/Kick)
- [x] Cảnh báo khi hợp đồng sắp hết hạn (quota warning threshold)
- [x] Không cho phép login khi hợp đồng đã hết hạn

**Backend Endpoints:**
```
GET    /admin/schools/{schoolId}/subscriptions        - Danh sách subscription của trường
POST   /admin/schools/{schoolId}/subscriptions        - Tạo subscription mới (gắn vào tenant)
PUT    /admin/schools/{schoolId}/subscriptions/{id}   - Cập nhật subscription
DELETE /admin/schools/{schoolId}/subscriptions/{id}   - Xóa subscription
```

---

## 2.5 — Quản lý Tài khoản Người dùng (Users)
**Portal:** Admin Portal  
**Module:** Users  
**Dependencies:** P0.1  
**Mockup:** `docs/mockup/Admin/CreateUser.html`

**Acceptance Criteria**
- [x] Tạo / sửa / khóa tài khoản user
- [x] Quản lý: username, password, họ tên, email, avatar, loại tài khoản, trạng thái
- [x] Phân loại: `LMS_ADMIN`, `TENANT_ADMIN`, `SCHOOL_ADMIN`, `TEACHER` (không có STUDENT)
- [x] Ghi audit log khi tạo/sửa/khóa tài khoản
- [x] Reset mật khẩu bởi admin

**Backend Endpoints:**
```
GET    /admin/users                          - Danh sách user (filter by role, school, tenant)
POST   /admin/users                          - Tạo user mới
GET    /admin/users/{userId}                 - Chi tiết user
PUT    /admin/users/{userId}                 - Cập nhật thông tin
PATCH  /admin/users/{userId}/status          - Khóa/mở khóa tài khoản
POST   /admin/users/{userId}/reset-password  - Reset mật khẩu
```

---

## 2.6 — Quản lý Tenant kế thừa của User (Auto-inherit + Override)
**Portal:** Admin Portal  
**Module:** Users  
**Dependencies:** 2.1, 2.4, 2.5

**Acceptance Criteria**
- [x] Khi tạo user với `home_school_id`, hệ thống **tự động** tạo `user_tenant_role_assignment` cho tất cả tenant đang active trong hợp đồng của trường (kế thừa tự động, `is_inherited = TRUE`)
- [x] Role được kế thừa dựa theo `account_type` của user (VD: TEACHER → role code `TEACHER` trong từng tenant)
- [x] Admin có thể xem danh sách tenant đã kế thừa / gán thủ công
- [x] Admin có thể gán thêm tenant thủ công (ngoài kế thừa)
- [x] Admin có thể thu hồi từng tenant assignment (kể cả inherited)
- [x] Không cho phép gán trùng tenant cho cùng user

**Backend Endpoints:**
```
GET    /admin/users/{userId}/tenants              - Danh sách tenant của user (inherited + manual)
POST   /admin/users/{userId}/tenants              - Gán thủ công vào tenant
DELETE /admin/users/{userId}/tenants/{tenantId}   - Thu hồi tenant
```

---

## 2.7 — Xem User theo Trường học
**Portal:** Admin Portal  
**Module:** Users / Schools  
**Dependencies:** 2.3, 2.5

**Acceptance Criteria**
- [x] `home_school_id` được gán khi tạo user (từ task 2.5, trường trong `CreateUserCommand`)
- [x] LMS Admin và Tenant Admin có thể xem danh sách user theo trường
- [x] Filter user theo trường học kèm search, filter status, filter account_type, phân trang
- [x] LMS_ADMIN / TENANT_ADMIN không bắt buộc có `home_school_id`

**Backend Endpoints:**
```
GET /admin/schools/{schoolId}/users   - Danh sách user thuộc trường (filter, paginate)
```

---

## 2.8 — Phân quyền Hệ thống theo Account Type & Tenant
**Portal:** Tất cả Portal  
**Module:** Authorization  
**Dependencies:** 2.1, 2.5

**Acceptance Criteria**
- [x] Phân quyền theo `account_type` và `tenant membership`
- [x] `lms_admin` → toàn quyền hệ thống
- [x] `tenant_admin` → chỉ trong tenant được gán, không truy cập dữ liệu tenant khác
- [x] `school_user` → chỉ thấy nội dung được cấp quyền trong tenant đang context
- [x] Middleware Authorization áp dụng nhất quán trên tất cả API endpoint

**Backend Endpoints:**
```
GET /admin/roles                           - Danh sách roles
GET /admin/users/{userId}/permissions      - Xem quyền hiệu lực của user
```

---

## 2.9 — Quản lý Danh mục Dùng chung (Master Data)
**Portal:** Admin Portal  
**Module:** SharedKernel  
**Dependencies:** P0.1

**Acceptance Criteria**
- [x] CRUD các danh mục: loại tài liệu, trạng thái nội dung, loại tài khoản, nhãn hiển thị
- [x] Validate trùng giá trị, không xóa nếu đang được dùng
- [x] Danh mục dùng được ở nhiều module

**Backend Endpoints:**
```
GET    /admin/catalog/{type}         - Lấy danh sách theo loại danh mục
POST   /admin/catalog/{type}         - Thêm mục mới
PUT    /admin/catalog/{type}/{id}    - Cập nhật
DELETE /admin/catalog/{type}/{id}    - Xóa (validate ràng buộc)
```

---

## 2.12 — Quản lý Nhân sự & Phân quyền Tenant (Content Team)
**Portal:** Tenant Portal  
**Module:** Users / Authorization  
**Dependencies:** 2.5, 2.6, 2.8  
**Mockup:** `docs/mockup/Tenant/GroupPermission.html`

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Xem toàn bộ nhân sự đang có trong tenant kèm role name, roleCode, ngày gán (1 query)
- [x] Tìm kiếm nhân sự theo tên / email
- [x] Phân trang kết quả
- [x] Gán user với role content team (`CONTENT_CREATOR`, `CONTENT_REVIEWER`, `TENANT_ADMIN`) vào tenant
- [x] Thu hồi user khỏi tenant
- [x] Roles `CONTENT_CREATOR` và `CONTENT_REVIEWER` có permission mapping rõ ràng (phân tách: Creator không Publish, Reviewer không Create)

**Backend Endpoints:**
```
GET /api/admin/tenants/{tenantId}/members   - Danh sách nhân sự trong tenant kèm role
POST /api/admin/users/{id}/tenants          - Gán user + role vào tenant
DELETE /api/admin/users/{id}/tenants/{tenantId} - Thu hồi
```

**System Test:** `tests/SystemTest/Users/Users_System_Test_Cases_TenantMembers.md`

---

## 2.10 — Hệ thống Audit Log  
**Module:** AuditLogs  
**Dependencies:** 2.5  
**Mockup:** `docs/mockup/Admin/AuditLog.html`

**Acceptance Criteria**
- [ ] Ghi log tối thiểu: login, logout, view content, download, create/update/delete data
- [ ] Log fields: `user_id`, `tenant_id`, `school_id`, `ip_address`, `action`, `result`, `created_at`
- [ ] Filter: theo thời gian, user, tenant, trường, action
- [ ] Export dữ liệu thô (CSV)

**Backend Endpoints:**
```
GET    /admin/audit-logs             - Danh sách log (filter, paginate)
GET    /admin/audit-logs/export      - Export CSV
```

---

## 2.11 — Dashboard Tổng quan Admin
**Portal:** Admin Portal  
**Module:** Reports  
**Dependencies:** 2.1, 2.3, 1.4  
**Mockup:** `docs/mockup/Admin/Dashboard.html`

**Acceptance Criteria**
- [ ] Tổng số tenant đang active
- [ ] Tổng số trường học đang hoạt động
- [ ] Tổng số session đang active toàn hệ thống (realtime)
- [ ] Cảnh báo hợp đồng sắp hết hạn
- [ ] Cập nhật theo chu kỳ cấu hình, không đếm trùng session

**Backend Endpoints:**
```
GET /admin/dashboard/stats           - Tổng quan số liệu hệ thống
GET /admin/dashboard/active-sessions - Số session đang active (theo tenant nếu cần)
```

---

# PHASE 3 — Tenant Admin Portal

> Dành cho Giám đốc nội dung từng mảng. Quản lý curriculum, nội dung, phân quyền.

## 3.1 — Quản lý Cây Học liệu (Curriculum Tree)
**Portal:** Tenant Portal  
**Module:** ContentManagement  
**Dependencies:** P0.1, 2.1  
**Mockup:** `docs/mockup/Tenant/StudyLevel.html`, `StudyLevel_Op2.html`

**Acceptance Criteria**
- [x] Tạo / sửa / xóa node: Chương trình → Khối → Lớp → Môn học → Bài học
- [x] Hỗ trợ sắp xếp thứ tự hiển thị (`sort_order`)
- [x] Không xóa node đang có nội dung hoặc node con
- [x] Validate trùng tên trong cùng cấp
- [x] API trả về cây đầy đủ cho CMS và Client

**Backend Endpoints:**
```
GET    /tenants/{tenantId}/curriculum                    - Lấy toàn bộ cây
GET    /tenants/{tenantId}/curriculum/{nodeId}/children  - Lấy node con
POST   /tenants/{tenantId}/curriculum                    - Tạo node mới
PUT    /tenants/{tenantId}/curriculum/{nodeId}            - Sửa node
DELETE /tenants/{tenantId}/curriculum/{nodeId}            - Xóa node (validate)
PATCH  /tenants/{tenantId}/curriculum/reorder             - Sắp xếp lại thứ tự
```

---

## 3.2 — Quản lý Nội dung Đa phương tiện (Content CMS)
**Portal:** Tenant Portal  
**Module:** ContentManagement  
**Dependencies:** 3.1  
**Mockup:** `docs/mockup/Tenant/Content.html`

**Acceptance Criteria**
- [x] Upload được: Video, PDF, Slide, Word, URL
- [x] Gắn nội dung vào đúng node trong cây học liệu
- [x] Metadata: tiêu đề, mô tả, loại nội dung, trạng thái, ngày publish (schedule from-to)
- [x] Tenant Admin chỉ thao tác nội dung của tenant mình

**Backend Endpoints:**
```
GET    /tenants/{tenantId}/contents                         - Danh sách nội dung (filter by node)
POST   /tenants/{tenantId}/contents                         - Tạo content mới + upload file
GET    /tenants/{tenantId}/contents/{contentId}             - Chi tiết content
PUT    /tenants/{tenantId}/contents/{contentId}             - Cập nhật metadata
DELETE /tenants/{tenantId}/contents/{contentId}             - Xóa content
PATCH  /tenants/{tenantId}/contents/{contentId}/status      - Publish/unpublish
POST   /tenants/{tenantId}/contents/{contentId}/upload      - Upload/thay file
```

---

## 3.3 — Pipeline Xử lý Video HLS
**Portal:** Tenant Portal (trigger) / Background Worker  
**Module:** MediaProcessing  
**Dependencies:** 3.2

**Acceptance Criteria**
- [x] Video upload tự động đưa vào pipeline xử lý HLS
- [x] Trạng thái: `queued` → `processing` → `ready` / `failed`
- [x] Viewer chỉ phát được output HLS hợp lệ (không public file nguồn)
- [x] Ghi log kết quả xử lý, notify khi failed

**Backend Endpoints:**
```
GET  /tenants/{tenantId}/contents/{contentId}/processing-status  - Trạng thái xử lý
POST /tenants/{tenantId}/contents/{contentId}/reprocess          - Retry xử lý
```

---

## 3.4 — Cấu hình Security & Interaction Policy cho Nội dung
**Portal:** Tenant Portal  
**Module:** ContentManagement  
**Dependencies:** 3.2

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Bật/tắt watermark theo content
- [x] Bật/tắt download theo content
- [x] Cấu hình signed URL (thời hạn token xem/tải)
- [x] Bật/tắt comment theo content

**Backend Endpoints:**
```
GET /tenants/{tenantId}/contents/{contentId}/policy   - Lấy policy hiện tại
PUT /tenants/{tenantId}/contents/{contentId}/policy   - Cập nhật policy
```

---

## 3.5 — Phân quyền Nội dung (Permission Distribution)
**Portal:** Tenant Portal  
**Module:** Authorization  
**Dependencies:** 3.1, 2.5  
**Mockup:** `docs/mockup/Tenant/ContentPermision.html`, `GroupPermission.html`

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Cấp quyền theo node cây học liệu (gán node cha → tự động kế thừa node con)
- [x] Các action: `View`, `Download`, `Comment`
- [x] Gán quyền cho user cụ thể hoặc toàn trường
- [x] Thu hồi quyền đã cấp
- [x] Danh sách quyền cấp được lưu, có thể truy vết

**Backend Endpoints:**
```
GET    /tenants/{tenantId}/permissions                           - Danh sách permission
POST   /tenants/{tenantId}/permissions                           - Cấp quyền
DELETE /tenants/{tenantId}/permissions/{permissionId}            - Thu hồi
GET    /tenants/{tenantId}/curriculum/{nodeId}/permissions        - Xem ai có quyền trên node
GET    /tenants/{tenantId}/users/{userId}/permissions             - Xem quyền của user
```

---

## 3.6 — Dashboard Tenant Admin
**Portal:** Tenant Portal  
**Module:** Reports  
**Dependencies:** 3.2, 3.5  
**Mockup:** `docs/mockup/Tenant/Dashboard.html`

**Acceptance Criteria**
- [ ] Thống kê dung lượng học liệu đã upload
- [ ] Số lượng trường đang sử dụng tenant này
- [ ] Top bài giảng được xem nhiều

**Backend Endpoints:**
```
GET /tenants/{tenantId}/dashboard/stats          - Số liệu tổng quan tenant
GET /tenants/{tenantId}/dashboard/top-contents   - Top content được xem
```

---

# PHASE 4 — Client Portal (School / Teacher)

> Giao diện học tập và giảng dạy. Ưu tiên tối giản, focus vào xem nội dung.

## 4.1 — White-label Branding theo Tenant
**Portal:** Client Portal  
**Module:** Tenancy  
**Dependencies:** 2.1, 2.2

**Acceptance Criteria**
- [ ] Giao diện hiển thị đúng logo/màu sắc theo tenant domain
- [ ] Không hiển thị sai branding giữa các tenant
- [ ] Fallback khi tenant chưa cấu hình đầy đủ branding
- [ ] Thay đổi branding có hiệu lực ngay trên client

**Backend Endpoints:** Dùng lại `GET /api/tenants/resolve?domain={domain}` từ 2.2

---

## 4.2 — Duyệt Cây Học liệu (Curriculum Explorer)
**Portal:** Client Portal  
**Module:** ContentDelivery  
**Dependencies:** 3.1, 3.5  
**Mockup:** `docs/mockup/School/ContentExplorer.html`, `ContentExplorerWithFavo.html`

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Hiển thị đúng cây học liệu theo quyền đã cấp (không thấy node ngoài quyền)
- [x] Mở được chi tiết bài học từ cây
- [x] Hiệu năng ổn với cây dữ liệu lớn (lazy load nếu cần)

**Backend Endpoints:**
```
GET /api/client/curriculum                       - Cây học liệu theo quyền current user
GET /api/client/curriculum/{nodeId}/contents     - Danh sách nội dung trong node
```

---

## 4.3 — E-Learning Viewer (Video HLS Player)
**Portal:** Client Portal  
**Module:** Viewer  
**Dependencies:** 3.3, 3.4, 3.5  
**Mockup:** `docs/mockup/School/ViewMode.html`

**Acceptance Criteria**
- [x] Phát được luồng HLS hợp lệ qua signed URL
- [x] Có loading/error state rõ ràng
- [x] Hỗ trợ full-screen
- [x] Không lộ direct source URL công khai

**Backend Endpoints:**
```
GET /api/client/contents/{contentId}/stream-url    - Lấy signed HLS URL (có TTL)
```

---

## 4.4 — E-Learning Viewer (Document Viewer PDF/Slide)
**Portal:** Client Portal  
**Module:** Viewer  
**Dependencies:** 3.4, 3.5

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Mở được PDF/Slide trong viewer trên web
- [x] Chuyển trang, zoom, full-screen
- [x] Chặn chuột phải trong vùng viewer
- [x`] Không lộ link file gốc trực tiếp

**Backend Endpoints:**
```
GET /api/client/contents/{contentId}/view-url     - Lấy signed URL xem document (có TTL)
```

---

## 4.5 — Dynamic Watermark
**Portal:** Client Portal  
**Module:** Viewer  
**Dependencies:** 3.4

**Acceptance Criteria**
- [x] Watermark động overlay trên video và document khi xem
- [x] Nội dung watermark: tên công ty / tên tài khoản / thời gian hiện tại
- [x] User không thể tắt watermark bằng thao tác thông thường
- [x] Chỉ áp dụng với nội dung đã bật policy watermark

**Backend Endpoints:**
```
GET /api/client/contents/{contentId}/watermark-config   - Lấy config watermark cho content
```

---

## 4.6 — Secure Download
**Portal:** Client Portal  
**Module:** Downloads  
**Dependencies:** 3.4, 3.5

**Acceptance Criteria**
- [x] Chỉ hiển thị nút tải khi user có quyền `Download`
- [x] Link tải là signed URL có thời hạn ngắn, không dùng lại được
- [x] Nội dung không cho download thì không thể tải dù biết URL
- [x] Ghi audit log đầy đủ khi tải tài liệu

**Backend Endpoints:**
```
GET /api/client/contents/{contentId}/download-url     - Tạo signed download URL (TTL ngắn)
```

---

## 4.7 — Classroom Full-Screen Mode
**Portal:** Client Portal  
**Module:** Viewer  
**Dependencies:** 4.3, 4.4  
**Mockup:** `docs/mockup/School/ViewMode.html`

**Acceptance Criteria**
- [ ] Nút bật/tắt full-screen rõ ràng
- [ ] Giao diện full-screen tối giản (ẩn sidebar, header)
- [ ] Không che khuất vùng nội dung chính
- [ ] Hoạt động ổn định trên Chrome, Edge, Safari

**Backend Endpoints:** Không cần endpoint riêng (xử lý hoàn toàn ở frontend)

---

## 4.8 — My Favorites (Kho học liệu cá nhân)
**Portal:** Client Portal  
**Module:** Viewer  
**Dependencies:** 4.2  
**Mockup:** `docs/mockup/School/Favorites.html`

**Acceptance Criteria**
- [x] Thêm / xóa nội dung vào danh sách yêu thích
- [x] Màn hình kho cá nhân dạng Grid/List
- [x] Chỉ hiển thị nội dung user còn quyền truy cập
- [x] Dữ liệu lưu theo từng user

**Backend Endpoints:**
```
GET    /api/client/favorites                 - Danh sách yêu thích của current user
POST   /api/client/favorites/{contentId}     - Thêm vào yêu thích
DELETE /api/client/favorites/{contentId}     - Xóa khỏi yêu thích
```

---

## 4.9 — My Dashboard (Trang chủ học tập)
**Portal:** Client Portal  
**Module:** ContentDelivery  
**Dependencies:** 3.5, 4.2  
**Mockup:** `docs/mockup/School/Dashboard.html`

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Có endpoint summary trả các chỉ số dashboard: viewed trong tuần, tổng favorites, favorites thêm trong tuần, lần học gần nhất
- [x] Khu vực "Truy cập nhanh" trả về danh sách tài liệu theo ưu tiên: (1) đã xem trong tuần nhưng không thuộc favorite, (2) favorite
- [x] Có phân trang cho danh sách truy cập nhanh
- [x] Chỉ hiển thị nội dung current user còn quyền xem, đang published và còn trong visibility window
- [x] Mỗi item trả về đủ metadata để resume: content, node, isFavorite, lastViewedAt, favoritedAt, progressValue

**Backend Endpoints:**
```
GET /api/client/dashboard/summary          - Thống kê tổng quan dashboard
GET /api/client/dashboard/quick-access     - Danh sách truy cập nhanh (có paging)
```

**System Test:** `tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.9.md`

---

## 4.10 — Continue Learning Progress (Luu tien do xem)
**Portal:** Client Portal  
**Module:** ContentDelivery / Viewer  
**Dependencies:** 3.2, 3.5, 4.2

**Status:** [x] Completed

**Acceptance Criteria**
- [x] Luu tien do xem theo user + content (video: millisecond, document: page)
- [x] Neu da co ban ghi thi update, neu chua co thi insert moi
- [x] Chi user co quyen xem content moi doc/ghi duoc progress
- [x] Progress khong cho phep am
- [x] API tra du lieu de frontend resume dung vi tri da hoc

**Backend Endpoints:**
```
GET /api/client/curriculum/contents/{contentId}/progress   - Lay progress cua current user
PUT /api/client/curriculum/contents/{contentId}/progress   - Upsert progress cua current user
```

**System Test:** `tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.10.md`

---

# Tổng quan Dependencies

```
P0.1 ─── 1.1 ─── 1.2 ─── 1.3
                   └─────── 1.4
           └─── 2.1 ─── 2.2 ─── 4.1
                   └─── 2.3 ─── 2.4
                   └─── 2.5 ─── 2.6
                              └─── 2.7
                              └─── 2.8
                   └─── 2.9
                   └─── 2.10
                   └─── 2.11
           └─── 3.1 ─── 3.2 ─── 3.3
                              └─── 3.4
                   └─── 3.5 ─── 4.2 ─── 4.3 ─── 4.5
                              └─────── 4.4
                              └─────── 4.6
                              └─────── 4.7
                              └─────── 4.8
                              └─────── 4.9
                   └─── 3.6
```
