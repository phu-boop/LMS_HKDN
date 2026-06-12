# System Test Cases: Task 4.10 - Continue Learning Progress

**Module:** ContentDelivery / Viewer / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security + Regression  
**Attachments:** [None]  
**Id:** ST-CLIENT-4.10

## Scope
- Task 4.10 - Luu va resume tien do hoc theo user/content.
- API pham vi kiem thu:
  - GET /api/client/curriculum/contents/{contentId}/progress
  - PUT /api/client/curriculum/contents/{contentId}/progress
- Muc tieu verify:
  - Upsert dung hanh vi: chua co thi tao moi, da co thi cap nhat.
  - Chi user co quyen view noi dung moi doc/ghi duoc progress.
  - Progress khong am.
  - Noi dung URL khong cho luu progress.
  - Moi user co progress rieng, khong bi leak qua user khac.

## Acceptance Criteria Index

- **AC-4.10-01:** Luu progress theo user + content.
- **AC-4.10-02:** Co che upsert (insert/update) hoat dong dung.
- **AC-4.10-03:** Co kiem tra quyen truy cap content truoc khi doc/ghi progress.
- **AC-4.10-04:** Progress value phai hop le (>= 0).
- **AC-4.10-05:** Frontend lay duoc progress de resume vi tri hoc.

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-4.10-01 | GET progress khi chua co du lieu | AC-4.10-01, AC-4.10-05 |
| TC-4.10-02 | PUT progress tao moi ban ghi | AC-4.10-01, AC-4.10-02 |
| TC-4.10-03 | PUT progress cap nhat ban ghi da co | AC-4.10-02, AC-4.10-05 |
| TC-4.10-04 | PUT progress am bi 400 | AC-4.10-04 |
| TC-4.10-05 | User khong co quyen view bi 403 | AC-4.10-03 |
| TC-4.10-06 | Content DRAFT/ngoai visibility bi 404 | AC-4.10-03 |
| TC-4.10-07 | Content URL bi 400 khi PUT progress | AC-4.10-03 |
| TC-4.10-08 | User A va User B co progress doc lap | AC-4.10-01, AC-4.10-05 |

## Coverage Summary

- Tong so Acceptance Criteria can cover: **5**
- Tong so Test Case: **8**
- Ket luan coverage: **Da cover du hanh vi API GET/PUT progress + security checks**.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- Da apply migration moi nhat co bang `user_content_progress`.
- Da co content publish va permission nhu task 4.2/4.3/4.4.
- Da co token:
  - `TOKEN_TEACHER_A`: user co quyen view node Math.
  - `TOKEN_TEACHER_B`: user khong co quyen view node Math.

### Mock Data IDs

- tenantId: `00000000-0000-0000-0000-000000000002`
- contentVideoPublished: `c1000000-0000-0000-0000-000000000001`
- contentPdfPublished: `c1000000-0000-0000-0000-000000000002`
- contentVideoDraft: `c1000000-0000-0000-0000-000000000003`
- contentUrlPublished: `c1000000-0000-0000-0000-000000000007`

---

## Quick Start

```bash
BASE_URL="http://localhost:5294"
TOKEN_TEACHER_A="PASTE_TOKEN_HERE"
TOKEN_TEACHER_B="PASTE_TOKEN_HERE"

CONTENT_VIDEO="c1000000-0000-0000-0000-000000000001"
CONTENT_PDF="c1000000-0000-0000-0000-000000000002"
CONTENT_VIDEO_DRAFT="c1000000-0000-0000-0000-000000000003"
CONTENT_URL="c1000000-0000-0000-0000-000000000007"
```

Lenh mau:

```bash
curl -sS "$BASE_URL/api/client/curriculum/contents/$CONTENT_VIDEO/progress" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq
```

---

## Mock Data SQL

