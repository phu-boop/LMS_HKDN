# System Test Cases: Task 4.2 + 4.3 + 4.4 - Client Curriculum Explorer + Viewer URLs

**Module:** ContentDelivery / Viewer / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression + Functional + Security  
**Attachments:** [None]  
**Id:** ST-CLIENT-4.2-4.3-4.4  

## Scope
- Task 4.2 - Duyet Cay Hoc lieu (Curriculum Explorer)
- Task 4.3 - E-Learning Viewer (Video HLS URL)
- Task 4.4 - E-Learning Viewer (Document View URL)
- API pham vi kiem thu:
  GET /api/api/client/curriculum
  GET /api/api/client/curriculum/{nodeId}/contents
  GET /api/api/client/contents/{contentId}/stream-url
  GET /api/api/client/contents/{contentId}/view-url
  GET /api/api/client/contents/{contentId}/download-url

## Acceptance Criteria Index

- **AC-4.2-01:** User chi thay node duoc cap quyen (khong thay node ngoai quyen)
- **AC-4.2-02:** Mo node xem duoc danh sach noi dung theo quyen
- **AC-4.3-01:** Content VIDEO lay duoc signed HLS stream URL hop le
- **AC-4.3-02:** Khong tra stream URL cho content khong hop loai/khong du quyen
- **AC-4.4-01:** Content PDF/SLIDE/WORD lay duoc signed view URL hop le
- **AC-4.4-02:** Download URL chi tra khi co `CanDownload` va `is_downloadable = true`

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-4.2-01 | Lay curriculum tree theo quyen view | AC-4.2-01 |
| TC-4.2-02 | Khong co quyen view thi tree rong | AC-4.2-01 |
| TC-4.2-03 | Lay contents theo node co quyen | AC-4.2-02 |
| TC-4.2-04 | Truy cap node khong quyen bi 403 | AC-4.2-01, AC-4.2-02 |
| TC-4.2-05 | Node contents chi tra content PUBLISHED | AC-4.2-02 |
| TC-4.3-01 | Lay stream-url cho VIDEO thanh cong | AC-4.3-01 |
| TC-4.3-02 | Goi stream-url voi PDF bi 400 | AC-4.3-02 |
| TC-4.3-03 | Khong quyen xem thi stream-url bi 403 | AC-4.3-02 |
| TC-4.3-04 | Content DRAFT/ngoai visibility bi 404 | AC-4.3-02 |
| TC-4.4-01 | Lay view-url cho PDF thanh cong | AC-4.4-01 |
| TC-4.4-02 | Lay view-url cho VIDEO bi 400 | AC-4.4-01 |
| TC-4.4-03 | Lay download-url du quyen thanh cong | AC-4.4-02 |
| TC-4.4-04 | Download-url bi 403 khi thieu quyen Download | AC-4.4-02 |
| TC-4.4-05 | Download-url bi 403 khi is_downloadable = false | AC-4.4-02 |

## Coverage Summary
- Tong so Acceptance Criteria can cover: **6**
- Tong so Test Case: **14**
- Ket luan coverage: **Du cover toan bo AC cho 4.2, 4.3, 4.4**.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- Da apply migrations moi nhat, co data tenant/school/user.
- Da implement Task 3.5 (permission distribution) va 4.2/4.3/4.4 backend.
- Co token:
  - `tokenTeacherA`: user co quyen xem node duoc cap
  - `tokenTeacherB`: user khong du quyen de test 403
- Tenant test:
  - `tenantId`: `00000000-0000-0000-0000-000000000002`

### Mock Data Pack (UUID co dinh)

#### A. Curriculum nodes
- `nodeRoot`: `a1000000-0000-0000-0000-000000000001`
- `nodeMath`: `a1000000-0000-0000-0000-000000000002` (con cua nodeRoot)
- `nodePhysics`: `a1000000-0000-0000-0000-000000000003` (con cua nodeRoot)

#### B. Users/School
- `schoolIdA`: `00000000-0000-0000-0001-000000000001`
- `teacherA`: `00000000-0000-0000-0004-000000000003`
- `teacherB`: `00000000-0000-0000-0004-000000000004`

#### C. Contents
- VIDEO PUBLISHED: `c1000000-0000-0000-0000-000000000001` (nodeMath)
- PDF PUBLISHED: `c1000000-0000-0000-0000-000000000002` (nodeMath)
- VIDEO DRAFT: `c1000000-0000-0000-0000-000000000003` (nodeMath)
- PDF PUBLISHED not-downloadable: `c1000000-0000-0000-0000-000000000004` (nodeMath)
- PDF PUBLISHED in nodePhysics: `c1000000-0000-0000-0000-000000000005` (nodePhysics)

