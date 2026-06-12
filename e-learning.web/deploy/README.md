# LMS Frontend Deploy Runbook

Tai lieu nay dung cho cac lan deploy sau, bao gom setup lan dau, build, rebuild, update va xu ly loi thuong gap.

## 1. Thu muc lien quan

```
deploy/
├── docker/
│   ├── .env.example
│   ├── .env                # production runtime env
│   ├── .env.dev            # development env
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── scripts/
│   ├── setup.sh
│   ├── deploy-prod.sh
│   └── deploy-dev.sh
└── README.md
```

## 2. Dieu kien tien quyet

- Docker da cai va daemon dang chay
- Docker Compose:
  - Production script ho tro ca docker compose plugin va docker-compose binary
  - Development script hien tai dung docker-compose binary
- Bash shell

Kiem tra nhanh:

```bash
docker --version
docker compose version || docker-compose --version
```

## 3. Bien moi truong quan trong

Frontend dung NEXT_PUBLIC_* va can co gia tri ngay luc build image.

Toi thieu can set trong deploy/docker/.env (production):

```dotenv
NEXT_PUBLIC_HOST_API_URL=https://dev-api.daihoc.io.vn
NEXT_PUBLIC_ROOT_DOMAIN=daihoc.io.vn
NEXT_PUBLIC_LOGIN_DOMAIN=https://id.daihoc.io.vn
NEXT_PUBLIC_ADMIN_DOMAIN=https://lms-admin.daihoc.io.vn
```

Luu y:

- deploy production dung file deploy/docker/.env
- file .env.test o root khong duoc deploy script production su dung

## 4. Setup lan dau (full)

Tu root project e-learning.web:

```bash
cd deploy/scripts
chmod +x setup.sh deploy-prod.sh deploy-dev.sh
./setup.sh prod
```

Neu chua co deploy/docker/.env, setup se tao tu .env.example.

Sau do mo file env va cap nhat gia tri that:

```bash
nano ../docker/.env
```

## 5. Luong deploy production

### 5.1 Build image

```bash
cd deploy/scripts
./deploy-prod.sh build
```

### 5.2 Start service

```bash
./deploy-prod.sh up
```

### 5.3 Rebuild toan bo (khuyen dung khi doi env hoac doi code frontend)

```bash
./deploy-prod.sh rebuild
```

Lenh rebuild se:

1. Build lai image lms-web
2. Down stack hien tai
3. Tu dong cleanup container cu trung ten (lms-web, lms-web-nginx)
4. Up lai stack

### 5.4 Update tu git + deploy

```bash
./deploy-prod.sh update
```

Lenh update se:

1. git pull --ff-only
2. build image moi
3. down + cleanup container cu
4. up lai

## 6. Cac lenh van hanh nhanh

```bash
cd deploy/scripts

./deploy-prod.sh ps        # trang thai container
./deploy-prod.sh logs      # xem log real-time
./deploy-prod.sh restart   # restart containers
./deploy-prod.sh down      # stop stack
./deploy-prod.sh clean     # down -v va xoa image (can nhac)
```

## 7. Kiem tra sau deploy

```bash
cd deploy/scripts
./deploy-prod.sh ps

docker exec lms-web sh -lc "printenv | grep '^NEXT_PUBLIC_HOST_API_URL='"
curl -f http://localhost:3000/api/health
```

Neu dung nginx trong stack, co the check them:

```bash
curl -I http://localhost
```

## 8. Development workflow

```bash
cd deploy/scripts
./setup.sh dev
./deploy-dev.sh up
./deploy-dev.sh logs
./deploy-dev.sh down
```

Luu y dev:

- deploy-dev.sh dang dung docker-compose binary
- neu server chi co docker compose plugin, can cai them docker-compose hoac cap nhat script dev

## 9. Xu ly loi thuong gap

### 9.1 next: Permission denied khi yarn build

Trieu chung:

- Loi o buoc RUN yarn build
- /bin/sh: next: Permission denied

Nguyen nhan thuong gap:

- Build context copy ca node_modules tu host vao image

Cach xu ly:

1. Dam bao file .dockerignore co node_modules, .next, .git
2. Build lai:

```bash
cd deploy/scripts
./deploy-prod.sh rebuild
```

### 9.2 Conflict container name lms-web da ton tai

Trieu chung:

- Error response from daemon: container name "/lms-web" is already in use

Hien tai deploy-prod.sh da co cleanup tu dong.
Neu van gap do container ngoai luong compose, chay tay:

```bash
docker rm -f lms-web lms-web-nginx
cd deploy/scripts
./deploy-prod.sh rebuild
```

### 9.3 Port bi trung

```bash
lsof -i :3000
lsof -i :80
lsof -i :443
```

## 10. Chu ky deploy de xai lai moi lan

Khi da setup xong, moi lan update production chi can:

```bash
cd deploy/scripts
./deploy-prod.sh update
```

Neu co thay doi env NEXT_PUBLIC_* hoac can chac chan build sach:

```bash
cd deploy/scripts
./deploy-prod.sh rebuild
```
