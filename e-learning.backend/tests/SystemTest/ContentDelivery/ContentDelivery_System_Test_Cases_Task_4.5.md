# System Test Cases: Task 4.5 - Dynamic Watermark

**Module:** Viewer / ContentDelivery / Tenancy / Authorization  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional + Security + Regression  
**Attachments:** [None]  
**Id:** ST-CLIENT-4.5

## Muc dich tai lieu

Tai lieu nay duoc viet de ban co the tu chay system test task 4.5 ngay ca khi chua quen workflow test cua du an.

Task 4.5 co 2 phan can tach ro:

1. **Backend API**: `GET /api/client/contents/{contentId}/watermark-config` tra ve cau hinh watermark da resolve theo tenant + user + content.
2. **Frontend / Viewer overlay**: trinh xem video/document thuc su render watermark tren man hinh va khong de user tat bang thao tac thong thuong.

Repo backend hien tai verify truc tiep duoc phan **API**.  
Phan **overlay frontend** can manual check tren browser neu da co client tich hop endpoint nay.

---

## Scope

- Task 4.5 - Dynamic Watermark
- API pham vi kiem thu:
  - `GET /api/client/contents/{contentId}/watermark-config`
- Muc tieu verify:
  - Chi content hop le, co quyen view, dang visible moi lay duoc config watermark.
  - Payload tra ve co du thong tin dong: company, account, time, template, opacity, fontSize, color, position.
  - Content tat watermark thi response phai cho biet `enabled = false`.
  - Truong hop khong quyen / content khong visible / content khong ton tai phai tra status dung.
  - Neu tenant config watermark JSON loi hoac khong co config, backend van phai tra fallback an toan.

---

## Acceptance Criteria Index

- **AC-4.5-01:** Watermark dong overlay tren video va document khi xem
- **AC-4.5-02:** Noi dung watermark: ten cong ty / ten tai khoan / thoi gian hien tai
- **AC-4.5-03:** User khong the tat watermark bang thao tac thong thuong
- **AC-4.5-04:** Chi ap dung voi noi dung da bat policy watermark

## Coverage Matrix (Traceability)

| Test Case ID | Test Case Name | Acceptance Criteria Covered |
| :--- | :--- | :--- |
| TC-4.5-01 | Lay watermark-config cho PDF co watermark | AC-4.5-01, AC-4.5-02 |
| TC-4.5-02 | Lay watermark-config cho VIDEO co watermark | AC-4.5-01, AC-4.5-02 |
| TC-4.5-03 | Content tat watermark tra `enabled = false` | AC-4.5-04 |
| TC-4.5-04 | Khong co quyen view thi watermark-config bi 403 | AC-4.5-01, AC-4.5-04 |
| TC-4.5-05 | Content DRAFT hoac ngoai visibility bi 404 | AC-4.5-04 |
| TC-4.5-06 | Content khong ton tai bi 404 | AC-4.5-04 |
| TC-4.5-07 | Tenant watermark JSON khong hop le van fallback duoc | AC-4.5-02 |
| TC-4.5-08 | Viewer UI render overlay va cap nhat thoi gian | AC-4.5-01, AC-4.5-02 |
| TC-4.5-09 | User khong tat duoc watermark bang thao tac thong thuong | AC-4.5-03 |

## Coverage Summary

- Tong so Acceptance Criteria can cover: **4**
- Tong so Test Case: **9**
- Ket luan coverage: **Da cover API backend day du, co them 2 case manual frontend/browser cho overlay**.

---

## Cach su dung tai lieu nay

Neu ban chua quen system test, chay theo dung thu tu nay:

1. Dang nhap qua API de lay token Admin/TenantAdmin va 2 user test (co quyen + khong quyen).
2. Resolve tenant va dung API admin de cap nhat watermark settings (khong SQL).
3. Chuan bi content scenario qua API CMS (watermark on/off, publish status) va permission API.
4. Chay tung lenh curl theo test case.
5. Ghi ket qua vao template: `tests/SystemTest/Intern_Test_Result_Input_Template.md`.
6. Neu co frontend viewer, mo browser de chay them `TC-4.5-08` va `TC-4.5-09`.

