# System Test Cases — Task 2.6 & 2.7
## User-Tenant Management (Auto-inherit + Override) & Users by School

**Module:** Users  
**Branch:** `feat/correct_flow_contract_user_tenant`  
**Date:** 2026-04-25  
**Prerequisites:**
- Seed data applied (V1–V5 migrations)
- School `SCH001` has active contracts: STEM (tenant `00000000-0000-0000-0000-000000000002`) and ENGLISH (tenant `00000000-0000-0000-0000-000000000003`)
- LMS_ADMIN JWT token available (`superadmin` / `Admin@123`)

---

## AC 2.6.1 — Auto-inherit tenants on user creation

### TC-2.6-01: Create school TEACHER — tenants auto-inherited
**Endpoint:** `POST /api/admin/users`  
**Auth:** LMS_ADMIN token

**Request:**
```json
{
  "schoolId": "00000000-0000-0001-0000-000000000001",
  "username": "teacher.autotest",
  "password": "Test@1234",
  "fullName": "Auto Inherit Teacher",
  "email": "autotest@school.edu",
  "accountType": "TEACHER"
}
```

**Expected:**
- `201 Created` (or `200 OK`) with `userId` in response
- `GET /api/admin/users/{userId}/tenants` returns **2 entries**: STEM and ENGLISH
- Both entries have `isInherited: true`
- Both entries have `roleCode: "TEACHER"`

---

### TC-2.6-02: Create SCHOOL_ADMIN — inherits with SCHOOL_ADMIN role code
**Endpoint:** `POST /api/admin/users`

**Request:** Same as TC-2.6-01 but `"accountType": "SCHOOL_ADMIN"`

**Expected:**
- `GET /api/admin/users/{userId}/tenants` returns 2 entries with `roleCode: "SCHOOL_ADMIN"`
- Both `isInherited: true`

---

### TC-2.6-03: Create LMS_ADMIN (no school) — no auto-inherit
**Request:**
```json
{
  "username": "lmsadmin.test",
  "password": "Test@1234",
  "fullName": "LMS Admin Test",
  "accountType": "LMS_ADMIN"
}
```

**Expected:**
- `GET /api/admin/users/{userId}/tenants` returns **empty array** `[]`

---

### TC-2.6-04: Create school user without accountType — no auto-inherit
**Request:** Same structure but omit `"accountType"` field (or pass `null`)

**Expected:**
- User created successfully
- `GET /api/admin/users/{userId}/tenants` returns **empty array** `[]`

---

## AC 2.6.2 — GET /api/admin/users/{userId}/tenants

### TC-2.6-05: List tenants for user with mixed inherited + manual assignments
**Setup:** User has 1 inherited tenant (from TC-2.6-01) + 1 manually assigned

**Endpoint:** `GET /api/admin/users/{userId}/tenants`

**Expected response:**
```json
[
  { "tenantCode": "STEM",    "roleCode": "TEACHER", "isInherited": true },
  { "tenantCode": "ENGLISH", "roleCode": "TEACHER", "isInherited": true },
  { "tenantCode": "KNS",     "roleCode": "SCHOOL_ADMIN", "isInherited": false }
]
```

---

### TC-2.6-06: Get tenants for non-existent user — returns empty list (not 404)
**Endpoint:** `GET /api/admin/users/{randomGuid}/tenants`

**Expected:** `200 OK` with `[]`

---

## AC 2.6.3 — POST /api/admin/users/{userId}/tenants (manual assign)

### TC-2.6-07: Manually assign user to a new tenant
**Endpoint:** `POST /api/admin/users/{userId}/tenants`  
**Request:**
```json
{ "tenantId": "00000000-0000-0000-0000-000000000002", "roleCode": "SCHOOL_ADMIN" }
```

**Expected:**
- `200 OK`
- Subsequent `GET /api/admin/users/{userId}/tenants` includes new entry with `isInherited: false`

---

### TC-2.6-08: Assign already-assigned tenant+role — returns 409 Conflict
**Setup:** User already has STEM/TEACHER assignment

**Request:**
```json
{ "tenantId": "00000000-0000-0000-0000-000000000002", "roleCode": "TEACHER" }
```

**Expected:** `409 Conflict` — "Tenant already assigned with this role."

---

