# System Test Cases: Task 3.5 - Phan quyen Noi dung (Permission Distribution)

**Module:** ContentManagement / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [None]  
**Id:** ST-CONTENT-3.5  

## Scope
- Task 3.5 - Phan quyen Noi dung (Permission Distribution)
- API pham vi kiem thu:
  - GET /api/tenants/{tenantId}/permissions
  - POST /api/tenants/{tenantId}/permissions
  - DELETE /api/tenants/{tenantId}/permissions/{permissionId}
  - GET /api/tenants/{tenantId}/curriculum/{nodeId}/permissions
  - GET /api/tenants/{tenantId}/users/{userId}/permissions

## Acceptance Criteria Index

- **AC-3.5-01:** Cap quyen theo node cay hoc lieu, node cha duoc ke thua xuong node con
- **AC-3.5-02:** Ho tro actions `View`, `Download`, `Comment`
- **AC-3.5-03:** Gan quyen cho user cu the hoac toan truong
- **AC-3.5-04:** Thu hoi quyen da cap
- **AC-3.5-05:** Danh sach quyen cap duoc luu va co the truy vet

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-3.5-01 | Grant permission cho school thanh cong | AC-3.5-02, AC-3.5-03, AC-3.5-05 |
| TC-3.5-02 | Grant permission cho user thanh cong | AC-3.5-02, AC-3.5-03, AC-3.5-05 |
| TC-3.5-03 | Upsert permission khi grant lai cung grantee + node | AC-3.5-02, AC-3.5-05 |
| TC-3.5-04 | Revoke permission thanh cong | AC-3.5-04, AC-3.5-05 |
| TC-3.5-05 | List permissions theo tenant va filter node | AC-3.5-05 |
| TC-3.5-06 | Kiem tra inherited permissions tren node con | AC-3.5-01, AC-3.5-05 |
| TC-3.5-07 | Kiem tra effective permissions theo user | AC-3.5-01, AC-3.5-02, AC-3.5-03, AC-3.5-05 |
| TC-3.5-08 | Tu choi request khi gui dong thoi schoolId va userId | AC-3.5-03 |
| TC-3.5-09 | Tu choi request khi khong co quyen nao duoc cap | AC-3.5-02 |
| TC-3.5-10 | Tu choi grant voi school khong thuoc tenant | AC-3.5-03 |
| TC-3.5-11 | Tu choi grant voi user khong thuoc tenant | AC-3.5-03 |
| TC-3.5-12 | Kiem tra authorization theo permission code | AC-3.5-05 |

## Coverage Summary
- Tong so Acceptance Criteria can cover: **5**
- Tong so Test Case: **12**
- AC co coverage:
  - AC-3.5-01: 2 test case
  - AC-3.5-02: 5 test case
  - AC-3.5-03: 6 test case
  - AC-3.5-04: 1 test case
  - AC-3.5-05: 8 test case
- Ket luan coverage: **Du cover toan bo acceptance criteria, khong co AC bi miss**.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- Da apply migrations V1-V8 va seed dev data.
- Token role:
  - TENANT_ADMIN co `CONTENT_PERMISSION_GRANT`, `CONTENT_PERMISSION_REVOKE`
  - User khong du quyen de test 403
- Du lieu mau:
  - `tenantId`: `00000000-0000-0000-0000-000000000002`
  - `parentNodeId`: node cha hop le trong tenant
  - `childNodeId`: node con cua `parentNodeId`
  - `schoolId`: school thuoc tenant
  - `userId`: user thuoc tenant

---

## Test Case: TC-3.5-01 - Grant permission cho school thanh cong

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-01  
**AC Covered:** AC-3.5-02, AC-3.5-03, AC-3.5-05  

### Description
Xac minh co the cap quyen tren node cho toan truong (school-level grant).

