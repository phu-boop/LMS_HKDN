# Enterprise LMS Architecture - Part 3: Standards & Scalability

This document establishes the coding conventions, database optimization strategies, and future scalability roadmap for the Multi-Tenant LMS Platform.

## 1. Naming Conventions

Consistency across the codebase is vital for a large-scale enterprise application.

### 1.1 Backend Conventions
*   **APIs (REST)**: 
    *   Use kebab-case for URIs: `/api/v1/content-items`
    *   Nouns representing resources: `GET /users`, `POST /tenants`
    *   Sub-resources for relationships: `GET /curriculum/{id}/contents`
*   **DTOs**:
    *   Requests: `[Action][Entity]Request` (e.g., `CreateSchoolRequest`, `UpdateContentRequest`)
    *   Responses: `[Entity]DetailResponse`, `[Entity]ListResponse`
*   **Services**: `[Entity]Service` (interface) and `[Entity]ServiceImpl` (implementation).
*   **Repositories**: `[Entity]Repository`.
*   **Variables/Methods**: standard camelCase.
*   **Database Tables**: snake_case, singular (e.g., `user_account`, `content_item`).

### 1.2 Frontend Conventions
*   **Components**: PascalCase (e.g., `ContentPlayer.tsx`, `SidebarMenu.tsx`).
*   **Hooks**: camelCase starting with `use` (e.g., `useTenantContext`, `useAuth`).
*   **Store/Context**: `[Feature]Store` (e.g., `tenantStore`, `authStore`).
*   **API Functions**: `[action][Entity]` (e.g., `fetchContentItems`, `createSchool`).
*   **Types/Interfaces**: PascalCase (e.g., `UserAccount`, `ContentItem`).

## 2. Coding Standards

### 2.1 Backend (Java 21 & Spring Boot)
1.  **Dependency Injection**: Use **Constructor Injection** exclusively (often facilitated by Lombok's `@RequiredArgsConstructor`). Avoid `@Autowired` on fields.
2.  **Interfaces**: Always define a Service Interface and implement it. This allows for easier mocking and swapping of implementations (e.g., transitioning from local storage to S3).
3.  **Mapping**: Use **MapStruct** for all Entity <-> DTO conversions. Do not write manual mapping code.
4.  **Transaction Management**: Apply `@Transactional` at the Service layer. Keep transactions as short as possible to avoid locking issues. Read-only methods should use `@Transactional(readOnly = true)`.
5.  **Dynamic Queries**: Use the **Specification Pattern** (Spring Data JPA Specifications) for complex searches and filtering, rather than huge `@Query` annotations.
6.  **N+1 Problem**: Actively monitor for N+1 query issues. Use `@EntityGraph` or `JOIN FETCH` in repository queries when fetching collections is necessary.

### 2.2 Frontend (Next.js & TypeScript)
1.  **Feature-First**: Organize code by feature (e.g., `src/features/curriculum`) rather than by type (`src/components`, `src/hooks`).
2.  **Validation**: Use **Zod** for schema definition and validation, deeply integrated with **React Hook Form**.
3.  **State Management**: 
    *   Use **TanStack Query (React Query)** for all server state (fetching, caching, mutations).
    *   Use **Zustand** only for global client state (e.g., UI theme, current active tenant, auth token).
4.  **Error Handling**: Implement global **Error Boundaries** in Next.js (`error.tsx`) and handle specific API errors gracefully using toast notifications.
5.  **Loading States**: Implement React Suspense and Next.js `loading.tsx` to provide immediate feedback to users during network requests.
6.  **Components**: Build a reusable, accessible UI component library (often using Tailwind + Radix UI or shadcn/ui) before building complex pages.

## 3. Database Architecture Requirements (PostgreSQL)

The provided PostgreSQL schema has been designed with enterprise requirements in mind. Key strategies to maintain:

1.  **Soft Delete Pattern**: Every table includes `is_deleted = boolean`. Physical deletes (`DELETE FROM`) are strictly prohibited in the application code. Hibernate `@SQLRestriction("is_deleted = false")` (or `@Where` in older versions) should be used on all entities to filter deleted rows automatically.
2.  **UUID Primary Keys**: `gen_random_uuid()` is used to prevent ID guessing (Insecure Direct Object Reference) and makes database merging/sharding easier in the future.
3.  **JSONB Usage**: The `metadata` column in `audit_log` and `watermark_settings` in `tenant` use JSONB. This allows for flexible storage of unstructured data while maintaining PostgreSQL's ability to index and query inside the JSON structure if needed.
4.  **Indexing Strategy**:
    *   Composite indexes are crucial for multi-tenant queries (e.g., `tenant_id` + `status`).
    *   Indexes on foreign keys to speed up joins.
    *   Partial indexes (using `WHERE is_deleted = false`) are heavily utilized in the schema to keep index sizes small and fast.
5.  **Audit Columns**: `created_by`, `created_at`, `updated_by`, `updated_at` must be automatically populated using JPA Auditing (`@EnableJpaAuditing`).

## 4. Future Scalability Roadmap

The architecture is designed to start as a well-structured modular monolith and smoothly transition as load increases.

1.  **Microservices Migration**: Because the codebase uses a feature-based modular structure with clean boundaries, breaking out the `content` or `audit` modules into separate microservices later will be relatively straightforward.
2.  **Event-Driven Architecture**: The use of Spring Application Events for audit logging sets the stage for moving to a distributed message broker (like Apache Kafka or RabbitMQ) when asynchronous processing needs to scale across multiple instances.
3.  **Redis Caching**: Redis is included from day one for session management. It is positioned to be easily adopted for:
    *   Caching RBAC permissions.
    *   Caching the Curriculum Tree (which is read-heavy).
    *   Rate limiting API endpoints per tenant.
4.  **WebSocket Readiness**: The session management system tracks active user sessions, making it ready for WebSocket integration to push real-time notifications (e.g., "Your video has finished processing").
5.  **AWS Deployment Ready**:
    *   The backend is fully containerized via Docker.
    *   File storage abstractions (interfaces) ensure `file_path` in `content_item` can seamlessly point to an AWS S3 bucket.
    *   The database schema is compatible with Amazon RDS or Aurora PostgreSQL.
