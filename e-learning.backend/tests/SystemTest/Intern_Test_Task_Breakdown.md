# Intern Test Task Breakdown (System Test API)

Muc tieu: chia nho cong viec de intern co the study + test dung theo cac file System Test hien co.

## 1) Nguyen tac chia viec
- Moi task nho co thoi luong 0.5-1 ngay.
- Moi task chi tap trung 1 nhom endpoint va 1 loai ky nang.
- Moi task bat buoc nop: evidence + danh sach TC da chay + ket qua PASS/FAIL + ghi chu root cause.
- Uu tien chay theo thu tu de giam blocker token, seed data, dependency.

## 2) Backlog task nho cho intern

### Wave A - Onboarding + Co ban (de)

#### TSK-A01: Setup moi truong test API
- Muc tieu: verify API up, db seed co du user can test.
- Pham vi:
  - Login superadmin, stem_admin, teacher01.
  - Xac nhan co token su dung duoc.
- Tai lieu lien quan:
  - tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.2.md
- Output can nop:
  - Bang token da tao thanh cong (khong can gui full token, chi 8 ky tu dau + exp).
  - Checklist precondition dat/khong dat.

#### TSK-A02: Test input validation Identify (Task 1.1 - nhom negative)
- Pham vi TC:
  - TC-1.1-01, TC-1.1-02, TC-1.1-03, TC-1.1-04
- Do kho: De
- Output can nop:
  - Log request/response cho moi TC.
  - Ket luan co hay khong lo thong tin user existence.

#### TSK-A03: Test login branding behavior (Task 1.1 - nhom positive)
- Pham vi TC:
  - TC-1.1-05 den TC-1.1-12
- Do kho: De
- Output can nop:
  - Bang doi chieu role/user voi tenantBranding va isWhiteLabel.

### Wave B - Auth lifecycle (trung binh)

#### TSK-B01: Login/Refresh/Logout co ban (Task 1.2 - part 1)
- Pham vi TC:
  - TC-1.2-01, TC-1.2-07, TC-1.2-08, TC-1.2-09
- Do kho: Trung binh
- Luu y:
  - Rotate refresh token: token cu khong duoc dung lai.

#### TSK-B02: Account locked & contract expired (Task 1.2 - part 2a)
- Pham vi TC:
  - TC-1.2-03, TC-1.2-04
- Do kho: Trung binh
- Luu y:
  - Tach user test rieng de tranh lockout anh huong task khac.

#### TSK-B03: Negative auth va brute-force (Task 1.2 - part 2b)
- Pham vi TC:
  - TC-1.2-02, TC-1.2-05, TC-1.2-06
- Do kho: Trung binh
- Luu y:
  - Tach user test rieng de tranh lockout anh huong task khac.

#### TSK-B04: Change password + revoke session (Task 1.2 - part 3)
- Pham vi TC:
  - TC-1.2-12, TC-1.2-13
- Do kho: Trung binh
- Luu y:
  - Can 2 session song song de xac nhan revoke.

#### TSK-B05: Audit log cho auth (Task 1.2 - part 4)
- Pham vi TC:
  - TC-1.2-10, TC-1.2-11, TC-1.2-14
- Do kho: Trung binh
- Luu y:
  - Can cach truy van/kiem tra bang audit logs.

### Wave C - Workspace + Sessions (trung binh)

#### TSK-C01: Workspace list/select (Task 1.3)
- Pham vi TC:
  - TC-1.3-01 den TC-1.3-08
- Do kho: Trung binh
- Luu y:
  - Quan ly token moi sau khi select workspace.

#### TSK-C02: Session self-management (Task 1.4 - self)
- Pham vi TC:
  - TC-1.4-01, TC-1.4-02, TC-1.4-03, TC-1.4-06
- Do kho: Trung binh

#### TSK-C03: Session policy block/kick (Task 1.4 - policy)
- Pham vi TC:
  - TC-1.4-04, TC-1.4-05
- Do kho: Trung binh
- Luu y:
  - Verify policy truoc khi chay.

