---
trigger: always_on
---

# LMS_HKDN: API & Communication Standards

## 1. API Source of Truth (Contract First)
- **OpenAPI Spec**: The official API contract is defined in:
  - JSON: `docs/apis/v1.json`
  - YAML: `docs/apis/v1.yaml`
- **Strict Adherence**: Every Controller, Request/Response DTO, and Client Hook MUST strictly follow the paths, methods, and schemas defined in these specs.

## 2. RESTful Design
- Use proper HTTP Verbs: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Versioning: All API paths are prefixed with `/api/` (Note: internal versioning is managed via file version, not URL prefix as per latest architecture).
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
