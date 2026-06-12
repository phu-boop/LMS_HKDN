# System Test Cases: Task 4.8 - My Favorites (Kho hoc lieu ca nhan)

**Module:** Viewer / ContentDelivery / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security + Regression  
**Attachments:** [None]  
**Id:** ST-CLIENT-4.8

## Scope

- Task 4.8 - My Favorites.
- API pham vi kiem thu:
  - GET /api/client/favorites
  - POST /api/client/favorites/{contentId}
  - DELETE /api/client/favorites/{contentId}
- Muc tieu verify:
  - Them/xoa favorite hoat dong dung va idempotent.
  - Danh sach favorite chi hien thi noi dung current user con quyen view.
  - Favorite duoc luu theo tung user (khong leak data user khac).
  - Content khong ton tai / khong visible / khong co quyen thi khong cho add favorite.

## Acceptance Criteria Index

- **AC-4.8-01:** Them / xoa noi dung vao danh sach yeu thich.
- **AC-4.8-02:** Man hinh kho ca nhan Grid/List lay data favorite dung schema.
- **AC-4.8-03:** Chi hien thi noi dung user con quyen truy cap.
- **AC-4.8-04:** Du lieu favorite luu theo tung user.

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-4.8-01 | GET favorites khi chua co du lieu | AC-4.8-02 |
| TC-4.8-02 | POST add favorite thanh cong | AC-4.8-01 |
| TC-4.8-03 | POST add favorite lap lai van 204 | AC-4.8-01 |
| TC-4.8-04 | DELETE favorite thanh cong | AC-4.8-01 |
| TC-4.8-05 | DELETE favorite khong ton tai tra 404 | AC-4.8-01 |
| TC-4.8-06 | POST favorite content khong ton tai tra 404 | AC-4.8-01 |
| TC-4.8-07 | POST favorite content DRAFT/ngoai visibility tra 404 | AC-4.8-01, AC-4.8-03 |
| TC-4.8-08 | POST favorite content khong co quyen view tra 403 | AC-4.8-03 |
| TC-4.8-09 | Favorite da luu nhung mat quyen view thi bi an khoi GET list | AC-4.8-03 |
| TC-4.8-10 | User A va User B co danh sach favorite doc lap | AC-4.8-04 |
| TC-4.8-11 | Validate schema item de render Grid/List | AC-4.8-02 |

## Coverage Summary

- Tong so Acceptance Criteria can cover: **4**
- Tong so Test Case: **11**
- Ket luan coverage: **Da cover day du CRUD favorite + filtering theo quyen + data isolation theo user**.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- Da apply migration moi nhat, co bang `user_favorite_content`.
- Da co content publish va permission nhu task 4.2/4.3/4.4.
- Da co token:
  - `TOKEN_TEACHER_A`: user co quyen node Math.
  - `TOKEN_TEACHER_B`: user khong co quyen node Math (hoac chi co quyen node khac).

### Mock IDs

- tenantId: `00000000-0000-0000-0000-000000000002`
- userTeacherA: `00000000-0000-0000-0004-000000000003`
- userTeacherB: `00000000-0000-0000-0004-000000000004`
- nodeMath: `a1000000-0000-0000-0000-000000000002`
- nodePhysics: `a1000000-0000-0000-0000-000000000003`
- contentVideoPublishedMath: `c1000000-0000-0000-0000-000000000001`
- contentPdfPublishedMath: `c1000000-0000-0000-0000-000000000002`
- contentVideoDraftMath: `c1000000-0000-0000-0000-000000000003`
- contentPdfPublishedPhysics: `c1000000-0000-0000-0000-000000000005`

---

## Quick Start

```bash
BASE_URL="http://localhost:5294"
TOKEN_TEACHER_A="PASTE_TOKEN_HERE"
TOKEN_TEACHER_B="PASTE_TOKEN_HERE"

CONTENT_VIDEO_MATH="c1000000-0000-0000-0000-000000000001"
CONTENT_PDF_MATH="c1000000-0000-0000-0000-000000000002"
CONTENT_VIDEO_DRAFT="c1000000-0000-0000-0000-000000000003"
CONTENT_PDF_PHYSICS="c1000000-0000-0000-0000-000000000005"

curl -sS "$BASE_URL/api/client/favorites" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq
```

---

## Mock Data SQL

```sql
-- 1) Reset favorite data cho 2 user test
DELETE FROM user_favorite_content
WHERE user_id IN (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0004-000000000004'
)
AND content_item_id IN (
    'c1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000005'
);

-- 2) Tao favorite mau cho teacher A
INSERT INTO user_favorite_content (id, user_id, content_item_id, created_at)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'c1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'c1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '30 minute')
ON CONFLICT (user_id, content_item_id) DO NOTHING;

-- 3) Tao favorite rieng cho teacher B de test isolation
INSERT INTO user_favorite_content (id, user_id, content_item_id, created_at)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0004-000000000004', 'c1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '10 minute')
ON CONFLICT (user_id, content_item_id) DO NOTHING;
```

---

## Expected Response Shape

Mau response mong doi tu `GET /api/client/favorites`:

```json
[
  {
    "id": "f2b9e5d2-8ca3-4b26-8f53-6ad2b5a1c7ef",
    "contentItemId": "c1000000-0000-0000-0000-000000000002",
    "curriculumNodeId": "a1000000-0000-0000-0000-000000000002",
    "contentItemTitle": "PDF Algebra",
    "curriculumNodeTitle": "Math",
    "type": "PDF",
    "createdAt": "2026-05-19T09:00:00Z"
  }
]
```