#### TSK-C04: Admin session control + audit (Task 1.4 - admin)
- Pham vi TC:
  - TC-1.4-07, TC-1.4-08, TC-1.4-09, TC-1.4-10
- Do kho: Trung binh

### Wave D - CRUD nen tang Admin (de -> trung binh)

#### TSK-D01: Tenant CRUD + paging/filter (Task 2.1)
- Pham vi TC:
  - TC-2.1-01 den TC-2.1-05
- Do kho: De/Trung binh

#### TSK-D02: Resolve tenant theo domain/host (Task 2.2)
- Pham vi TC:
  - TC-2.2-01 den TC-2.2-03
- Do kho: Trung binh

#### TSK-D03: School CRUD + search/filter (Task 2.3)
- Pham vi TC:
  - TC-2.3-01 den TC-2.3-08
- Do kho: De/Trung binh

#### TSK-D04: Subscription CRUD + contract warning (Task 2.4)
- Pham vi TC:
  - TC-2.4-01 den TC-2.4-10
- Do kho: Trung binh
- Luu y:
  - Set ngay tuyet doi de tranh sai lech theo ngay test.

### Wave E - User + Authorization (trung binh -> kho)

#### TSK-E01: User CRUD - Tạo/Sửa/Khóa (Task 2.5 - part 1)
- Pham vi TC:
  - TC-2.5-01 den TC-2.5-08
- Do kho: Trung binh

#### TSK-E02: User Status + Reset password (Task 2.5 - part 2)
- Pham vi TC:
  - TC-2.5-09 den TC-2.5-15
- Do kho: Trung binh

#### TSK-E03: User tenant inherit auto + list tenants (Task 2.6 - part 1)
- Pham vi TC:
  - TC-2.6-01, TC-2.6-02, TC-2.6-03, TC-2.6-04, TC-2.6-05, TC-2.6-06
- Do kho: Kho
- Luu y:
  - Phu thuoc school subscription active.

#### TSK-E04: User tenant manual assign/revoke (Task 2.6 - part 2)
- Pham vi TC:
  - TC-2.6-07 den TC-2.6-13
- Do kho: Kho
- Luu y:
  - Phu thuoc school subscription active.

#### TSK-E05: Users by school list/filter/paging (Task 2.7)
- Pham vi TC:
  - TC-2.7-01 den TC-2.7-08
- Do kho: Trung binh

#### TSK-E06: Authorization matrix core (Task 2.8 - part 1)
- Pham vi TC:
  - TC-2.8-01 den TC-2.8-08
- Do kho: Kho
- Luu y:
  - Test permission check theo account type va endpoint.

#### TSK-E07: Authorization matrix roles + tokens (Task 2.8 - part 2)
- Pham vi TC:
  - TC-2.8-09 den TC-2.8-16
- Do kho: Kho
- Luu y:
  - Test GET roles, permissions, token expiry.

#### TSK-E08: Catalog master data part 1 (Task 2.9 - part 1)
- Pham vi TC:
  - TC-2.9-01 den TC-2.9-09
- Do kho: De/Trung binh

#### TSK-E09: Catalog master data part 2 (Task 2.9 - part 2)
- Pham vi TC:
  - TC-2.9-10 den TC-2.9-18
- Do kho: De/Trung binh

### Wave F - Content Management (trung binh -> kho)

#### TSK-F01: Curriculum tree CRUD + order (Task 3.1 - part 1)
- Pham vi TC:
  - TC-3.1-01 den TC-3.1-06
- Do kho: Trung binh

#### TSK-F02: Curriculum tree delete + scope (Task 3.1 - part 2)
- Pham vi TC:
  - TC-3.1-07 den TC-3.1-12
- Do kho: Trung binh

#### TSK-F03: Content creation + upload (Task 3.2 - part 1)
- Pham vi TC:
  - TC-3.2-01 den TC-3.2-08
- Do kho: Kho
- Luu y:
  - Tao presigned URL, validate input, list/filter content.

#### TSK-F04: Content update + publish + archive (Task 3.2 - part 2)
- Pham vi TC:
  - TC-3.2-09 den TC-3.2-16
