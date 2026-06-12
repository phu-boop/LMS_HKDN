# Deploy Notes

Tài liệu này mô tả các điểm cần lưu ý khi redeploy backend sau khi các phase (Tenant/Branding, Curriculum Tree, Content CMS) đã được triển khai.

## Mục tiêu redeploy hiện tại

- apply database migrations mới (V1-V9)
- rebuild API image
- recreate API container
- deploy Redis OSS 7.2.x và publish port 6379 cho kết nối từ mạng ngoài
- giữ nguyên `Host` header qua nginx để middleware resolve tenant hoạt động đúng
- đảm bảo env deploy có đủ cấu hình DB, JWT, MinIO, và Tenancy domains

## Redis OSS 7.2.x (external access)

Compose deploy đã bổ sung service `redis` dùng image `redis:7.2-alpine` với:

- AOF persistence (`--appendonly yes`)
- Auth bắt buộc qua `REDIS_PASSWORD`
- Public port `${REDIS_PORT:-6379}:6379`

### Env cần set

Trong `deploy/docker/.env.dev` (hoặc `deploy/docker/.env` nếu dùng compose production):

```dotenv
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_generate_strong_password
```

Khuyến nghị password mạnh:

```bash
openssl rand -base64 48
```

### Chạy Redis

```bash
cd /home/azureuser/lms_dev/backend/e-learning.backend
docker compose -f deploy/docker/docker-compose.dev.yml --env-file deploy/docker/.env.dev up -d redis
```

Hoặc deploy API + Redis cùng lúc:

```bash
./deploy/scripts/update-api.sh --no-pull
```

### Kiểm tra container Redis

```bash
docker ps --filter name=lms-redis
docker logs --tail 100 lms-redis
docker exec lms-redis redis-cli -a "$REDIS_PASSWORD" ping
```

Kết quả mong đợi: `PONG`.

### Kết nối từ máy ngoài

- Host: IP public của server
- Port: `6379` (hoặc giá trị `REDIS_PORT`)
- Password: `REDIS_PASSWORD`

Ví dụ:

```bash
redis-cli -h <SERVER_PUBLIC_IP> -p 6379 -a '<REDIS_PASSWORD>' ping
```

Nếu không kết nối được từ bên ngoài, cần mở firewall/security group cho TCP 6379.

## Phases Implemented

| Phase | Task | Description | Status |
|---|---|---|---|
| 1 | 1.2, 1.3, 1.4 | Identity (Login, SSO) | ✅ Deployed |
| 2 | 2.x | Tenancy, Users, Catalog, Schools | ✅ Deployed |
| 3.1 | 3.1 | Curriculum Tree (CRUD) | ✅ Deployed |
| 3.2 | 3.2 | Content CMS (Upload, Metadata) | ✅ Deployed |

**Database Migrations:**
- V1: Initial schema (tables, ENUMs, indexes)
- V2: Seed dev data (tenants, users, roles)
- V3: Align tenant permissions
- V4: School contract dates
- V5: Remove student cleanup
- V6: Catalog master data
- V7: Update user session for workspace selector
- V8: Curriculum node_type VARCHAR(100)
- **V9: Session policy defaults (max_concurrent_sessions=50, login_policy=KICK_OLDEST)**

## 1. File cần kiểm tra trước khi redeploy

- `deploy/docker/.env.dev`
- `deploy/docker/docker-compose.dev.yml`
- `deploy/scripts/update-api.sh`
- `deploy/scripts/deploy-dev.sh`
- `deploy/nginx/lms-api.conf`

## 2. Quy trình khuyến nghị trên dev server

```bash
cd /home/azureuser/lms_dev/backend/e-learning.backend
git pull --ff-only
./deploy/scripts/update-api.sh --no-pull
```

Hoặc chỉ cần một lệnh:

```bash
./deploy/scripts/update-api.sh
```

## 3. Khi nào dùng `deploy-dev.sh`

```bash
./deploy/scripts/deploy-dev.sh api
./deploy/scripts/deploy-dev.sh nginx
./deploy/scripts/deploy-dev.sh all
```

Use case:

- `api`: redeploy lại API + migration
- `nginx`: khi thay đổi cấu hình reverse proxy
- `all`: lần setup mới hoặc khi cần áp lại toàn bộ stack deploy

## 4. Tại sao nginx cần review sau phần Tenancy

Tenant resolution hiện dựa vào `Host` header và các domain như:

- `id.daihoc.io.vn`
- `admin.daihoc.io.vn`
- `*.daihoc.io.vn`

Vì vậy reverse proxy phải:

- route được các hostname này tới API
- giữ nguyên `proxy_set_header Host $host`

`deploy/nginx/lms-api.conf` đã được cập nhật theo hướng này cho HTTP reverse proxy.

## 5. Tại sao docker compose cần review sau phần Tenancy

Compose dev hiện inject các biến Tenancy sau vào container API:

- `Tenancy__AdminSubdomain`
- `Tenancy__AdminDomains__0`
- `Tenancy__AdminDomains__1`
- `Tenancy__TenantBaseDomains__0`

Điều này giúp deploy server dev bám đúng domain config thay vì phụ thuộc hoàn toàn vào appsettings mặc định.

## 6. Migration hiện tại

Hiện tại thư mục `database/` có:

- `V1__initial_schema.sql`
- `V2__seed_dev.sql`
- `V3__align_tenant_permissions.sql`
- `V4__school_contract_dates.sql`
- `V5__remove_student_cleanup.sql`
- `V6__catalog_master_data.sql`
- `V7__update_user_session.sql`
- `V8__curriculum_node_type_text.sql`
- `V9__update_session_policy_defaults.sql`
- `V10__seed_multi_tenant_teacher.sql`
- `V10__session_expiry_kick_oldest.sql`
- `V11__ensure_user_session_expires_at.sql`

Các script deploy sẽ apply toàn bộ file `V*.sql` chưa có trong bảng `schema_migrations`.

Neu gap loi `42703: column "expires_at" does not exist`, chay lai migration:

```bash
./deploy/scripts/deploy-dev.sh migrate
```

## 7. Kiểm tra sau deploy

```bash
docker ps --filter name=lms-api
docker inspect --format='health={{.State.Health.Status}} status={{.State.Status}}' lms-api
docker logs --tail 200 lms-api
curl -sf http://localhost:5294/health
curl -sf "http://localhost:5294/api/tenants/resolve?domain=id.daihoc.io.vn"
```