### Precondition
- Dang nhap bang TENANT_ADMIN.
- Co `parentNodeId` hop le trong tenant.
- Co `schoolId` thuoc tenant.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /api/tenants/{tenantId}/permissions` voi body `{ curriculumNodeId, schoolId, userId: null, canView: true, canDownload: false, canComment: true }` | API tra `200 OK` |
| 2 | Kiem tra response | Co `permissionId`, `curriculumNodeId`, `schoolId`, `canView/canDownload/canComment`, `updatedAt` |
| 3 | Goi `GET /api/tenants/{tenantId}/permissions?curriculumNodeId={parentNodeId}` | Co record vua tao |

---

## Test Case: TC-3.5-02 - Grant permission cho user thanh cong

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-02  
**AC Covered:** AC-3.5-02, AC-3.5-03, AC-3.5-05  

### Description
Xac minh co the cap quyen truc tiep cho user cu the tren node.

### Precondition
- TENANT_ADMIN token hop le.
- `userId` thuoc tenant.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /api/tenants/{tenantId}/permissions` voi body `{ curriculumNodeId, schoolId: null, userId, canView: true, canDownload: true, canComment: false }` | API tra `200 OK` |
| 2 | Kiem tra response | `userId` dung gia tri da gui, cac co quyen dung |
| 3 | Goi `GET /api/tenants/{tenantId}/permissions?userId={userId}` | Co record grant cho user |

---

## Test Case: TC-3.5-03 - Upsert permission khi grant lai cung grantee + node

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-03  
**AC Covered:** AC-3.5-02, AC-3.5-05  

### Description
Xac minh grant lai tren cung `(tenant, node, grantee)` se update quyen thay vi tao duplicate.

### Precondition
- Da co permission grant ton tai cho school hoac user tren node.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi lai `POST /permissions` voi cung `curriculumNodeId` + `schoolId` (hoac `userId`) nhung doi `canDownload` | API tra `200 OK` |
| 2 | Kiem tra response `permissionId` | `permissionId` giu nguyen (khong tao ban ghi moi) |
| 3 | Goi list permissions | Chi co 1 record cho grantee do tai node do, quyen da duoc cap nhat |

---

## Test Case: TC-3.5-04 - Revoke permission thanh cong

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-04  
**AC Covered:** AC-3.5-04, AC-3.5-05  

### Description
Xac minh co the thu hoi quyen da cap thong qua `permissionId`.

### Precondition
- Da co `permissionId` hop le, `is_deleted = FALSE`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `DELETE /api/tenants/{tenantId}/permissions/{permissionId}` | API tra `204 No Content` |
| 2 | Goi lai list permissions theo `permissionId` (hoac filter node/grantee) | Record bi revoke khong con xuat hien |
| 3 | Goi DELETE lan 2 cung `permissionId` | API tra `404 Not Found` |

---

## Test Case: TC-3.5-05 - List permissions theo tenant va filter node

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-05  
**AC Covered:** AC-3.5-05  

### Description
Xac minh endpoint list ho tro filter theo node/school/user va chi tra du lieu trong tenant.

### Precondition
- Da co it nhat 3 grants trong tenant cho nhieu node/grantee.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/tenants/{tenantId}/permissions` | Tra danh sach permissions cua tenant |
| 2 | Goi `GET /api/tenants/{tenantId}/permissions?curriculumNodeId={parentNodeId}` | Chi tra records cua node do |
| 3 | Goi `GET /api/tenants/{tenantId}/permissions?schoolId={schoolId}` | Chi tra records grant cho school do |
| 4 | Goi `GET /api/tenants/{tenantId}/permissions?userId={userId}` | Chi tra records grant cho user do |

---

## Test Case: TC-3.5-06 - Kiem tra inherited permissions tren node con

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-06  
**AC Covered:** AC-3.5-01, AC-3.5-05  

### Description
Xac minh quyen cap tren node cha duoc the hien la inherited khi xem quyen tai node con.

### Precondition
- Da grant quyen tren `parentNodeId`.
- `childNodeId` la node con cua `parentNodeId`.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/tenants/{tenantId}/curriculum/{childNodeId}/permissions` | API tra `200 OK` |
| 2 | Tim record co `sourceNodeId = parentNodeId` | Record ton tai |
| 3 | Kiem tra truong `isInherited` | `isInherited = true` |

---

## Test Case: TC-3.5-07 - Kiem tra effective permissions theo user

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Attachments:** [None]  
**Id:** TC-3.5-07  
**AC Covered:** AC-3.5-01, AC-3.5-02, AC-3.5-03, AC-3.5-05  

