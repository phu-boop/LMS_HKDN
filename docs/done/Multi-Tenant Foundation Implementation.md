Multi-Tenant Foundation Implementation Plan
This document details the concrete execution plan to build a robust, secure, and production-ready Multi-Tenant Foundation for the LMS Platform.

Every request arriving at the backend must be associated with a valid Tenant. This plan establishes the infrastructure to extract the tenant, validate it, hold it in context, and automatically isolate database queries.

1. Architectural Blueprint
The flow of tenant resolution and data isolation is structured as follows:

PostgreSQL
Hibernate / JPA (AOP Aspect)
Business Service
TenantContextHolder
TenantRepository
TenantResolutionFilter
PostgreSQL
Hibernate / JPA (AOP Aspect)
Business Service
TenantContextHolder
TenantRepository
TenantResolutionFilter
Extract subdomain or header
AOP Aspect intercepts &
enables tenantFilter(tenantId)
Client
Request (Host: customer1.lms.com / X-Tenant-Code)
1
Find active Tenant by code/subdomain
2
Tenant Object
3
setTenantContext(tenantId, code)
4
Proceed with request
5
Perform JPA Query (e.g., findAll)
6
SELECT ... WHERE tenant_id = :tenantId
7
Isolated Data
8
Entity list
9
Business Response
10
clear() (Clean up ThreadLocal)
11
API Response
12
Client
2. Directory & Package Structure
We will place all common multi-tenancy components in the common/security/tenant package to ensure clean separation:

text
backend/src/main/java/com/lms/platform/
├── common/
│   ├── exception/
│   │   └── TenantNotFoundException.java (New - 404/400 mapping)
│   └── security/
│       └── tenant/
│           ├── TenantContext.java (New - POJO to hold current tenant)
│           ├── TenantContextHolder.java (New - ThreadLocal Context)
│           ├── TenantResolutionFilter.java (New - Subdomain/Header extractor)
│           ├── TenantAware.java (New - Interface for Tenant-specific Entities)
│           └── TenantAspect.java (New - AOP aspect to enable Hibernate Filters)
└── modules/
    └── tenant/
        ├── entity/
        │   └── Tenant.java (Existing)
        └── repository/
            └── TenantRepository.java (New - JPA query methods)
3. Step-by-Step Implementation Steps
Step 1: Exception Mapping (TenantNotFoundException)
Create a custom TenantNotFoundException extending BaseException (which handles automatic JSON formatting via our GlobalExceptionHandler with standard ProblemDetails schema).

Step 2: Tenant Context Storage (TenantContext & TenantContextHolder)
TenantContext: Lightweight record/class containing:
UUID tenantId
String code
String subdomain
TenantContextHolder: Thread-safe context manager using a ThreadLocal wrapper. Contains helper methods to set, get, get ID, and clean up.
Step 3: Tenant Database Lookup (TenantRepository)
Implement standard Spring Data JPA lookup for the Tenant entity:

Query by subdomain: Optional<Tenant> findBySubdomainAndStatus(String subdomain, CommonStatus status)
Query by code: Optional<Tenant> findByCodeAndStatus(String code, CommonStatus status)
Step 4: Request Interception (TenantResolutionFilter)
Implement a jakarta.servlet.Filter or a OncePerRequestFilter to intercept all HTTP requests (excluding root-level paths like /api/health, /favicon.ico or public static resources).

Extraction Logic:
Read the Host header. Extract the subdomain (e.g. customer1 from customer1.lms.io.vn).
If the subdomain is a system domain (e.g. admin, www, localhost, or base domain), look for a custom header X-Tenant-Code or X-Tenant-ID. This is extremely useful for local testing via Postman or Curl.
Validation:
Lookup tenant via repository. If inactive or not found, return a formatted HTTP 400/404 ProblemDetails error using our custom exception.
Lifecycle Cleanup:
Use a try-finally block to guarantee TenantContextHolder.clear() is executed to prevent thread pool cross-pollution.
Step 5: Automatic Database Isolation (Hibernate @FilterDef and @Aspect)
To prevent developers from forgetting to append WHERE tenant_id = ... to queries, we will implement Automated Tenant Filtering at the database layer:

Define @FilterDef and @Filter on all Tenant-aware entities (or our upcoming BaseTenantEntity).
Create TenantAware interface for entities that must be isolated.
Write an Aspect (TenantAspect) that intercepts Hibernate session creation and automatically enables the filter with the current TenantContextHolder.getTenantId().
4. Verification & Testing Strategy
To guarantee the foundation is 100% correct:

Unit/Integration Test: Try fetching database entities under different tenant headers. Verify that database queries automatically append AND tenant_id = ?.
Postman/Curl Test:
Request: GET http://localhost:8080/api/health -> Works fine (ignored path).
Request: GET http://localhost:8080/api/identity/identify with no tenant header -> Returns 400 Bad Request with Tenant Context Required problem details.
Request: GET http://localhost:8080/api/identity/identify with Header X-Tenant-Code: invalid_tenant -> Returns 404 Not Found with Tenant not found problem details.
Request: GET http://localhost:8080/api/identity/identify with Header X-Tenant-Code: main_tenant -> Returns successful response.
IMPORTANT

The Multi-Tenant Foundation is fully isolated and does not modify the structure of business domains. Developing this now ensures that the upcoming Authentication & JWT modules can be developed seamlessly with immediate awareness of tenant boundaries.