### TC-2.6-09: Assign same tenant with different role — succeeds (not a duplicate)
**Request:**
```json
{ "tenantId": "00000000-0000-0000-0000-000000000002", "roleCode": "SCHOOL_ADMIN" }
```
*(User already has TEACHER in STEM but NOT SCHOOL_ADMIN)*

**Expected:** `200 OK` — two distinct rows for same tenant, different roles

---

### TC-2.6-10: Assign with unknown roleCode — returns 409 or silent no-op
**Request:**
```json
{ "tenantId": "00000000-0000-0000-0000-000000000002", "roleCode": "DOES_NOT_EXIST" }
```

**Expected:** `409 Conflict` (repository returns 0 rows → handler returns false)

---

## AC 2.6.4 — DELETE /api/admin/users/{userId}/tenants/{tenantId}

### TC-2.6-11: Revoke all assignments for a tenant (inherited and manual)
**Endpoint:** `DELETE /api/admin/users/{userId}/tenants/{tenantId}`

**Expected:**
- `204 No Content`
- Subsequent `GET` no longer shows that tenant

---

### TC-2.6-12: Revoke tenant not assigned — returns 404
**Endpoint:** `DELETE /api/admin/users/{userId}/tenants/{randomTenantId}`

**Expected:** `404 Not Found`

---

### TC-2.6-13: Inherited assignment can be revoked by admin
**Setup:** User has `isInherited: true` assignment for STEM

**Expected:** `204 No Content` — inherited flag does not prevent revocation

---

## AC 2.7.1 — GET /api/admin/schools/{schoolId}/users

### TC-2.7-01: List all users for a school
**Endpoint:** `GET /api/admin/schools/00000000-0001-0000-0000-000000000001/users?page=1&pageSize=20`

**Expected:**
```json
{
  "items": [ /* list of users with home_school_id = schoolId */ ],
  "totalCount": <N>,
  "page": 1,
  "pageSize": 20
}
```
- All returned users have `schoolId` matching the queried school
- LMS_ADMIN global users (no schoolId) are NOT in this list

---

### TC-2.7-02: Filter by status=LOCKED
**Endpoint:** `GET /api/admin/schools/{schoolId}/users?status=LOCKED&page=1&pageSize=20`

**Expected:** Only users with `status == "LOCKED"` returned

---

### TC-2.7-03: Filter by accountType=TEACHER
**Endpoint:** `GET /api/admin/schools/{schoolId}/users?accountType=TEACHER&page=1&pageSize=20`

**Expected:** Only TEACHER accounts returned for that school

---

### TC-2.7-04: Full-text search by name
**Endpoint:** `GET /api/admin/schools/{schoolId}/users?search=Nguy%E1%BB%85n&page=1&pageSize=20`

**Expected:** Only users whose `full_name`, `username`, or `email` contains "Nguyễn"

---

### TC-2.7-05: School with no users returns empty paginated result
**Endpoint:** `GET /api/admin/schools/{emptySchoolId}/users?page=1&pageSize=20`

**Expected:**
```json
{ "items": [], "totalCount": 0, "page": 1, "pageSize": 20 }
```

---

### TC-2.7-06: Pagination — page 2 returns correct offset
**Setup:** School has 25 users

**Endpoint:** `GET /api/admin/schools/{schoolId}/users?page=2&pageSize=10`

**Expected:**
- `totalCount: 25`
- `items` contains users 11–20 (ordered by `full_name`)

---

### TC-2.7-07: pageSize clamped to 100 max
**Endpoint:** `GET /api/admin/schools/{schoolId}/users?page=1&pageSize=500`

**Expected:** Responds as if `pageSize=100`

---

### TC-2.7-08: Unauthorized access — returns 401
**Endpoint:** `GET /api/admin/schools/{schoolId}/users` (no token)

**Expected:** `401 Unauthorized`

---

## Audit Log Verification

After TC-2.6-07 (manual assign) and TC-2.6-11 (revoke), verify in audit_log:

| action | entity_type | entity_id |
|---|---|---|
| `USER_TENANT_ASSIGNED` | `user_tenant_role_assignment` | `{userId}` |
| `USER_TENANT_REMOVED`  | `user_tenant_role_assignment` | `{userId}` |

```sql
SELECT action, entity_type, entity_id, created_at
FROM audit_log
WHERE entity_id = '{userId}'
  AND action IN ('USER_TENANT_ASSIGNED', 'USER_TENANT_REMOVED')
ORDER BY created_at DESC;
```