---

## Test Data & Preconditions

- **AppURL:** `http://localhost:5294`
- API backend da chay thanh cong.
- Da apply migration moi nhat.
- Co it nhat 1 tenant active.
- Co 1 account co quyen admin tenant (hoac LMS admin) de setup test data qua API.
- Co 2 account viewer:
  - `teacherA`: co quyen `CanView` tren node test.
  - `teacherB`: khong co quyen `CanView` tren node test.
- Co it nhat 2 content trong tenant:
  - 1 content document (PDF/SLIDE/WORD)
  - 1 content video

Luu y: khong can UUID co dinh, co the lay ID runtime qua API list.

---

## Quick Start

```bash
BASE_URL="http://localhost:5294"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="PASTE_PASSWORD"
TEACHER_A_USERNAME="teacher.a"
TEACHER_A_PASSWORD="PASTE_PASSWORD"
TEACHER_B_USERNAME="teacher.b"
TEACHER_B_PASSWORD="PASTE_PASSWORD"
TENANT_DOMAIN="school-a.localhost"
```

### 1) Login lay token (API-first)

```bash
TOKEN_ADMIN=$(curl -sS "$BASE_URL/api/identity/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\",\"domain\":\"$TENANT_DOMAIN\"}" | jq -r '.accessToken')

TOKEN_TEACHER_A=$(curl -sS "$BASE_URL/api/identity/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEACHER_A_USERNAME\",\"password\":\"$TEACHER_A_PASSWORD\",\"domain\":\"$TENANT_DOMAIN\"}" | jq -r '.accessToken')

TOKEN_TEACHER_B=$(curl -sS "$BASE_URL/api/identity/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEACHER_B_USERNAME\",\"password\":\"$TEACHER_B_PASSWORD\",\"domain\":\"$TENANT_DOMAIN\"}" | jq -r '.accessToken')
```

### 2) Resolve tenant va lay `TENANT_ID`

```bash
TENANT_ID=$(curl -sS "$BASE_URL/api/tenants/resolve?domain=$TENANT_DOMAIN" | jq -r '.tenantId')
```

### 3) Cap nhat watermark settings cua tenant qua API (khong SQL)

Do endpoint update tenant dang la PUT full object, can lay tenant detail truoc roi PUT lai voi `watermarkSettings` moi.

```bash
TENANT_JSON=$(curl -sS "$BASE_URL/api/admin/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN")

curl -sS -X PUT "$BASE_URL/api/admin/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
      --arg name "$(echo "$TENANT_JSON" | jq -r '.name')" \
      --arg code "$(echo "$TENANT_JSON" | jq -r '.code')" \
      --arg subdomain "$(echo "$TENANT_JSON" | jq -r '.subdomain')" \
      --arg logoUrl "$(echo "$TENANT_JSON" | jq -r '.logoUrl // empty')" \
      --arg avatarUrl "$(echo "$TENANT_JSON" | jq -r '.avatarUrl // empty')" \
      --arg description "$(echo "$TENANT_JSON" | jq -r '.description // empty')" \
      --arg watermarkSettings '{"watermark":{"enabled":true,"template":"{company} - {username} - {time}","opacity":0.5,"fontSize":16,"color":"#FFFFFF","position":"random","refreshIntervalSeconds":7}}' \
      '{name:$name,code:$code,subdomain:$subdomain,logoUrl:($logoUrl|select(length>0)),avatarUrl:($avatarUrl|select(length>0)),description:($description|select(length>0)),watermarkSettings:$watermarkSettings}')"
```

### 4) Tim content va node test bang API

Lay node user dang co quyen:

```bash
NODE_ID=$(curl -sS "$BASE_URL/api/client/curriculum" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq -r '.[0].id')
```

Lay danh sach content trong node de chon `CONTENT_PDF_ON`, `CONTENT_VIDEO_ON`:

