# LMS_HKDN: Database Migration Policies (Flyway)

## 1. Migration Standards
- **Tool**: Flyway.
- **Location**: `backend/src/main/resources/db/migration/`.
- **Naming**: `V[Timestamp]__[Description].sql` (e.g., `V202405221000__create_user_table.sql`).
- **Immutability**: Once a migration file is committed and deployed, NEVER change it. Create a new "fix" migration if needed.

## 2. Schema Requirements
- **Primary Keys**: Always `UUID` using `gen_random_uuid()`.
- **Soft Delete**: Every table must have `is_deleted BOOLEAN DEFAULT FALSE`.
- **Audit Columns**: `created_at`, `created_by`, `updated_at`, `updated_by` are mandatory.
- **Constraints**: Use explicit names for constraints (Foreign Keys, Indexes, Unique).

## 3. Data Integrity
- Use `JSONB` for unstructured metadata.
- Ensure all foreign keys have appropriate `ON DELETE` actions (usually `SET NULL` or `RESTRICT` due to soft-delete).
- Avoid `SELECT *` in migration scripts; be explicit with column names.

## 4. Multi-Tenant Constraints
- Every tenant-specific table MUST have a `tenant_id` column.
- Composite indexes involving `tenant_id` should be evaluated for performance on large tables.
