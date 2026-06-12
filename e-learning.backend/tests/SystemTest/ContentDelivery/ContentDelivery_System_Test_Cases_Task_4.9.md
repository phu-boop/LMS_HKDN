# System Test Cases: Task 4.9 - Quick Access and dashboard

**Module:** ContentDelivery / Viewer / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security + Regression  
**Attachments:** [None]  
**Id:** ST-CLIENT-4.9

## Scope
- Task 4.9 - Truy cap nhanh tren dashboard.
- API pham vi kiem thu:
  - GET /api/client/dashboard/summary
  - GET /api/client/dashboard/quick-access?page={page}&pageSize={pageSize}
- Rule sap xep:
  - Group 1: viewed this week va khong nam trong favorites.
  - Group 2: favorites.
- Muc tieu verify:
  - Dung thu tu group.
  - Khong trung item giua 2 group.
  - Co paging.
  - Co filter theo quyen xem + publish + visibility.

## Acceptance Criteria Index

- **AC-4.9-00:** Dashboard co summary metrics cho user hien tai.
- **AC-4.9-01:** Tra ve dung thu tu uu tien Group 1 truoc Group 2.
- **AC-4.9-02:** Co paging va thong tin tong so ban ghi.
- **AC-4.9-03:** Chi tra item user con quyen xem.
- **AC-4.9-04:** Chi tra content PUBLISHED va dang visible.
- **AC-4.9-05:** Moi item co metadata phuc vu resume/favorite.

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-4.9-00 | Dashboard summary tra ve day du metrics | AC-4.9-00 |
| TC-4.9-01 | Quick access tra Group 1 truoc Group 2 | AC-4.9-01 |
| TC-4.9-02 | Item vua viewed-week vua favorite chi xuat hien Group 2 | AC-4.9-01 |
| TC-4.9-03 | Paging page=1/page=2 khong trung item | AC-4.9-02 |
| TC-4.9-04 | User khong co quyen xem thi item khong xuat hien | AC-4.9-03 |
| TC-4.9-05 | Content DRAFT/ngoai visibility khong xuat hien | AC-4.9-04 |
| TC-4.9-06 | Validate schema item (progress/favorite metadata) | AC-4.9-05 |
| TC-4.9-07 | Summary voi user khong co quyen tra ve 0 metrics | AC-4.9-00, AC-4.9-03 |

## Coverage Summary

- Tong so Acceptance Criteria can cover: **6**
- Tong so Test Case: **8**
- Ket luan coverage: **Da cover du yeu cau quick-access + paging + security filtering**.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- Da apply migrations moi nhat, co user_content_progress data.
- Da co token:
  - `TOKEN_TEACHER_A`: user co quyen node Math.
  - `TOKEN_TEACHER_B`: user khong co quyen node Math.

### Mock IDs

- tenantId: `00000000-0000-0000-0000-000000000002`
- nodeMath: `a1000000-0000-0000-0000-000000000002`
- contentVideo: `c1000000-0000-0000-0000-000000000001`
- contentPdf: `c1000000-0000-0000-0000-000000000002`
- contentDraft: `c1000000-0000-0000-0000-000000000003`

---

## Quick Start

```bash
BASE_URL="http://localhost:5294"
TOKEN_TEACHER_A="PASTE_TOKEN_HERE"
TOKEN_TEACHER_B="PASTE_TOKEN_HERE"

curl -sS "$BASE_URL/api/client/dashboard/quick-access?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

curl -sS "$BASE_URL/api/client/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq
```

---

## Mock Data SQL

```sql
-- Reset quick-access related data cho user A
DELETE FROM user_favorite_content
WHERE user_id = '00000000-0000-0000-0004-000000000003'
  AND content_item_id IN (
      'c1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000002'
  );

DELETE FROM user_content_progress
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND user_id = '00000000-0000-0000-0004-000000000003'
  AND content_item_id IN (
      'c1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000002'
  );

-- contentVideo: viewed this week, khong favorite => Group 1
INSERT INTO user_content_progress
(id, tenant_id, user_id, content_item_id, progress_value, is_deleted, created_at, updated_at)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0004-000000000003',
 'c1000000-0000-0000-0000-000000000001', 120000, FALSE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- contentPdf: favorite => Group 2
INSERT INTO user_favorite_content (id, user_id, content_item_id, created_at)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0004-000000000003', 'c1000000-0000-0000-0000-000000000002', NOW())
ON CONFLICT (user_id, content_item_id) DO NOTHING;
```

