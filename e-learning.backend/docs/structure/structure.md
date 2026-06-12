Chào bạn, việc chốt được luồng đăng nhập tập trung **"Identifier First"** thực sự là một bước ngoặt cho kiến trúc UI của hệ thống. 

Dưới đây là danh sách các màn hình chức năng (UI Screens) đã được tôi **cập nhật và tái cấu trúc** lại. Điểm khác biệt lớn nhất là toàn bộ các màn hình đăng nhập rời rạc đã được gom lại thành một **Module Xác thực Trung tâm (Centralized Identity Module)**, giúp 3 Portals phía sau trở nên thuần túy là không gian làm việc (Workspaces).

---

### 0. Module Xác thực Trung tâm (Centralized Identity Portal)
*Truy cập qua một domain duy nhất (VD: `id.daihoc.io.vn`). Đây là "cửa ngõ" thông minh tự động điều hướng người dùng.*

1. **Màn hình Nhập Định danh (Identifier Step):** Giao diện tối giản chỉ chứa ô nhập Email/Username.
2. **Màn hình Xác thực (Password Step):**
   * Tự động biến đổi Logo, màu sắc (White-label) nếu email thuộc về 1 Tenant duy nhất (VD: STEM).
   * Giữ nguyên giao diện hệ thống nếu là Super Admin hoặc Multi-tenant User.
3. **Màn hình Chọn Không gian làm việc (Workspace Selector):** Dành riêng cho Giáo viên/Học sinh thuộc nhiều mảng (Multi-tenant). Hiển thị danh sách các mảng (Card layout) để user click chọn trước khi vào Dashboard.
4. **Các Modal/Thông báo Cảnh báo:** Màn hình lỗi tài khoản bị khóa (do Brute-force), thông báo hết hạn hợp đồng, hoặc cảnh báo bị đá (Kick) do vượt quá số session quy định.

---

### I. LMS Admin Portal (Dành cho Super Admin)
*Không gian vận hành cốt lõi, tập trung vào Data Grid và quản lý thực thể.*

1. **Màn hình Dashboard Tổng quan:** Thống kê số lượng Tenant, tổng số Trường học, tổng số Session đang active toàn hệ thống, cảnh báo tài nguyên.
2. **Quản lý Tenant (Mảng giảng dạy):**
   * Màn hình danh sách Tenant.
   * Popup/Drawer Thêm mới/Cập nhật Tenant (Nhập code, tên, subdomain).
   * Màn hình cấu hình Branding (Upload Logo, Avatar, cấu hình template Watermark động bằng JSON).
3. **Quản lý Trường học (Client Accounts):**
   * Màn hình danh sách Trường học.
   * Form chi tiết Trường học (Mã, Tên, MST, Địa chỉ, Thông tin người liên hệ - POC, Tỉnh/Thành phố).
4. **Quản lý Cấp phép & Hợp đồng (Subscription Mapping):**
   * Màn hình Gắn Trường học vào Tenant.
   * Form thiết lập hợp đồng (Ngày bắt đầu/kết thúc, Max concurrent sessions, Chọn Login policy: Block/Kick).
5. **Quản lý User Tập trung:**
   * Màn hình danh sách User toàn hệ thống.
   * Form tạo User (Tạo tài khoản, gán `account_type`, gắn vào `home_school_id` nếu có).
6. **Quản lý System Audit Logs:**
   * Bảng dữ liệu (Data grid) tra cứu lịch sử thao tác toàn hệ thống với các bộ lọc phức tạp (theo IP, Tenant, Action).

---

### II. Tenant Admin Portal (Dành cho Giám đốc nội dung từng mảng)
*Không gian sản xuất nội dung, mang đậm màu sắc thương hiệu (White-label) của mảng đó.*

1. **Màn hình Tenant Dashboard:** Thống kê dung lượng học liệu đã upload, số lượng trường đang sử dụng mảng này, top bài giảng được xem nhiều.
2. **Quản lý Cây Học Liệu (Curriculum Builder):**
   * Màn hình quản lý dạng Tree-view (kéo thả) hoặc List-view phân cấp (Chương trình > Khối > Lớp > Môn > Bài học).
   * Popup Thêm/Sửa/Xóa Node (Có validation chống trùng tên).
