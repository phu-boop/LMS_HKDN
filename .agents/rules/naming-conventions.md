# LMS_HKDN: Naming & Domain Conventions

## 1. Language Policy
- **Codebase Language**: All code (variables, classes, methods, comments, documentation) MUST be in **English**.
- **Business Terms**: Use the agreed-upon English domain terms. If unsure, ask for clarification.
- **UI/Content**: Support both English and Vietnamese (i18n).

## 2. Backend Naming (Java)
- **Classes**: PascalCase (e.g., `CourseService`).
- **Methods/Variables**: camelCase (e.g., `enrollStudent`).
- **Interfaces**: NO `I` prefix (e.g., `CourseService`, not `ICourseService`).
- **Implementation**: Postfix with `Impl` only if necessary (e.g., `CourseServiceImpl`).
- **Packages**: lowercase, dot-separated (e.g., `com.lms.platform.features.course`).

## 3. Frontend Naming (React/Next.js)
- **Components**: PascalCase (e.g., `StudentCard.tsx`).
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`).
- **Files/Folders**: kebab-case (e.g., `user-profile/`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`).

## 4. Database Naming
- **Tables**: snake_case, plural (e.g., `courses`, `users`).
- **Columns**: snake_case (e.g., `created_at`, `tenant_id`).
- **FK Columns**: `[entity_name]_id` (e.g., `course_id`).
