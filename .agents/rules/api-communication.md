---
trigger: always_on
---

# LMS_HKDN: API & Communication Standards

## 1. RESTful Design
- Use proper HTTP Verbs: `GET` (read), `POST` (create), `PUT` (update), `PATCH` (partial update), `DELETE` (remove).
- Versioning: Prefix all API paths with `/api/`.
- Plural Resources: `/api/courses`, not `/api/course`.

## 2. DTO & Request Mapping
- Never expose Entities directly. Always use DTOs (Data Transfer Objects).
- **Backend**: Use Java Records for immutable DTOs.
- **Frontend**: Define TypeScript `interface` or `type` for every API response.

## 3. Frontend Data Fetching
- **Client**: Use `TanStack Query` (React Query) for server state management.
- **Axios Instance**: Use a pre-configured axios instance with:
  - Base URL from environment variables.
  - Automatic injection of `X-Tenant-ID` header.
  - Automatic injection of `Authorization: Bearer [token]` header.
  - Global interceptors for 401 (token refresh) and 403 (unauthorized).

## 4. Response Structure
- Success: `200 OK` or `201 Created`.
- Empty Success: `204 No Content`.
- Error: Standardized `ApiError` structure (refer to `error-handling.md`).