#### D. Permissions
- Cap cho `teacherA` tren `nodeMath`: `canView=true`, `canDownload=true`, `canComment=true`
- Khong cap quyen cho `teacherB`

---

## Mock Data SQL (tham khao, chay trong DB dev)

```sql
-- 1) Curriculum
INSERT INTO curriculum_node (id, tenant_id, parent_id, node_type, code, title, sort_order, status, is_deleted, created_at, updated_at)
VALUES
('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', NULL, 'PROGRAM', 'P1', 'Program 1', 1, 'ACTIVE', FALSE, NOW(), NOW()),
('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'SUBJECT', 'MATH', 'Math', 1, 'ACTIVE', FALSE, NOW(), NOW()),
('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'SUBJECT', 'PHY', 'Physics', 2, 'ACTIVE', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2) Content items
INSERT INTO content_item
(id, tenant_id, curriculum_node_id, type, title, description, file_name, file_path, mime_type, file_size_bytes,
 publish_status, visibility_from, visibility_to, is_downloadable, watermark_enabled, signed_url_ttl,
 is_deleted, created_at, updated_at)
VALUES
('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
 'VIDEO', 'Video Algebra', 'Video test', 'video-algebra.mp4', 'tenants/00000000-0000-0000-0000-000000000002/contents/c1000000-0000-0000-0000-000000000001/hls/master.m3u8',
 'application/x-mpegURL', 1024000, 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', TRUE, TRUE, 3600, FALSE, NOW(), NOW()),

('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
 'PDF', 'PDF Algebra', 'PDF test', 'algebra.pdf', 'tenants/00000000-0000-0000-0000-000000000002/contents/c1000000-0000-0000-0000-000000000002/algebra.pdf',
 'application/pdf', 92000, 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', TRUE, TRUE, 3600, FALSE, NOW(), NOW()),

('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
 'VIDEO', 'Video Draft', 'Draft video', 'draft.mp4', 'tenants/00000000-0000-0000-0000-000000000002/contents/c1000000-0000-0000-0000-000000000003/hls/master.m3u8',
 'application/x-mpegURL', 11111, 'DRAFT', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', TRUE, TRUE, 3600, FALSE, NOW(), NOW()),

('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002',
 'PDF', 'PDF no download', 'No download', 'nodl.pdf', 'tenants/00000000-0000-0000-0000-000000000002/contents/c1000000-0000-0000-0000-000000000004/nodl.pdf',
 'application/pdf', 83000, 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', FALSE, TRUE, 3600, FALSE, NOW(), NOW()),

('c1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003',
 'PDF', 'PDF Physics', 'Physics doc', 'physics.pdf', 'tenants/00000000-0000-0000-0000-000000000002/contents/c1000000-0000-0000-0000-000000000005/physics.pdf',
 'application/pdf', 73000, 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', TRUE, TRUE, 3600, FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3) Permission: teacherA duoc xem/download nodeMath
INSERT INTO content_permission
(id, tenant_id, curriculum_node_id, school_id, user_id, can_view, can_download, can_comment, is_deleted, created_at, updated_at)
VALUES
('p1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', NULL,
 '00000000-0000-0000-0004-000000000003', TRUE, TRUE, TRUE, FALSE, NOW(), NOW())
ON CONFLICT DO NOTHING;
```

---

## Test Cases

## Test Case: TC-4.2-01 - Lay curriculum tree theo quyen view

**Module:** ContentDelivery  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-4.2-01  
**AC Covered:** AC-4.2-01  

### Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum` voi `tokenTeacherA` | `200 OK` |
| 2 | Kiem tra body | Co node `nodeMath`, khong co `nodePhysics` |

---

## Test Case: TC-4.2-02 - Khong co quyen view thi tree rong

**Id:** TC-4.2-02  
**AC Covered:** AC-4.2-01  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum` voi `tokenTeacherB` | `200 OK` |
| 2 | Kiem tra body | `[]` |

---

## Test Case: TC-4.2-03 - Lay contents theo node co quyen

**Id:** TC-4.2-03  
**AC Covered:** AC-4.2-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum/{nodeMath}/contents?page=1&pageSize=20` voi `tokenTeacherA` | `200 OK` |
| 2 | Kiem tra items | Co `c100...001`, `c100...002`, `c100...004`; khong co `c100...003` (DRAFT) |

---

## Test Case: TC-4.2-04 - Truy cap node khong quyen bi 403

