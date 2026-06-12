# System Test Cases: Content Management (Task 3.2)

## Test Suite Overview

**Module:** ContentManagement — Content CMS  
**Task:** 3.2 — Quản lý Nội dung Đa phương tiện (Content CMS)  
**Platform:** LMS Backend API  
**Test Type:** API System Tests  
**Priority:** High  
**Status:** Ready for Testing  

---

## Test Environment Setup

### Preconditions

- **API URL**: `http://localhost:5294`
- **Database**: PostgreSQL `lms_dev` (migrations V1-V8 applied)
- **Test Account (TENANT_ADMIN)**:
  - Username: `stem_admin`
  - Password: `Admin@123`
  - Tenant: `STEM` (UUID: `00000000-0000-0000-0000-000000000002`)
  - Permissions: `CURRICULUM_VIEW`, `CURRICULUM_MANAGE`

- **Test Curriculum Node**: Must exist and belong to STEM tenant before testing
  - Create using `POST /api/tenants/{tenantId}/curriculum` if not present
  - Example: `node_id = 11111111-1111-1111-1111-111111111111`

- **MinIO Storage**: Configured with credentials in `deploy/docker/.env.dev`
  - Bucket: `lms-content`
  - Upload URL TTL: 3600 seconds (default)

---

## Test Cases

### TC-3.2.1: Create Content (Video Type) with Presigned URL

**Objective**: Verify system creates VIDEO content and returns valid presigned PUT URL

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | GET `/api/identity/auth/login` with `stem_admin` / `Admin@123` | Returns `{ accessToken, refreshToken }` | ✅ |
| 2 | Extract `accessToken` and `tenant_id` from JWT | JWT contains `tenant_id: 00000000-0000-0000-0000-000000000002` | ✅ |
| 3 | POST `/api/tenants/{tenantId}/contents` with:<br/>```json<br/>{<br/>  "curriculumNodeId": "11111111-1111-1111-1111-111111111111",<br/>  "type": "VIDEO",<br/>  "title": "Video Bài giảng 1: Tổng quan Python",<br/>  "description": "Giới thiệu ngôn ngữ Python cơ bản",<br/>  "fileName": "python_intro_01.mp4",<br/>  "sourceUrl": null,<br/>  "watermarkEnabled": true,<br/>  "isDownloadable": false,<br/>  "visibilityFrom": null,<br/>  "visibilityTo": null<br/>}<br/>``` | Returns 201 Created:<br/>```json<br/>{<br/>  "contentId": "<uuid>",<br/>  "uploadUrl": "https://media.daihoc.io.vn/...",<br/>  "objectKey": "tenants/00000000-0000-0000-0000-000000000002/contents/<uuid>/python_intro_01.mp4",<br/>  "uploadExpiresAt": "2026-05-02T16:00:00Z"<br/>}<br/>``` | ✅ |
| 4 | Verify `uploadUrl`:<br/>- Contains presigned signature<br/>- Is valid HTTPS URL<br/>- TTL ≥ 3599 seconds | Presigned URL valid and parseable | ✅ |
| 5 | Store response for later tests (contentId, objectKey) | Values extracted successfully | ✅ |

**Assertions**:
- ✅ Status code: 201
- ✅ Response has `uploadUrl` (non-empty string, HTTPS)
- ✅ Response has `objectKey` matching pattern `tenants/{tenantId}/contents/{contentId}/*`
- ✅ Response has `uploadExpiresAt` in ISO 8601 format
- ✅ Content DB record exists with `publish_status = DRAFT`

---

### TC-3.2.2: Create Content (PDF Type)

**Objective**: Verify PDF content creation with upload URL generation

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST `/api/tenants/{tenantId}/contents` with:<br/>```json<br/>{<br/>  "curriculumNodeId": "11111111-1111-1111-1111-111111111111",<br/>  "type": "PDF",<br/>  "title": "Slide Bài giảng 1",<br/>  "description": "Tóm tắt kiến thức",<br/>  "fileName": "lecture_01.pdf",<br/>  "watermarkEnabled": true,<br/>  "isDownloadable": true<br/>}<br/>``` | Returns 201 with uploadUrl | ✅ |
| 2 | Verify response fields | All fields present and valid | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Returns ContentItemDto with:<br/>- `publishStatus = "DRAFT"`<br/>- `watermarkEnabled = true`<br/>- `isDownloadable = true`<br/>- `type = "PDF"`<br/>- `filePath = null` (not yet uploaded) | ✅ |

**Assertions**:
- ✅ Status code: 201
- ✅ Content type is correctly normalized to uppercase
- ✅ Watermark/download flags saved
- ✅ DB record shows DRAFT status

---

### TC-3.2.3: Create Content (URL Type) - No Upload URL