---

## Test Cases

## Test Case: TC-4.9-00 - Dashboard summary tra ve day du metrics

**Id:** TC-4.9-00  
**AC Covered:** AC-4.9-00

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/dashboard/summary` voi user A | `200 OK` |
| 2 | Kiem tra body | Co `viewedThisWeekCount`, `favoriteCount`, `favoriteAddedThisWeekCount`, `lastLearningAt` |
| 3 | Kiem tra gia tri | Cac count >= 0, `lastLearningAt` co the null hoac timestamp hop le |

---

## Test Case: TC-4.9-01 - Quick access tra Group 1 truoc Group 2

**Id:** TC-4.9-01  
**AC Covered:** AC-4.9-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi API quick-access voi user A | `200 OK` |
| 2 | Kiem tra item dau danh sach | Co `group = VIEWED_THIS_WEEK` |
| 3 | Kiem tra item favorite | Nam sau nhom viewed-this-week |

---

## Test Case: TC-4.9-02 - Item vua viewed-week vua favorite chi xuat hien Group 2

**Id:** TC-4.9-02  
**AC Covered:** AC-4.9-01

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Tao favorite cho contentVideo da viewed-week | Tao thanh cong |
| 2 | Goi quick-access | ContentVideo chi xuat hien 1 lan |
| 3 | Kiem tra group cua contentVideo | `group = FAVORITE` |

---

## Test Case: TC-4.9-03 - Paging page=1/page=2 khong trung item

**Id:** TC-4.9-03  
**AC Covered:** AC-4.9-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `page=1&pageSize=1` | `200 OK`, tra 1 item |
| 2 | Goi `page=2&pageSize=1` | `200 OK`, tra item khac |
| 3 | Kiem tra metadata | Co `totalCount`, `page`, `pageSize` dung gia tri |

---

## Test Case: TC-4.9-04 - User khong co quyen xem thi item khong xuat hien

**Id:** TC-4.9-04  
**AC Covered:** AC-4.9-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi quick-access voi user B | `200 OK` |
| 2 | Kiem tra body | `items = []` hoac khong chua item ngoai quyen |

---

## Test Case: TC-4.9-05 - Content DRAFT/ngoai visibility khong xuat hien

**Id:** TC-4.9-05  
**AC Covered:** AC-4.9-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dam bao contentDraft dang DRAFT | Hop le |
| 2 | Goi quick-access voi user A | `200 OK` |
| 3 | Kiem tra danh sach | Khong co contentDraft |

---

## Test Case: TC-4.9-06 - Validate schema item (progress/favorite metadata)

**Id:** TC-4.9-06  
**AC Covered:** AC-4.9-05

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi quick-access | `200 OK` |
| 2 | Kiem tra tung item | Co `contentId`, `title`, `type`, `curriculumNodeId`, `curriculumNodeTitle`, `isFavorite`, `lastViewedAt`, `favoritedAt`, `progressValue`, `group` |

---

## Test Case: TC-4.9-07 - Summary voi user khong co quyen tra ve 0 metrics

**Id:** TC-4.9-07  
**AC Covered:** AC-4.9-00, AC-4.9-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/dashboard/summary` voi user B | `200 OK` |
| 2 | Kiem tra body | `viewedThisWeekCount = 0`, `favoriteCount = 0`, `favoriteAddedThisWeekCount = 0`, `lastLearningAt = null` |

---

## Notes for Execution

- Rule expected: Group 1 la viewed-this-week khong favorite; Group 2 la favorite.
- Neu khong co du data de paging, bo sung them viewed/favorite records cho user test.
- Neu gap item ngoai quyen, verify lai content_permission + tenant context trong token.