```bash
curl -sS "$BASE_URL/api/client/curriculum/$NODE_ID/contents?page=1&pageSize=100" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

CONTENT_PDF_ON=$(curl -sS "$BASE_URL/api/client/curriculum/$NODE_ID/contents?page=1&pageSize=100" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq -r '.items[] | select(.type=="PDF" and .watermarkEnabled==true) | .id' | head -n 1)

CONTENT_VIDEO_ON=$(curl -sS "$BASE_URL/api/client/curriculum/$NODE_ID/contents?page=1&pageSize=100" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq -r '.items[] | select(.type=="VIDEO" and .watermarkEnabled==true) | .id' | head -n 1)
```

Lay `TEACHER_A_USER_ID` de grant permission (neu can setup moi):

```bash
TEACHER_A_USER_ID=$(curl -sS "$BASE_URL/api/admin/users?search=$TEACHER_A_USERNAME&page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.items[0].id')
```

### 5) Chuan bi scenario bang API CMS/Permission

- Case watermark ON/OFF: dung `PUT /api/tenants/{tenantId}/contents/{contentId}` de set `watermarkEnabled=true|false`.
- Case draft/not visible: dung `PATCH /api/tenants/{tenantId}/contents/{contentId}/status` set `publishStatus=DRAFT` hoac set visibility window qua `PUT`.
- Case 403 permission: dung `POST /api/tenants/{tenantId}/permissions` cap quyen cho `teacherA`, khong cap cho `teacherB`.

Vi du set watermark OFF de test `TC-4.5-03` (goi `PUT` va giu nguyen metadata khac):

```bash
CONTENT_JSON=$(curl -sS "$BASE_URL/api/tenants/$TENANT_ID/contents/$CONTENT_PDF_ON" \
  -H "Authorization: Bearer $TOKEN_ADMIN")

curl -sS -X PUT "$BASE_URL/api/tenants/$TENANT_ID/contents/$CONTENT_PDF_ON" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
      --arg curriculumNodeId "$(echo "$CONTENT_JSON" | jq -r '.curriculumNodeId')" \
      --arg title "$(echo "$CONTENT_JSON" | jq -r '.title')" \
      --arg description "$(echo "$CONTENT_JSON" | jq -r '.description // empty')" \
      --arg sourceUrl "$(echo "$CONTENT_JSON" | jq -r '.sourceUrl // empty')" \
      --argjson isDownloadable "$(echo "$CONTENT_JSON" | jq '.isDownloadable')" \
      --arg visibilityFrom "$(echo "$CONTENT_JSON" | jq -r '.visibilityFrom // empty')" \
      --arg visibilityTo "$(echo "$CONTENT_JSON" | jq -r '.visibilityTo // empty')" \
      '{
        curriculumNodeId:$curriculumNodeId,
        title:$title,
        description:($description|select(length>0)),
        sourceUrl:($sourceUrl|select(length>0)),
        watermarkEnabled:false,
        isDownloadable:$isDownloadable,
        visibilityFrom:($visibilityFrom|select(length>0)),
        visibilityTo:($visibilityTo|select(length>0))
      }')"
```

Vi du grant permission:

```bash
curl -sS -X POST "$BASE_URL/api/tenants/$TENANT_ID/permissions" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculumNodeId":"REPLACE_NODE_ID",
    "userId":"REPLACE_TEACHER_A_USER_ID",
    "schoolId":null,
    "canView":true,
    "canDownload":true,
    "canComment":true
  }' | jq
```

---

## Expected Response Shape

Mau response mong doi:

```json
{
  "contentId": "c1000000-0000-0000-0000-000000000002",
  "enabled": true,
  "companyName": "STEM Academy",
  "accountName": "Teacher A",
  "ipAddress": "127.0.0.1",
  "currentTimeUtc": "2026-05-18T09:30:00Z",
  "template": "{company} - {username} - {time}",
  "opacity": 0.5,
  "fontSize": 16,
  "color": "#FFFFFF",
  "position": "random",
  "refreshIntervalSeconds": 7,
  "renderedText": "STEM Academy - Teacher A - 2026-05-18 09:30:00 UTC"
}
```

Field can note nhanh:

- `enabled`: frontend co nen render watermark hay khong
- `template`: template goc tenant config
- `renderedText`: text da duoc backend resolve voi company/user/time hien tai
- `refreshIntervalSeconds`: frontend co the dung de cap nhat overlay dinh ky