**Objective**: Verify URL content skips presigned URL generation (no file upload needed)

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST `/api/tenants/{tenantId}/contents` with:<br/>```json<br/>{<br/>  "curriculumNodeId": "11111111-1111-1111-1111-111111111111",<br/>  "type": "URL",<br/>  "title": "Link Bài giảng YouTube",<br/>  "sourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",<br/>  "fileName": null,<br/>  "watermarkEnabled": false,<br/>  "isDownloadable": false<br/>}<br/>``` | Returns 201 with:<br/>- `contentId` ≠ null<br/>- `uploadUrl` = null<br/>- `objectKey` = null<br/>- `uploadExpiresAt` = null | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Returns content with:<br/>- `sourceUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`<br/>- `filePath = null` | ✅ |

**Assertions**:
- ✅ URL type content created without upload URL
- ✅ Source URL is preserved in DB
- ✅ No file_path field populated

---

### TC-3.2.4: Validate - Create Content with Invalid Type

**Objective**: Verify system rejects invalid content types

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST `/api/tenants/{tenantId}/contents` with:<br/>`"type": "INVALID_TYPE"` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "Invalid content type 'INVALID_TYPE'. Must be one of: VIDEO, PDF, SLIDE, WORD, URL."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Status code: 400
- ✅ Error message lists valid types
- ✅ No content record created

---

### TC-3.2.5: Validate - Create Content Without File for Non-URL Type

**Objective**: Verify system rejects non-URL content without fileName

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST `/api/tenants/{tenantId}/contents` with:<br/>`"type": "VIDEO"`<br/>`"fileName": null` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "File name is required for non-URL content types."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Status code: 400
- ✅ Proper validation error
- ✅ No content created

---

### TC-3.2.6: Validate - Create Content with URL Type Without SourceUrl

**Objective**: Verify system rejects URL content without source URL

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST `/api/tenants/{tenantId}/contents` with:<br/>`"type": "URL"`<br/>`"sourceUrl": null` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "Source URL is required for content type URL."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Status code: 400
- ✅ Clear validation message
- ✅ No content created

---

### TC-3.2.7: List Contents - Pagination

**Objective**: Verify content list returns paginated results

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create 5 different content items (mix of types) | All created successfully | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents?page=1&pageSize=2` | Returns:<br/>```json<br/>{<br/>  "items": [ /* 2 items */ ],<br/>  "totalCount": 5,<br/>  "page": 1,<br/>  "pageSize": 2<br/>}<br/>``` | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents?page=2&pageSize=2` | Returns items 3-4 (2 items) | ✅ |
| 4 | GET `/api/tenants/{tenantId}/contents?page=3&pageSize=2` | Returns item 5 (1 item) | ✅ |

**Assertions**:
- ✅ Pagination metadata correct
- ✅ Items count matches pageSize except last page
- ✅ totalCount = 5

---

### TC-3.2.8: List Contents - Filter by Type

**Objective**: Verify content filtering by type works

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | GET `/api/tenants/{tenantId}/contents?type=VIDEO&pageSize=100` | Returns only VIDEO type contents | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents?type=PDF&pageSize=100` | Returns only PDF type contents | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents?type=url&pageSize=100` | Returns only URL type contents (case-insensitive) | ✅ |

**Assertions**:
- ✅ Filter is case-insensitive
- ✅ All returned items match filter type
- ✅ Empty results if no matches

---

### TC-3.2.9: List Contents - Filter by Status