3. **Quản lý Nội dung (Content CMS):**
   * Màn hình danh sách Content theo từng Node.
   * Form Upload & Chỉnh sửa Content (Kéo thả file đa phương tiện, nhập Tên, Mô tả, Cấu hình bật/tắt Watermark, Cho phép download, Đặt lịch Publish từ ngày - đến ngày).
4. **Màn hình Phân quyền Nội dung (Permission Distribution) - *Core Feature*:**
   * Giao diện Ma trận (Matrix) hoặc Split-view: Bên trái là Cây học liệu, bên phải là danh sách Trường/User.
   * Các Checkbox/Toggle để gán quyền (View, Download, Comment) xuống DB `content_permission`.
5. **Quản lý Nhóm quyền (Tenant Roles & Users):**
   * Màn hình danh sách User thuộc Tenant.
   * Màn hình gán Role (VD: Gán giáo viên X làm Content Reviewer của mảng STEM).

---

### III. Client Portal (Dành cho Giáo viên / Học sinh)
*Không gian học tập và giảng dạy thực tế tại trường học. Giao diện ưu tiên sự tối giản, focus 100% vào việc xem tài liệu.*

1. **Trang chủ / Bàn làm việc (My Dashboard):**
   * Hiển thị danh sách các "Chương trình/Khối lớp" mà Giáo viên/Học sinh được cấp quyền xem (Lọc qua `content_permission`).
   * Khu vực "Tiếp tục học/dạy" (Truy cập nhanh các bài giảng truy cập gần nhất).
2. **Màn hình Duyệt Cây nội dung (Curriculum Explorer):**
   * Giao diện điều hướng bài học (Thường thiết kế dạng Sidebar bên trái để duyệt thư mục, bên phải hiển thị danh sách bài giảng/tài liệu).
3. **Trình phát Học liệu (E-Learning Viewer Mode) - *Màn hình quan trọng nhất*:**
   * **Video Player Interface:** Tích hợp trình phát HLS, nút Full-screen, tự động render Watermark động (Tên user + IP + Thời gian) chạy overlay trên màn hình video.
   * **Document Viewer Interface:** Trình xem PDF/Slide chống click chuột phải, vô hiệu hóa phím tắt in/lưu, có tool bar cơ bản (Zoom, Next page).
   * **Thảo luận (Q&A):** Tab/Khu vực bình luận dạng tree (hỗ trợ reply) bên dưới hoặc bên cạnh Viewer.
4. **Màn hình Kho học liệu cá nhân (My Favorites):**
   * Danh sách dạng Grid/List các bài giảng người dùng đã bấm "Lưu/Yêu thích".

---

### 💡 Cập nhật Kế hoạch phát triển UI Components (Dành cho Front-end)

Với cấu trúc mới này, team UI/UX và Front-end cần thiết kế các bộ **Reusable Components** sau:

1. **Dynamic Auth Form:** Component form đăng nhập có khả năng nhận config từ API để tự động đổi Logo, Tiêu đề và màu nút bấm.
2. **Advanced Data Grid:** Bảng dữ liệu dùng chung (cho Admin & Tenant Admin) hỗ trợ server-side pagination, sorting, và filter nhiều cột.
3. **Draggable Tree-view:** Component cây thư mục dùng chung. Khi ở chế độ Admin thì cho phép kéo thả/sửa xóa; khi ở chế độ Client thì chỉ cho phép click mở nhánh (Expand/Collapse).
4. **Secure Media Player (Web Component):** Đóng gói HLS Player và PDF Viewer thành một component độc lập. Component này tự động nhận `URL` và cấu hình `watermark_settings`, tự chèn overlay bảo mật, giúp Dev dễ dàng nhúng vào bất kỳ trang nào mà không cần code lại logic chống tải lậu.