### Description
Xac minh endpoint user effective permissions tong hop dung quyen tu grant truc tiep va grant theo school, ke thua xuong node con.

### Precondition
- `userId` co `home_school_id` thuoc tenant.
- Co grant theo school tren node cha va grant truc tiep tren node khac.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/tenants/{tenantId}/users/{userId}/permissions` | API tra `200 OK` |
| 2 | Kiem tra danh sach node tra ve | Bao gom node duoc grant truc tiep va cac node con inherited |
| 3 | Kiem tra co quyen tren moi node | `canView/canDownload/canComment` duoc OR dung theo cac grant lien quan |

---

## Test Case: TC-3.5-08 - Tu choi request khi gui dong thoi schoolId va userId

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.5-08  
**AC Covered:** AC-3.5-03  

### Description
Xac minh API khong cho phep cap quyen cho 2 grantee cung luc.

### Precondition
- TENANT_ADMIN token hop le.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /permissions` voi body co ca `schoolId` va `userId` | API tra `400 Bad Request` |
| 2 | Kiem tra message loi | Thong bao chi duoc chon mot grantee |

---

## Test Case: TC-3.5-09 - Tu choi request khi khong co quyen nao duoc cap

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** Medium  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.5-09  
**AC Covered:** AC-3.5-02  

### Description
Xac minh API tu choi neu ca 3 co quyen deu false.

### Precondition
- TENANT_ADMIN token hop le.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /permissions` voi `canView=false`, `canDownload=false`, `canComment=false` | API tra `400 Bad Request` |
| 2 | Kiem tra message loi | Thong bao phai cap it nhat mot quyen |

---

## Test Case: TC-3.5-10 - Tu choi grant voi school khong thuoc tenant

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.5-10  
**AC Covered:** AC-3.5-03  

### Description
Xac minh khong the grant cho school ngoai tenant context.

### Precondition
- Co `schoolId` khong co trong `school_tenant_mapping` cua tenant dang test.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /permissions` voi `schoolId` ngoai tenant | API tra `400 Bad Request` |
| 2 | Kiem tra message loi | Thong bao school khong thuoc tenant |

---

## Test Case: TC-3.5-11 - Tu choi grant voi user khong thuoc tenant

**Module:** ContentManagement  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Negative Test  
**Attachments:** [None]  
**Id:** TC-3.5-11  
**AC Covered:** AC-3.5-03  

### Description
Xac minh khong the grant cho user khong co assignment trong tenant.

### Precondition
- Co `userId` khong ton tai trong `user_tenant_role_assignment` cua tenant.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /permissions` voi `userId` ngoai tenant | API tra `400 Bad Request` |
| 2 | Kiem tra message loi | Thong bao user khong thuoc tenant |

---

## Test Case: TC-3.5-12 - Kiem tra authorization theo permission code

**Module:** ContentManagement / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Security Test  
**Attachments:** [None]  
**Id:** TC-3.5-12  
**AC Covered:** AC-3.5-05  

### Description
Xac minh endpoint grant/revoke/list bi bao ve boi permission code dung (`CONTENT_PERMISSION_GRANT`, `CONTENT_PERMISSION_REVOKE`).

### Precondition
- Co 2 token:
  - Token A: co du quyen grant/revoke.
  - Token B: khong co quyen grant/revoke.

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dung token B goi `GET /api/tenants/{tenantId}/permissions` | `403 Forbidden` |
| 2 | Dung token B goi `POST /api/tenants/{tenantId}/permissions` | `403 Forbidden` |
| 3 | Dung token B goi `DELETE /api/tenants/{tenantId}/permissions/{permissionId}` | `403 Forbidden` |
| 4 | Dung token A goi cac API tren | Thanh cong (`200/204`) |

---

## Notes for Execution

- Neu login gap `CONCURRENT_SESSION_LIMIT`, thu hoi session cu hoac dung account test khac.
- Neu can trace DB:
  - table `content_permission` kiem tra `is_deleted`, `updated_at`
  - relation `curriculum_node` de verify inherited query
- Khuyen nghi thu test voi cay it nhat 3 cap de kiem chung inheritance ro rang.