```sql
-- Tao content URL de test case URL khong ho tro progress
INSERT INTO content_item
(id, tenant_id, curriculum_node_id, type, title, description, source_url,
 publish_status, visibility_from, visibility_to, is_downloadable, watermark_enabled, signed_url_ttl,
 is_deleted, created_at, updated_at)
VALUES
('c1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
 'URL', 'External resource', 'URL content for progress negative test', 'https://example.com/resource',
 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', FALSE, TRUE, 3600,
 FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Reset progress de test tu dau
DELETE FROM user_content_progress
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND content_item_id IN (
      'c1000000-0000-0000-0000-000000000001',
      'c1000000-0000-0000-0000-000000000002',
      'c1000000-0000-0000-0000-000000000007'
  );
```

---

## Test Cases

## Test Case: TC-4.10-01 - GET progress khi chua co du lieu

**Id:** TC-4.10-01  
**AC Covered:** AC-4.10-01, AC-4.10-05

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum/contents/{contentVideoPublished}/progress` voi `TOKEN_TEACHER_A` | `200 OK` |
| 2 | Kiem tra body | `progressValue = 0`, `updatedAt = null` |

---

## Test Case: TC-4.10-02 - PUT progress tao moi ban ghi

**Id:** TC-4.10-02  
**AC Covered:** AC-4.10-01, AC-4.10-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `PUT /api/client/curriculum/contents/{contentVideoPublished}/progress` body `{ "progressValue": 183000 }` | `200 OK` |
| 2 | Goi lai GET progress | `progressValue = 183000`, `updatedAt != null` |

Curl tham khao:

```bash
curl -sS -X PUT "$BASE_URL/api/client/curriculum/contents/$CONTENT_VIDEO/progress" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" \
  -H "Content-Type: application/json" \
  -d '{"progressValue":183000}' | jq
```

---

## Test Case: TC-4.10-03 - PUT progress cap nhat ban ghi da co

**Id:** TC-4.10-03  
**AC Covered:** AC-4.10-02, AC-4.10-05

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | PUT progress lan 1 = `183000` | `200 OK` |
| 2 | PUT progress lan 2 = `240500` | `200 OK` |
| 3 | GET progress | Gia tri cuoi cung la `240500` |

---

## Test Case: TC-4.10-04 - PUT progress am bi 400

**Id:** TC-4.10-04  
**AC Covered:** AC-4.10-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi PUT body `{ "progressValue": -1 }` | `400 Bad Request` |
| 2 | Kiem tra message | Co thong bao progress phai >= 0 |

---

## Test Case: TC-4.10-05 - User khong co quyen view bi 403

**Id:** TC-4.10-05  
**AC Covered:** AC-4.10-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi GET progress voi `TOKEN_TEACHER_B` | `403 Forbidden` |
| 2 | Goi PUT progress voi `TOKEN_TEACHER_B` | `403 Forbidden` |

---

## Test Case: TC-4.10-06 - Content DRAFT/ngoai visibility bi 404

**Id:** TC-4.10-06  
**AC Covered:** AC-4.10-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | GET progress voi `contentVideoDraft` | `404 Not Found` |
| 2 | PUT progress voi `contentVideoDraft` | `404 Not Found` |

---

## Test Case: TC-4.10-07 - Content URL bi 400 khi PUT progress

**Id:** TC-4.10-07  
**AC Covered:** AC-4.10-03

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | GET progress voi content URL | `200 OK` (duoc doc mac dinh/neu da co) |
| 2 | PUT progress voi content URL | `400 Bad Request` |
| 3 | Kiem tra message | `Progress tracking is not supported for URL content.` |

---

## Test Case: TC-4.10-08 - User A va User B co progress doc lap

**Id:** TC-4.10-08  
**AC Covered:** AC-4.10-01, AC-4.10-05

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | User A PUT progress = `10` tren content PDF | `200 OK` |
| 2 | User B co quyen tuong duong (neu cap tam de test) PUT progress = `7` | `200 OK` |
| 3 | User A GET progress | Nhan gia tri `10` |
| 4 | User B GET progress | Nhan gia tri `7` |

---

## Notes for Execution

- Neu gap `403` ngoai du kien, kiem tra permission tren `curriculum_node` cua content.
- Neu gap `404` voi content published, kiem tra `visibility_from`, `visibility_to` va `publish_status`.
- API progress dang cho GET voi content URL de client khong vo tinh fail man hinh lich su; chi chan hanh vi ghi (PUT).