**Objective**: Verify content filtering by publish status

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | GET `/api/tenants/{tenantId}/contents?status=DRAFT` | Returns only DRAFT contents | ✅ |
| 2 | Publish one content (PATCH /status to PUBLISHED) | Status changed to PUBLISHED | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents?status=PUBLISHED` | Returns only PUBLISHED contents | ✅ |

**Assertions**:
- ✅ Status filter case-insensitive
- ✅ Published content excluded from DRAFT filter

---

### TC-3.2.10: List Contents - Search by Title/Description

**Objective**: Verify full-text search functionality

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content with:<br/>- Title: "Giới thiệu Python"<br/>- Description: "Hướng dẫn cơ bản" | Created | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents?search=Python` | Returns content with "Python" in title or description | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents?search=huong%20dan` (URL-encoded: "huong dan") | Returns content matching description | ✅ |
| 4 | GET `/api/tenants/{tenantId}/contents?search=nonexistent` | Returns empty results | ✅ |

**Assertions**:
- ✅ Search is case-insensitive
- ✅ Matches both title and description
- ✅ URL encoding handled properly

---

### TC-3.2.11: List Contents - Filter by Curriculum Node

**Objective**: Verify filtering by curriculum node ID

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create 3 contents in node A, 2 contents in node B | All created | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents?nodeId=<nodeA_id>` | Returns 3 contents | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents?nodeId=<nodeB_id>` | Returns 2 contents | ✅ |

**Assertions**:
- ✅ Node filter correctly isolates contents
- ✅ Total count across all nodes correct

---

### TC-3.2.12: Get Content Detail

**Objective**: Verify retrieving single content with all metadata

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST create content with full metadata | Created with contentId | ✅ |
| 2 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Returns ContentItemDto with all fields:<br/>- id, tenantId, curriculumNodeId<br/>- type, title, description<br/>- fileName, filePath, sourceUrl<br/>- mimeType, fileSizeBytes<br/>- publishStatus, watermarkEnabled, isDownloadable<br/>- visibilityFrom, visibilityTo<br/>- signedUrlTtl, createdAt, updatedAt | ✅ |

**Assertions**:
- ✅ All fields present
- ✅ Timestamps in ISO 8601
- ✅ Enums are text (not numeric)

---

### TC-3.2.13: Confirm Upload - Update File Metadata

**Objective**: Verify file upload confirmation and metadata update

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create VIDEO content (returns uploadUrl, objectKey) | Created | ✅ |
| 2 | POST `/api/tenants/{tenantId}/contents/{contentId}/upload` with:<br/>```json<br/>{<br/>  "fileName": "python_intro_01.mp4",<br/>  "objectKey": "tenants/00000000-0000-0000-0000-000000000002/contents/<contentId>/python_intro_01.mp4",<br/>  "mimeType": "video/mp4",<br/>  "fileSizeBytes": 1572864000<br/>}<br/>``` | Returns 200 with updated ContentItemDto:<br/>- `filePath = objectKey`<br/>- `mimeType = "video/mp4"`<br/>- `fileSizeBytes = 1572864000` | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Content now has file metadata populated | ✅ |

**Assertions**:
- ✅ File path set to objectKey
- ✅ MIME type and size recorded
- ✅ Content still in DRAFT (unless explicitly published)

---

### TC-3.2.14: Update Content Metadata

**Objective**: Verify updating content title, description, and policies

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content with initial metadata | Created | ✅ |
| 2 | PUT `/api/tenants/{tenantId}/contents/{contentId}` with:<br/>```json<br/>{<br/>  "curriculumNodeId": "11111111-1111-1111-1111-111111111111",<br/>  "title": "Updated Title",<br/>  "description": "Updated description",<br/>  "sourceUrl": "https://example.com",<br/>  "watermarkEnabled": false,<br/>  "isDownloadable": true,<br/>  "visibilityFrom": "2026-05-03T00:00:00Z",<br/>  "visibilityTo": "2026-05-10T23:59:59Z"<br/>}<br/>``` | Returns 200 with updated fields:<br/>- title = "Updated Title"<br/>- description = "Updated description"<br/>- watermarkEnabled = false<br/>- isDownloadable = true<br/>- visibilityFrom/visibilityTo set | ✅ |

**Assertions**:
- ✅ All fields updated
- ✅ Timestamps preserved in DB
- ✅ Can move to different curriculum node

---

### TC-3.2.15: Publish Content

**Objective**: Verify publishing content from DRAFT to PUBLISHED

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content (defaults to DRAFT) | Created with `publishStatus = "DRAFT"` | ✅ |
| 2 | PATCH `/api/tenants/{tenantId}/contents/{contentId}/status` with:<br/>```json<br/>{<br/>  "publishStatus": "PUBLISHED"<br/>}<br/>``` | Returns 200 with `publishStatus = "PUBLISHED"` | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Status is PUBLISHED | ✅ |

**Assertions**:
- ✅ Status transition successful
- ✅ Updated timestamp changed

---

### TC-3.2.16: Archive Content

**Objective**: Verify archiving published content

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create and publish content | Status = PUBLISHED | ✅ |
| 2 | PATCH `/api/tenants/{tenantId}/contents/{contentId}/status` with:<br/>`"publishStatus": "ARCHIVED"` | Returns 200 with `publishStatus = "ARCHIVED"` | ✅ |

**Assertions**:
- ✅ Can transition from PUBLISHED to ARCHIVED
- ✅ Status correctly stored

---

### TC-3.2.17: Validate - Invalid Status Transition

**Objective**: Verify system rejects invalid status values

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | PATCH `/api/tenants/{tenantId}/contents/{contentId}/status` with:<br/>`"publishStatus": "INVALID_STATUS"` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "Invalid status 'INVALID_STATUS'. Must be DRAFT, PUBLISHED, or ARCHIVED."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Status code: 400
- ✅ Clear error message with valid options

---

### TC-3.2.18: Delete Content

**Objective**: Verify soft-delete of content

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content (get contentId) | Created | ✅ |
| 2 | DELETE `/api/tenants/{tenantId}/contents/{contentId}` | Returns 204 No Content | ✅ |
| 3 | GET `/api/tenants/{tenantId}/contents/{contentId}` | Returns 404 Not Found | ✅ |
| 4 | GET `/api/tenants/{tenantId}/contents?pageSize=100` | Deleted content not in list | ✅ |
| 5 | Query DB directly: SELECT * FROM content_item WHERE id = contentId | `is_deleted = true` | ✅ |

**Assertions**:
- ✅ Soft delete (is_deleted = TRUE)
- ✅ Content hidden from API
- ✅ DB record preserved

---

### TC-3.2.19: Tenant Isolation - Cannot Access Other Tenant Content

**Objective**: Verify tenant boundary enforcement

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content in STEM tenant (ID: 00000000-0000-0000-0000-000000000002) | Created | ✅ |
| 2 | GET token for different tenant (if available) | Token obtained for tenant B | ✅ |
| 3 | Try to GET `/api/tenants/00000000-0000-0000-0000-000000000002/contents/{contentId}` with tenant B token | Returns 403 Forbidden | ✅ |
| 4 | Try to DELETE content from other tenant | Returns 403 Forbidden | ✅ |

**Assertions**:
- ✅ Cross-tenant access denied
- ✅ Error response code: 403

---

### TC-3.2.20: Authorization - CURRICULUM_MANAGE Permission Required

**Objective**: Verify POST/PUT/DELETE require proper permission

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Get token for user with only CURRICULUM_VIEW permission | Token obtained | ✅ |
| 2 | Try POST `/api/tenants/{tenantId}/contents` | Returns 403 Forbidden | ✅ |
| 3 | Try PUT (update) | Returns 403 Forbidden | ✅ |
| 4 | Try DELETE | Returns 403 Forbidden | ✅ |
| 5 | Try GET (list/detail) | Returns 200 OK (READ allowed) | ✅ |

**Assertions**:
- ✅ Write operations require CURRICULUM_MANAGE
- ✅ Read operations require only CURRICULUM_VIEW

---

### TC-3.2.21: Verify Content Node Exists in Tenant

**Objective**: Verify system validates curriculum node ownership

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST create content with:<br/>`"curriculumNodeId": "<non-existent-id>"` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "Curriculum node not found."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Node validation enforced
- ✅ Prevents orphaned content

---

### TC-3.2.22: JSON Input Validation - Invalid GUID Format

**Objective**: Verify friendly error message for malformed UUID in request body

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | POST with malformed contentId in body:<br/>```json<br/>{<br/>  "curriculumNodeId": "not-a-guid",<br/>  ...<br/>}<br/>``` | Returns 400 BadRequest:<br/>```json<br/>{<br/>  "error": "Field 'curriculumNodeId' must be a valid UUID (e.g. '3fa85f64-5717-4562-b3fc-2c963f66afa6')."<br/>}<br/>``` | ✅ |

**Assertions**:
- ✅ Friendly error message
- ✅ Example UUID provided
- ✅ Field name identified

---

### TC-3.2.23: Content with Scheduling - Drip Content

**Objective**: Verify visibility scheduling for drip content

**Test Steps**

| # | Step | Expected Result | Status |
|---|---|---|---|
| 1 | Create content with:<br/>```json<br/>{<br/>  "visibilityFrom": "2026-05-05T08:00:00Z",<br/>  "visibilityTo": "2026-05-12T17:00:00Z"<br/>}<br/>``` | Content created with visibility window | ✅ |
| 2 | GET detail | Returns with visibility timestamps | ✅ |
| 3 | UPDATE visibility dates | New dates saved | ✅ |

**Assertions**:
- ✅ Timestamps stored as TIMESTAMPTZ
- ✅ Scheduling metadata persisted

---

## Test Data Cleanup

After all tests complete, execute:

```bash
# Option 1: Delete all test content (soft delete)
DELETE FROM content_item
WHERE tenant_id = '00000000-0000-0000-0000-000000000002'
  AND title LIKE '%Test%' OR title LIKE '%Bài giảng%'
  AND is_deleted = FALSE;

# Option 2: Reset entire content table
TRUNCATE TABLE content_item CASCADE;
TRUNCATE TABLE schema_migrations CASCADE;  -- Re-apply migrations if needed
```

---

## Success Criteria

- ✅ All 23 test cases pass
- ✅ No data leaks between tenants
- ✅ Authorization properly enforced
- ✅ Error messages are friendly and actionable
- ✅ Pagination works correctly
- ✅ Filtering and search functional
- ✅ File metadata persisted correctly
- ✅ Soft delete working as intended
