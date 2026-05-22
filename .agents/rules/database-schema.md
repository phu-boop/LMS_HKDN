# LMS_HKDN: Database Schema Design Standards

## 1. Base Requirements
- Every table must have a `UUID` as Primary Key (stored as `binary(16)` or `uuid` type).
- **Audit Fields**: Every business entity must have:
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
  - `created_by` (uuid/string)
  - `updated_by` (uuid/string)
- **Multi-Tenancy**: Every tenant-scoped table MUST have `tenant_id`.

## 2. Soft Delete
- Use a `deleted_at` (timestamp) column instead of a boolean `is_deleted`.
- Filter all `SELECT` queries to exclude deleted records by default (use `@SQLRestriction` or Hibernate filters).

## 3. Relationships & Indexes
- Enforce Foreign Key constraints.
- Create indexes on `tenant_id` and all columns used in common filters.
- Use `UNIQUE` constraints across `[business_key, tenant_id]` to prevent cross-tenant collisions.

## 4. Data Types
- Use `JSONB` for flexible/dynamic metadata fields.
- Use `DECIMAL(19,4)` for monetary values.
- Use `TEXT` for long descriptions instead of `VARCHAR(255)`.
