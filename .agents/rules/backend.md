# LMS_HKDN: Backend Engineering Standards (Java 21 / Spring Boot)

## 1. Development Standards
- **Java Version**: 21 (Use records for DTOs where applicable).
- **Spring Boot**: 3.x.
- **Dependency Injection**: Use Constructor Injection via Lombok `@RequiredArgsConstructor`.
- **Lombok**: Use `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` where appropriate.

## 2. Persistence (JPA/Hibernate)
- **Entity Definition**: 
  - Extend `BaseTenantEntity` for tenant-specific data.
  - Use `@SQLRestriction("is_deleted = false")`.
- **Repositories**:
  - Use `JpaRepository` and `JpaSpecificationExecutor`.
  - Use Specification Pattern for dynamic filtering.
  - Avoid `@Query` if possible; prefer method name derived queries or Specifications.
- **Transactions**:
  - `@Transactional` on Service Implementation methods.
  - Use `readOnly = true` for fetch methods.

## 3. Mapping (MapStruct)
- All Entity <-> DTO conversions MUST use MapStruct.
- Mapper interfaces should be in `com.lms.platform.mapper`.
- Use `componentModel = "spring"`.

## 4. API Design
- **Response Wrapper**: All APIs must return `ApiResponse<T>`.
- **Exceptions**: Throw custom exceptions (e.g., `BusinessException`, `EntityNotFoundException`).
- **Validation**: Use `@Valid` and JSR-303 annotations (`@NotBlank`, `@NotNull`, etc.) in DTOs.

## 5. Performance
- **N+1**: Use `@EntityGraph` for eager loading of collections when needed.
- **Pagination**: All list APIs MUST support pagination using `Pageable`.
- **JSON**: Use `@JsonInclude(JsonInclude.Include.NON_NULL)` to keep payloads clean.
