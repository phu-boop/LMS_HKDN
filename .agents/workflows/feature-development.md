# LMS_HKDN: Standard Feature Development Workflow

Follow this sequence for implementing any new feature.

## Phase 1: Planning & Analysis
1. **Context Check**: Read relevant documentation (`docs/architecture`) and existing code in the target module.
2. **Schema Design**: If the feature requires new tables or columns, create a Flyway migration script draft.
3. **API Definition**: Define the REST endpoints, Request DTOs, and Response DTOs.

## Phase 2: Persistence Layer
1. **Entity Implementation**: Create/update JPA Entities. Extend `BaseTenantEntity` if needed.
2. **Repository Implementation**: Create/update the Repository interface with necessary query methods or Specifications.
3. **Database Migration**: Finalize the Flyway migration file.

## Phase 3: Business Logic
1. **Service Interface**: Define the service contract in `com.lms.platform.service`.
2. **Service Implementation**: Implement logic in `com.lms.platform.service.impl`.
3. **Mapping**: Create MapStruct interfaces for Entity/DTO conversion.
4. **Security**: Add security annotations (`@PreAuthorize`, ACL checks).

## Phase 4: API Layer
1. **Controller Implementation**: Create the REST Controller. Use `ApiResponse<T>` wrapper.
2. **Exception Handling**: Ensure appropriate exceptions are thrown for business rule violations.

## Phase 5: Verification & Documentation
1. **Self-Review**: Run the `review_checklist.md`.
2. **Documentation**: Update API documentation or architecture documents if significant changes were made.
3. **Test Case Generation**: Generate Postman/curl requests for testing.
