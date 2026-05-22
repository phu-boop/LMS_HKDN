# LMS_HKDN: DevOps & Environment Standards

## 1. Environment Management
- Use `.env.example` to document all required variables.
- NEVER commit `.env` files.
- Configuration hierarchy: Environment Variables > `application.yml` > `application-default.yml`.

## 2. Containerization (Docker)
- Provide a `docker-compose.yml` for local development (DB, Redis, S3).
- Use Multi-stage builds for production Dockerfiles to minimize image size.
- Backend image base: `eclipse-temurin:21-jre-alpine`.
- Frontend image base: `node:20-alpine`.

## 3. CI/CD Pipeline
- **Validation**: Every PR must pass Lint check and Unit Tests.
- **Security**: Run dependency vulnerability scans (OWASP Dependency Check / Snyk).
- **Artifacts**: Deployments should be immutable (Docker images).

## 4. Storage & Files
- Use S3-compatible storage for assets.
- Tenant isolation in storage: Store files under `/[tenant-id]/[module]/[filename]`.
