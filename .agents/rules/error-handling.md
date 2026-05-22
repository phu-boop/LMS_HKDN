# LMS_HKDN: Error Handling & Logging Standards

## 1. Backend Error Handling
- **Global Exception Handler**: Use `@ControllerAdvice` to catch and wrap all exceptions.
- **Unified Response**: Every error must return an `ApiError` object:
  ```json
  {
    "success": false,
    "errorCode": "TENANT_NOT_FOUND",
    "message": "User-friendly message",
    "details": {},
    "timestamp": "2024-05-22T..."
  }
  ```
- **Business Exceptions**: Create specific checked or unchecked exceptions for business rules (e.g., `InsufficientPermissionsException`).

## 2. Frontend Error Handling
- **API Errors**: Handle errors in TanStack Query `onError` callbacks.
- **Global Error Boundary**: Use Next.js `error.tsx` for unexpected crashes.
- **User Feedback**: Use `sonner` or `react-hot-toast` for non-blocking notifications.

## 3. Logging Strategy
- **Level**: Use `INFO` for flow, `WARN` for recoverable issues, `ERROR` for failures.
- **Context**: Every log statement in tenant-scoped services MUST include `tenantId`.
- **Sensitive Data**: NEVER log passwords, tokens, or PII.