Field can note nhanh:

- `contentItemId`: dung de mo viewer chi tiet noi dung.
- `type`: client quyet dinh icon/the hien card Grid/List.
- `createdAt`: client co the sort theo moi them gan day.

---

## Test Cases

## Test Case: TC-4.8-01 - GET favorites khi chua co du lieu

**Id:** TC-4.8-01  
**AC Covered:** AC-4.8-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Xoa het favorite cua user A (hoac chay SQL reset) | Thanh cong |
| 2 | Goi `GET /api/client/favorites` voi `TOKEN_TEACHER_A` | `200 OK` |
| 3 | Kiem tra body | `[]` |

---

## Test Case: TC-4.8-02 - POST add favorite thanh cong

**Id:** TC-4.8-02  
**AC Covered:** AC-4.8-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `POST /api/client/favorites/{contentPdfPublishedMath}` voi user A | `204 No Content` |
| 2 | Goi lai GET favorites | Danh sach co `contentPdfPublishedMath` |

Curl tham khao:

```bash
curl -sS -X POST "$BASE_URL/api/client/favorites/$CONTENT_PDF_MATH" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" \
  -i
```

---

## Test Case: TC-4.8-03 - POST add favorite lap lai van 204

**Id:** TC-4.8-03  
**AC Covered:** AC-4.8-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | POST add `contentPdfPublishedMath` lan 1 | `204 No Content` |
| 2 | POST add cung content lan 2 | Van `204 No Content` |
| 3 | GET favorites | Item chi xuat hien 1 lan |

---

## Test Case: TC-4.8-04 - DELETE favorite thanh cong

**Id:** TC-4.8-04  
**AC Covered:** AC-4.8-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dam bao `contentVideoPublishedMath` dang la favorite cua user A | Hop le |
| 2 | Goi `DELETE /api/client/favorites/{contentVideoPublishedMath}` | `204 No Content` |
| 3 | Goi GET favorites | Khong con `contentVideoPublishedMath` |

---

## Test Case: TC-4.8-05 - DELETE favorite khong ton tai tra 404

**Id:** TC-4.8-05  
**AC Covered:** AC-4.8-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dam bao user A khong co favorite `contentPdfPublishedPhysics` | Hop le |
| 2 | Goi `DELETE /api/client/favorites/{contentPdfPublishedPhysics}` | `404 Not Found` |

---

## Test Case: TC-4.8-06 - POST favorite content khong ton tai tra 404

**Id:** TC-4.8-06  
**AC Covered:** AC-4.8-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi POST voi `contentId` random guid khong ton tai | `404 Not Found` |

---

## Test Case: TC-4.8-07 - POST favorite content DRAFT/ngoai visibility tra 404

**Id:** TC-4.8-07  
**AC Covered:** AC-4.8-01, AC-4.8-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi POST voi `contentVideoDraftMath` bang user A | `404 Not Found` |
| 2 | (Optional) Chinh `visibility_from` o tuong lai roi POST lai | Van `404 Not Found` |

---

## Test Case: TC-4.8-08 - POST favorite content khong co quyen view tra 403

**Id:** TC-4.8-08  
**AC Covered:** AC-4.8-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | User A goi POST favorite `contentPdfPublishedPhysics` (node ngoai quyen) | `403 Forbidden` |

---

## Test Case: TC-4.8-09 - Favorite da luu nhung mat quyen view thi bi an khoi GET list

**Id:** TC-4.8-09  
**AC Covered:** AC-4.8-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dam bao user A da favorite `contentPdfPublishedMath` | Hop le |
| 2 | Thu hoi quyen `can_view` cua user A tren `nodeMath` | Update permission thanh cong |
| 3 | Goi `GET /api/client/favorites` voi user A | `200 OK` |
| 4 | Kiem tra danh sach | Khong con item thuoc `nodeMath` |

SQL tham khao de thu hoi quyen:

```sql
UPDATE content_permission
SET can_view = FALSE,
    updated_at = NOW()
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND user_id = '00000000-0000-0000-0004-000000000003'
  AND curriculum_node_id = 'a1000000-0000-0000-0000-000000000002';
```

---

## Test Case: TC-4.8-10 - User A va User B co danh sach favorite doc lap

**Id:** TC-4.8-10  
**AC Covered:** AC-4.8-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | User A POST favorite `contentVideoPublishedMath` | `204 No Content` |
| 2 | User B POST favorite content rieng cua user B (neu co quyen) | `204 No Content` hoac bo qua buoc nay neu khong co quyen |
| 3 | User A GET favorites | Chi thay item cua user A |
| 4 | User B GET favorites | Chi thay item cua user B |

---

## Test Case: TC-4.8-11 - Validate schema item de render Grid/List

**Id:** TC-4.8-11  
**AC Covered:** AC-4.8-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi GET favorites voi user A | `200 OK` |
| 2 | Kiem tra tung item | Co `id`, `contentItemId`, `curriculumNodeId`, `contentItemTitle`, `curriculumNodeTitle`, `type`, `createdAt` |
| 3 | Kiem tra sap xep | Item moi them gan day xuat hien truoc |

---

## Notes for Execution

- Endpoint yeu cau auth policy `CURRICULUM_VIEW`, vi vay khong co token hop le se bi `401/403` truoc khi vao handler.
- `POST` add favorite duoc thiet ke idempotent: goi lap lai khong tao duplicate.
- `DELETE` chi xoa favorite cua chinh current user, khong anh huong user khac.
- Neu test `TC-4.8-09`, nho rollback lai `can_view = TRUE` de khong anh huong cac case khac.