---

## Test Cases

## Test Case: TC-4.5-01 - Lay watermark-config cho PDF co watermark

**Module:** Viewer  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Functional Test  
**Id:** TC-4.5-01  
**AC Covered:** AC-4.5-01, AC-4.5-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/{contentPdfWatermarkOn}/watermark-config` voi `TOKEN_TEACHER_A` | `200 OK` |
| 2 | Kiem tra response body | `enabled = true` |
| 3 | Kiem tra dynamic fields | Co `companyName`, `accountName`, `currentTimeUtc`, `renderedText` |
| 4 | Kiem tra tenant settings | `opacity = 0.5`, `fontSize = 16`, `position = random` |

Curl tham khao:

```bash
curl -sS "$BASE_URL/api/client/contents/$CONTENT_PDF_ON/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq
```

---

## Test Case: TC-4.5-02 - Lay watermark-config cho VIDEO co watermark

**Id:** TC-4.5-02  
**AC Covered:** AC-4.5-01, AC-4.5-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/{contentVideoWatermarkOn}/watermark-config` voi `TOKEN_TEACHER_A` | `200 OK` |
| 2 | Kiem tra response | `enabled = true`, `renderedText` co ten cong ty + ten tai khoan + thoi gian |

---

## Test Case: TC-4.5-03 - Content tat watermark tra `enabled = false`

**Id:** TC-4.5-03  
**AC Covered:** AC-4.5-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/{contentPdfWatermarkOff}/watermark-config` voi `TOKEN_TEACHER_A` | `200 OK` |
| 2 | Kiem tra response | `enabled = false` |
| 3 | Kiem tra payload | Van co metadata khac de frontend xu ly nhat quan |

---

## Test Case: TC-4.5-04 - Khong co quyen view thi watermark-config bi 403

**Id:** TC-4.5-04  
**AC Covered:** AC-4.5-01, AC-4.5-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/{contentPdfWatermarkOn}/watermark-config` voi `TOKEN_TEACHER_B` | `403 Forbidden` |

---

## Test Case: TC-4.5-05 - Content DRAFT hoac ngoai visibility bi 404

**Id:** TC-4.5-05  
**AC Covered:** AC-4.5-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/{contentVideoDraft}/watermark-config` voi `TOKEN_TEACHER_A` | `404 Not Found` |

---

## Test Case: TC-4.5-06 - Content khong ton tai bi 404

**Id:** TC-4.5-06  
**AC Covered:** AC-4.5-04

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `GET /api/client/contents/ffffffff-ffff-ffff-ffff-ffffffffffff/watermark-config` voi `TOKEN_TEACHER_A` | `404 Not Found` |

---

## Test Case: TC-4.5-07 - Tenant watermark JSON khong hop le van fallback duoc

**Id:** TC-4.5-07  
**AC Covered:** AC-4.5-02

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Goi `PUT /api/admin/tenants/{tenantId}` va set `watermarkSettings` la JSON sai shape (vi du `{"abc":123}`) | `200 OK` |
| 2 | Goi `GET /api/client/contents/{contentPdfWatermarkOn}/watermark-config` | `200 OK` |
| 3 | Kiem tra response | Backend tra fallback an toan, vi du `template`, `opacity`, `fontSize`, `position` co gia tri mac dinh |

Goi y verify fallback:

- `template = {company} - {username} - {time}`
- `opacity` la gia tri mac dinh cua backend
- `position = random`

---

## Test Case: TC-4.5-08 - Viewer UI render overlay va cap nhat thoi gian

**Id:** TC-4.5-08  
**AC Covered:** AC-4.5-01, AC-4.5-02

**Loai case nay chi chay khi da co frontend/client tich hop endpoint `watermark-config`.**

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Dang nhap bang user co quyen va mo content PDF hoac VIDEO co watermark | Viewer mo thanh cong |
| 2 | Quan sat vung player/viewer | Co watermark overlay tren noi dung |
| 3 | Cho 1-2 chu ky refresh | Watermark cap nhat thoi gian hoac thay doi vi tri theo config |
| 4 | Kiem tra noi dung overlay | Co ten cong ty + ten tai khoan + thoi gian hien tai |

Evidence can chup:

- Screenshot luc vua mo viewer
- Screenshot sau 1 chu ky refresh

---

## Test Case: TC-4.5-09 - User khong tat duoc watermark bang thao tac thong thuong

**Id:** TC-4.5-09  
**AC Covered:** AC-4.5-03

**Loai case nay la manual browser check. Backend API khong tu minh chung minh duoc AC nay.**

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Mo viewer content co watermark | Watermark dang hien thi |
| 2 | Thu an element bang thao tac UI thong thuong neu co nut setting | Khong co cach tat watermark tu UI thong thuong |
| 3 | Thu full-screen / exit full-screen | Watermark van con |
| 4 | Thu refresh trang | Watermark render lai |

Neu muon test sau hon:

- Thu inspect element va xoa DOM watermark: neu frontend tu render lai theo polling/interval thi danh dau PASS manh hon.
- Neu xoa DOM watermark la mat han, danh dau FAIL hoac PARTIAL tuy team quy uoc.

---

## Quick Curl Collection

```bash
# Case 1: PDF watermark on
curl -sS "$BASE_URL/api/client/contents/$CONTENT_PDF_ON/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

