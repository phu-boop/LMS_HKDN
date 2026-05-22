# LMS_HKDN: Multi-tenant Safety Policies

These policies are NON-NEGOTIABLE. Failure to comply is a critical security risk.

## 1. Data Isolation
- **Rule 1.1**: Every database query affecting tenant data must be filtered by `tenant_id`.
- **Rule 1.2**: Use the automated Hibernate `@Filter` mechanism via `TenantAspect`.
- **Rule 1.3**: When performing manual SQL or native queries, the `tenant_id` must be explicitly included in the WHERE clause.

## 2. Context Propagation
- **Rule 2.1**: The `tenantId` must be resolved early in the request lifecycle (via `TenantResolutionFilter`).
- **Rule 2.2**: Use `TenantContextHolder` to access the current tenant.
- **Rule 2.3**: For background tasks or async threads, ensure the `TenantContext` is properly propagated or manually set.

## 3. Tenant-Specific Configuration
- **Rule 3.1**: Tenant-specific settings (like watermarking, themes) must be fetched from the `tenant` table or a dedicated configuration service.
- **Rule 3.2**: Fallback to default (global) settings if tenant-specific settings are not found.

## 4. Cross-Tenant Operations
- **Rule 4.1**: Cross-tenant data operations (e.g., sharing content between schools) must go through a formal ACL-based "Sharing" service.
- **Rule 4.2**: Direct database joins across different `tenant_id` values are prohibited unless explicitly part of a global reporting/admin feature.

## 5. Testing Requirements
- Every new feature must be tested for cross-tenant leakage:
  - User A from Tenant 1 must NOT be able to see Data B from Tenant 2, even if they have the ID.
  - API responses must return 404 or 403 when accessing data outside the current tenant context.
