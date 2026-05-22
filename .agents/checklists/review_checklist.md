# LMS_HKDN: AI Code Review Checklist

Perform this checklist for every code generation or modification task.

## 1. Multi-Tenancy & Security
- [ ] Does the entity extend `BaseTenantEntity`? (if tenant-scoped)
- [ ] Is there any risk of cross-tenant data leakage?
- [ ] Are sensitive endpoints protected by appropriate RBAC/ACL checks?
- [ ] Are UUIDs used for all new primary keys?
- [ ] Is input validation implemented for all request DTOs?

## 2. Architecture & Patterns
- [ ] Is constructor injection used (Lombok `@RequiredArgsConstructor`)?
- [ ] Are service interfaces defined and used instead of direct implementation?
- [ ] Is MapStruct used for DTO mapping?
- [ ] Is business logic strictly in the Service layer?
- [ ] Are transactions correctly managed with `@Transactional`?

## 3. Database
- [ ] Is soft-delete implemented (`is_deleted` flag)?
- [ ] Are indexes planned for frequently queried columns?
- [ ] Is JPA Auditing enabled for the entity?
- [ ] Are native queries avoided unless strictly necessary for performance?

## 4. Quality & Clean Code
- [ ] Does the code follow the naming conventions (general.md)?
- [ ] Is the code free of placeholders and TODOs?
- [ ] Are there meaningful logs for error conditions?
- [ ] Is the `ApiResponse<T>` wrapper used for controller responses?
- [ ] Are N+1 query problems addressed via `@EntityGraph` or `JOIN FETCH`?