# Case 2: VIDEO watermark on
curl -sS "$BASE_URL/api/client/contents/$CONTENT_VIDEO_ON/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

# Case 3: watermark off
curl -sS "$BASE_URL/api/client/contents/$CONTENT_PDF_OFF/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

# Case 4: no permission
curl -i "$BASE_URL/api/client/contents/$CONTENT_PDF_ON/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_B"

# Case 5: draft / not visible
curl -i "$BASE_URL/api/client/contents/$CONTENT_VIDEO_DRAFT/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A"

# Case 6: download-url + watermark-config cung mot content
curl -sS "$BASE_URL/api/client/contents/$CONTENT_PDF_ON/download-url" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq

curl -sS "$BASE_URL/api/client/contents/$CONTENT_PDF_ON/watermark-config" \
  -H "Authorization: Bearer $TOKEN_TEACHER_A" | jq
```

---

## Postman Guide (neu ban test bang Postman)

1. Tao request `GET {{baseUrl}}/api/client/contents/{{contentId}}/watermark-config`
2. Tab Authorization:
   - Type: Bearer Token
   - Token: `{{tokenTeacherA}}`
3. Tao environment variables:
   - `baseUrl`
   - `tokenTeacherA`
   - `tokenTeacherB`
   - `contentPdfOn`
   - `contentVideoOn`
   - `contentPdfOff`
   - `contentVideoDraft`
4. Chay lan luot tung test case theo bang tren.
5. Copy response vao file ket qua neu can evidence.

---

## Huong dan dien ket qua

Ban co the dung file template:

- `tests/SystemTest/Intern_Test_Result_Input_Template.md`

Goi y dien nhanh:

- `Task ID nho`: `TSK-4.5-API-01`
- `Task cha (System Test)`: `ST-CLIENT-4.5`
- `Moi truong test`: `http://localhost:5294 | feat/dynamic_watermark | local postgres`

Vi du 1 dong log ket qua:

| STT | Test Case ID | Ket qua (PASS/FAIL/BLOCKED) | Request tom tat | Expected | Actual | Evidence link/file | Bug ID (neu co) |
|---|---|---|---|---|---|---|---|
| 1 | TC-4.5-01 | PASS | GET /api/client/contents/c100...002/watermark-config | 200, enabled=true | 200, enabled=true | postman-run-4.5-01.png | |

---

## Ghi chu quan trong

- `TC-4.5-01` den `TC-4.5-07` la **backend API system test**.
- `TC-4.5-08` va `TC-4.5-09` la **frontend/browser manual verification**.
- Neu hien tai chua co frontend viewer consume endpoint moi, danh dau `BLOCKED` cho 2 case frontend la hop le.
- Neu chi test backend trong dot nay, ban van co the bao cao coverage tach 2 nhom:
  - API coverage
  - UI overlay coverage
