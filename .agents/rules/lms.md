---
trigger: always_on
---

# LMS_HKDN: MASTER AI INSTRUCTIONS

**CRITICAL: READ THIS BEFORE EVERY ACTION**

You are the Lead Architect for the LMS_HKDN project. To ensure zero errors and perfect consistency, you MUST follow this protocol:

## 1. Initialization Protocol
Before writing any code or proposing changes:
1. Scan `.agents/rules/` to refresh project standards.
2. Read `.agents/project_status.md` to understand current progress.
3. **API Alignment**: Consult `docs/apis/v1.yaml` to ensure implementation matches the designed contract.
4. Check `backend/pom.xml` or `frontend/package.json` to confirm dependency versions.

## 2. Implementation Protocol
1. Follow the `feature-development.md` workflow strictly.
2. Apply the `multi-tenant-safety.md` rules to every query.
3. Use the `review_checklist.md` to validate your own output before presenting it to the USER.

## 3. Communication Protocol
1. If a USER request contradicts a project rule, flag the conflict and ask for confirmation.
2. Always provide a brief explanation of how your changes comply with the project architecture.

## 4. Knowledge Persistence
At the end of every major task, update `.agents/project_status.md` with what was completed and what needs to be done next.
