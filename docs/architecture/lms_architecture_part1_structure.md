# Enterprise LMS Architecture - Part 1: Structure & Configuration

This document outlines the high-level architecture, feature-based modular design, directory structures, and essential configurations for the Multi-Tenant LMS Platform.

## 1. Feature-Based Modular Architecture

The system follows a Clean Architecture approach combined with a feature-based modular structure. This ensures separation of concerns, high cohesion within features, and low coupling between features. 

### Core Modules
*   **common**: Cross-cutting concerns, base classes, exceptions, utility classes, generic security configurations.
*   **auth**: User authentication, token management (JWT), session handling.
*   **tenant**: Tenant management, subdomain resolution, multi-tenant data isolation.
*   **school**: School entity management and tenant-school mappings.
*   **user**: User account management, profile updates.
*   **role & permission**: RBAC configuration, role definitions, module permissions.
*   **curriculum**: Curriculum tree structure (folders, modules, lessons).
*   **content**: Content items, HLS streaming, signed URLs, permissions.
*   **session**: Concurrent session limits, device fingerprinting.
*   **audit**: Audit logging for all critical system actions.
*   **catalog**: System-wide catalogs and master data.

## 2. Recommended Package Structure (Backend)

```text
com.lms.platform
├── LmsApplication.java
├── common
│   ├── config          # Global configurations (OpenAPI, JPA, etc.)
│   ├── security        # Security chains, JWT filters, tenant interceptors
│   ├── exception       # Global exception handlers, custom exceptions
│   ├── model           # BaseEntity, AuditEntity, PaginatedResponse, ApiResponse
│   ├── util            # Helper classes (DateUtils, SecurityUtils)
│   └── validator       # Custom bean validation annotations
└── modules
    ├── auth            # Login, Token generation
    ├── tenant          # Tenant context, resolution
    ├── school          # School operations
    ├── user            # User management
    ├── rbac            # Role & Permission logic
    ├── curriculum      # Tree node management
    ├── content         # Content, streaming, comments
    ├── session         # Active session tracking
    └── audit           # Async audit logging
```

Within each module (e.g., `content`), the structure follows Clean Architecture principles:

```text
modules/content/
├── controller      # REST endpoints (ContentController, CommentController)
├── dto
│   ├── request     # Input DTOs (CreateContentRequest)
│   └── response    # Output DTOs (ContentDetailResponse)
├── entity          # JPA Entities (ContentItem, ContentPermission)
├── mapper          # MapStruct interfaces (ContentMapper)
├── repository      # Spring Data JPA Repositories (ContentItemRepository)
├── service         # Interfaces (ContentService)
└── service/impl    # Implementations (ContentServiceImpl)
```

## 3. Initial Project Trees

### Backend (Spring Boot 3)

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/lms/platform/
│   │   │   └── ... (Package structure above)
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── db/migration/         # Flyway scripts
│   │       │   ├── V1__init_schema.sql
│   │       │   └── V2__seed_data.sql
│   │       └── i18n/                 # Localization properties
│   └── test/                         # Unit & Integration tests
├── pom.xml                           # Maven dependencies
├── Dockerfile                        # Backend image definition
└── checkstyle.xml                    # Code quality rules
```

### Frontend (Next.js App Router)

```text
frontend/
├── src/
│   ├── app/                          # App Router pages & API routes
│   │   ├── (auth)/                   # Auth layout group (login, reset)
│   │   ├── (dashboard)/              # Main application layout group
│   │   │   ├── [tenantId]/           # Tenant-specific routes
│   │   │   │   ├── curriculum/
│   │   │   │   ├── users/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global Tailwind styles
│   ├── components/
│   │   ├── ui/                       # Reusable base components (buttons, inputs)
│   │   └── features/                 # Feature-specific components
│   │       ├── auth/
│   │       ├── content/
│   │       └── curriculum/
│   ├── lib/
│   │   ├── api/                      # Axios instances, interceptors
│   │   ├── store/                    # Zustand stores (useAuth, useTenant)
│   │   └── utils.ts                  # Helper functions
│   ├── hooks/                        # React Query hooks (useUsers, useContent)
│   ├── types/                        # TypeScript interfaces & Zod schemas
│   └── middleware.ts                 # Next.js middleware (Auth/Tenant routing)
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── Dockerfile
```

## 4. docker-compose.yml Structure

A complete development environment setup using Docker Compose.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: lms_dev
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: lms_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lms_dev -d lms_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DB_HOST=postgres
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 5. application.yml Structure

```yaml
spring:
  application:
    name: lms-platform
  
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/lms_db
    username: ${DB_USER:lms_dev}
    password: ${DB_PASSWORD:dev_password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: validate # Flyway handles schema
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: 6379

app:
  security:
    jwt:
      secret: ${JWT_SECRET:very_long_and_secure_secret_key_here}
      expiration-ms: 900000 # 15 minutes
      refresh-expiration-ms: 604800000 # 7 days
  cors:
    allowed-origins: "http://localhost:3000"

logging:
  level:
    com.lms.platform: DEBUG
    org.springframework.security: INFO
```
