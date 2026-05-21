# Enterprise LMS Architecture - Part 2: Flows & Security

This document details the critical request flows, security architecture, and base implementation patterns required for the Multi-Tenant LMS Platform.

## 1. Request Flow Architectures

### 1.1 Tenant Resolution Flow
Because this is a multi-tenant application, every incoming request must be associated with a specific tenant.
1.  **Request arrives**: The client makes a request to `https://tenant1.lms.com/api/v1/content`.
2.  **Filter/Interceptor**: `TenantResolutionFilter` intercepts the request.
3.  **Extraction**: The filter extracts the subdomain (`tenant1`) from the `Host` header or a custom header (`X-Tenant-ID`).
4.  **Validation**: A cached lookup against the `tenant` table ensures the subdomain is valid and active.
5.  **Context Setting**: If valid, the `TenantId` is set in a `ThreadLocal` context (e.g., `TenantContextHolder`).
6.  **Propagation**: The `TenantId` is automatically appended to database queries (using Hibernate Filters) to ensure strict data isolation.
7.  **Cleanup**: `TenantContextHolder` is cleared at the end of the request.

### 1.2 Authentication Flow (JWT & Refresh)
1.  **Login**: User submits `username` and `password`.
2.  **Validation**: `AuthenticationManager` verifies credentials against the `user_account` table.
3.  **Session Creation**: A new record is inserted into `user_session` with device fingerprint and IP.
4.  **Token Generation**: 
    *   **Access Token (JWT)**: Contains `userId`, `tenantId`, `roles`, and short expiry (15m).
    *   **Refresh Token**: Long-lived, stored securely (HttpOnly cookie or local storage depending on client type), hashed in the `user_session` table.
5.  **Return**: Both tokens are returned to the frontend.
6.  **Subsequent Requests**: Access token is passed in `Authorization: Bearer <token>`. 
7.  **Token Refresh**: When access token expires, frontend sends Refresh Token. Backend validates it against `user_session` and issues a new Access Token.

### 1.3 RBAC & Authorization Flow
1.  **Request**: Authenticated request hits a controller endpoint annotated with `@PreAuthorize("hasPermission('CONTENT_CREATE')")`.
2.  **Filter**: `JwtAuthenticationFilter` validates the token and sets the `SecurityContext`.
3.  **Method Security**: Spring Security invokes the custom `PermissionEvaluator`.
4.  **Evaluation**:
    *   The evaluator checks `user_tenant_role_assignment` for the current `userId` and `tenantId`.
    *   It retrieves the assigned roles and joins with `role_permission` to get all `permission.code` values.
    *   (Optimization: Permissions are cached in Redis upon login).
5.  **Decision**: If the user holds `CONTENT_CREATE` for the current tenant context, access is granted.

### 1.4 Content Permission Validation Flow
For accessing specific content (e.g., downloading a video):
1.  **Request**: User requests access to `content_item` ID: `X`.
2.  **Metadata Check**: Service checks the `content_item` visibility dates and `publish_status`.
3.  **Curriculum Link**: Identifies the `curriculum_node_id` the content is attached to.
4.  **Explicit Permission Check**: Queries `content_permission` table:
    *   Does the user have an explicit record allowing view/download for this node?
    *   If not, does the user's `school_id` have a record allowing view/download?
5.  **Streaming**: If valid, a short-lived Signed URL (e.g., AWS CloudFront) is generated and returned to the client to prevent direct URL sharing.

## 2. Core Base Classes & Wrappers

### 2.1 Base Entity
Ensures consistent auditing and soft-delete capabilities across all entities.

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
```

### 2.2 Global API Response Wrapper
Standardizes all JSON responses from the REST API.

```java
@Data
@Builder
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
    private OffsetDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(OffsetDateTime.now())
                .build();
    }
    
    // ... error factory methods
}
```

### 2.3 Pagination Response Model
Wraps Spring Data's `Page` object for frontend consumption.

```java
@Data
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public PaginatedResponse(Page<T> page) {
        this.content = page.getContent();
        this.pageNumber = page.getNumber();
        this.pageSize = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages = page.getTotalPages();
        this.last = page.isLast();
    }
}
```

### 2.4 Global Exception Handler
Catches application exceptions and translates them into consistent HTTP responses.

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), "NOT_FOUND"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied to this resource", "FORBIDDEN"));
    }
    
    // Handle MethodArgumentNotValidException (Validation errors)
    // Handle generic Exception.class
}
```

## 3. Important Starter Implementations

### 3.1 Tenant Context Holder
Thread-local storage for the current tenant, essential for data isolation.

```java
public class TenantContextHolder {
    private static final ThreadLocal<UUID> CONTEXT = new ThreadLocal<>();

    public static void setTenantId(UUID tenantId) {
        CONTEXT.set(tenantId);
    }

    public static UUID getTenantId() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```

### 3.2 Audit Logging (Event Driven)
Using Spring Application Events to decouple business logic from audit logic.

```java
// Service fires the event
applicationEventPublisher.publishEvent(new AuditEvent(
    this, TenantContextHolder.getTenantId(), userId, "CONTENT_CREATED", "CONTENT_ITEM", contentId, metadataJson
));

// Listener persists it asynchronously
@Async
@EventListener
public void handleAuditEvent(AuditEvent event) {
    AuditLog log = new AuditLog();
    // Map event data to entity
    auditRepository.save(log);
}
```
