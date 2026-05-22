# LMS_HKDN: Testing & Quality Assurance Standards

## 1. Backend Testing (JUnit 5 / Mockito)
- **Unit Tests**:
  - Test every Service method.
  - Mock Repositories and external services.
  - Focus on business logic and edge cases.
- **Integration Tests**:
  - Use `@SpringBootTest` with `@ActiveProfiles("test")`.
  - Use **Testcontainers** (PostgreSQL) for database tests.
  - Test complete API flows (Controller -> Service -> Repo).

## 2. Frontend Testing (Vitest / RTL)
- **Component Tests**: Test UI components for rendering and basic interaction.
- **Hook Tests**: Test complex custom hooks in isolation.
- **Mocking**: Use **MSW (Mock Service Worker)** to mock API responses.

## 3. Mandatory Coverage
- Core business logic: 90%+ coverage.
- Controllers/Services: 80%+ coverage.
- Utility functions: 100% coverage.

## 4. Automation
- AI must generate a corresponding test file for every new service or component created.
