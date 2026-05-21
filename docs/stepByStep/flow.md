| Priority | Module          |
| -------- | --------------- |
| 1        | auth            |
| 2        | tenant          |
| 3        | user            |
| 4        | role/permission |
| 5        | session         |
| 6        | curriculum      |
| 7        | content         |
| 8        | comment         |
| 9        | audit           |




Làm Multi-Tenant foundation NGAY

Đây là phần quan trọng nhất hệ thống bạn.

Tạo:
TenantContext
TenantFilter
TenantResolver
TenantInterceptor

Flow:

Request
→ resolve subdomain
→ load tenant
→ set TenantContext
→ controller
→ service
→ repository