- Do kho: Kho

#### TSK-F05: Content validation + isolation + scheduling (Task 3.2 - part 3)
- Pham vi TC:
  - TC-3.2-17 den TC-3.2-23
- Do kho: Kho

### Wave G - Content Delivery (trung binh)

#### TSK-G01: Curriculum + signed URLs regression (Task 4.2/4.3/4.4)
- Pham vi TC:
  - TC-4.2-01 den TC-4.2-05
  - TC-4.3-01 den TC-4.3-04
  - TC-4.4-01 den TC-4.4-05
- Do kho: Trung binh

#### TSK-G02: Dynamic watermark (Task 4.5)
- Pham vi TC:
  - TC-4.5-01 den TC-4.5-09
- Do kho: Trung binh

#### TSK-G03: Favorites CRUD + visibility filtering (Task 4.8)
- Pham vi TC:
  - TC-4.8-01 den TC-4.8-11
- Do kho: Trung binh
- Luu y:
  - Verify idempotent cho POST add favorite (goi lap lai khong duplicate).
  - Verify GET list khong tra item khi user mat quyen view node.

#### TSK-G04: Continue learning progress (Task 4.10)
- Pham vi TC:
  - TC-4.10-01 den TC-4.10-08
- Do kho: Trung binh
- Luu y:
  - Can migration V13 va bang user_content_progress.
  - Tach token user co quyen/khong quyen de verify 403.

#### TSK-G05: Dashboard quick-access (Task 4.9)
- Pham vi TC:
  - TC-4.9-00 den TC-4.9-07
- Do kho: Trung binh
- Luu y:
  - Verify summary endpoint `/api/client/dashboard/summary` tra metric dung schema.
  - Verify dung rule ranking: Group 1 viewed-this-week non-favorite, Group 2 favorite.
  - Verify paging page=1/page=2 khong trung item.

## 3) Thu tu thuc thi de giam blocker
1. A01 -> A02 -> A03
2. B01 -> B02 -> B03 -> B04 -> B05
3. C01 -> C02 -> C03 -> C04
4. D01 -> D02 -> D03 -> D04
5. E01 -> E02 -> E03 -> E04 -> E05 -> E06 -> E07 -> E08 -> E09
6. F01 -> F02 -> F03 -> F04 -> F05
7. G01 -> G02 -> G03 -> G04 -> G05

## 4) Rule verify chat luong khi intern nop bai
- Moi test case FAIL phai co:
  - request
  - response
  - expected
  - nhan dinh sai khac
  - muc do nghiem trong (High/Medium/Low)
- Moi task phai co tong ket coverage:
  - Tong so TC da chay
  - So PASS
  - So FAIL
  - So Blocked
- Neu Blocked > 0 thi bat buoc neu ro dependency bi thieu (token, seed data, quyen, contract date, session policy).

## 5) Mapping file goc de intern tu hoc
- tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.1.md
- tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.2.md
- tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.3.md
- tests/SystemTest/Identity/Identity_System_Test_Cases_Task_1.4.md
- tests/SystemTest/Tenancy/Tenancy_System_Test_Cases_Task_2.1_2.2.md
- tests/SystemTest/Schools/Schools_System_Test_Cases_Task_2.3.md
- tests/SystemTest/Schools/Schools_System_Test_Cases_Task_2.4.md
- tests/SystemTest/Users/Users_System_Test_Cases_Task_2.5.md
- tests/SystemTest/Users/Users_System_Test_Cases_Task_2.6_2.7.md
- tests/SystemTest/Authorization/Authorization_System_Test_Cases_Task_2.8.md
- tests/SystemTest/Catalog/Catalog_System_Test_Cases_Task_2.9.md
- tests/SystemTest/ContentManagement/ContentManagement_System_Test_Cases_Task_3.1.md
- tests/SystemTest/ContentManagement/ContentManagement_System_Test_Cases_Task_3.2.md
- tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.2_4.3_4.4.md
- tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.5.md
- tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.9.md
- tests/SystemTest/ContentDelivery/ContentDelivery_System_Test_Cases_Task_4.10.md