**Id:** TC-4.2-04  
**AC Covered:** AC-4.2-01, AC-4.2-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum/{nodePhysics}/contents` voi `tokenTeacherA` | `403 Forbidden` |

---

## Test Case: TC-4.2-05 - Node contents chi tra content PUBLISHED

**Id:** TC-4.2-05  
**AC Covered:** AC-4.2-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/curriculum/{nodeMath}/contents` | `200 OK` |
| 2 | Verify result | Khong co content `publish_status = DRAFT/ARCHIVED` |

---

## Test Case: TC-4.3-01 - Lay stream-url cho VIDEO thanh cong

**Id:** TC-4.3-01  
**AC Covered:** AC-4.3-01  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000001/stream-url` voi `tokenTeacherA` | `200 OK` |
| 2 | Kiem tra response | Co `url` (presigned), `type = stream` |

---

## Test Case: TC-4.3-02 - Goi stream-url voi PDF bi 400

**Id:** TC-4.3-02  
**AC Covered:** AC-4.3-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000002/stream-url` | `400 Bad Request` |
| 2 | Kiem tra message | `stream-url only supports VIDEO content.` |

---

## Test Case: TC-4.3-03 - Khong quyen xem thi stream-url bi 403

**Id:** TC-4.3-03  
**AC Covered:** AC-4.3-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000001/stream-url` voi `tokenTeacherB` | `403 Forbidden` |

---

## Test Case: TC-4.3-04 - Content DRAFT/ngoai visibility bi 404

**Id:** TC-4.3-04  
**AC Covered:** AC-4.3-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000003/stream-url` | `404 Not Found` |

---

## Test Case: TC-4.4-01 - Lay view-url cho PDF thanh cong

**Id:** TC-4.4-01  
**AC Covered:** AC-4.4-01  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000002/view-url` voi `tokenTeacherA` | `200 OK` |
| 2 | Kiem tra response | Co `url` (presigned), `type = view` |

---

## Test Case: TC-4.4-02 - Lay view-url cho VIDEO bi 400

**Id:** TC-4.4-02  
**AC Covered:** AC-4.4-01  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000001/view-url` | `400 Bad Request` |
| 2 | Kiem tra message | `view-url only supports PDF, SLIDE, or WORD content.` |

---

## Test Case: TC-4.4-03 - Lay download-url du quyen thanh cong

**Id:** TC-4.4-03  
**AC Covered:** AC-4.4-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000002/download-url` voi `tokenTeacherA` | `200 OK` |
| 2 | Kiem tra response | Co `url`, `type = download` |

---

## Test Case: TC-4.4-04 - Download-url bi 403 khi thieu quyen Download

**Id:** TC-4.4-04  
**AC Covered:** AC-4.4-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Cap lai permission cho `teacherA` tren nodeMath voi `canDownload=false` | `200 OK` |
| 2 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000002/download-url` | `403 Forbidden` |

---

## Test Case: TC-4.4-05 - Download-url bi 403 khi is_downloadable = false

**Id:** TC-4.4-05  
**AC Covered:** AC-4.4-02  

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/c1000000-0000-0000-0000-000000000004/download-url` (content co `is_downloadable=false`) | `403 Forbidden` |

---

## Quick Curl Collection (tham khao)

```bash
# 4.2 tree
curl -sS "$APP_URL/api/client/curriculum" -H "Authorization: Bearer $TOKEN_TEACHER_A"

# 4.2 node contents
curl -sS "$APP_URL/api/client/curriculum/a1000000-0000-0000-0000-000000000002/contents?page=1&pageSize=20" -H "Authorization: Bearer $TOKEN_TEACHER_A"

# 4.3 stream url
curl -sS "$APP_URL/api/client/contents/c1000000-0000-0000-0000-000000000001/stream-url" -H "Authorization: Bearer $TOKEN_TEACHER_A"

# 4.4 view url
curl -sS "$APP_URL/api/client/contents/c1000000-0000-0000-0000-000000000002/view-url" -H "Authorization: Bearer $TOKEN_TEACHER_A"

# 4.4 download url
curl -sS "$APP_URL/api/client/contents/c1000000-0000-0000-0000-000000000002/download-url" -H "Authorization: Bearer $TOKEN_TEACHER_A"
```

---

## Notes for Execution

- Neu gap `403` cho user da cap quyen: kiem tra lai tenant context trong token (`tenant_id`) va node permission ke thua.
- Neu gap `503 Object storage is not configured`: kiem tra MinIO/object storage config trong environment.
- Neu stream/view URL tra ve nhung player khong mo duoc: verify object da ton tai dung `file_path`/HLS key trong bucket.
- Khuyen nghi retest cross-flow sau moi lan doi permission:
  1) `/api/client/curriculum`
  2) `/api/client/curriculum/{nodeId}/contents`
  3) `/api/client/contents/{contentId}/stream-url|view-url|download-url`
