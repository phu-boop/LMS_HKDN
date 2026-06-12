# Hướng dẫn thiết lập CI/CD bằng GitHub Actions

Tài liệu này hướng dẫn cách tự động hóa việc deploy ứng dụng lên server mỗi khi bạn push code lên GitHub.

## 1. Cơ chế hoạt động
Mỗi khi có code mới ở nhánh `main`:
1. GitHub sẽ Build Docker image.
2. Đẩy Image lên **Docker Hub** (hoặc GitHub Container Registry).
3. SSH vào Server để chạy lệnh `docker compose pull` và `docker compose up -d`.

## 2. Chuẩn bị (Secret)
Sếp vào Repo trên GitHub -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**. Thêm các biến sau:
- `DOCKERHUB_USERNAME`: Tên đăng nhập Docker Hub.
- `DOCKERHUB_TOKEN`: Token của Docker Hub (tạo trong Account Settings -> Security).
- `SERVER_HOST`: IP của Server.
- `SERVER_USER`: Thường là `root`.
- `SSH_PRIVATE_KEY`: Nội dung file SSH Key (Private) để GitHub có quyền truy cập vào Server.

## 3. File cấu hình GitHub Actions
Tạo file `.github/workflows/deploy.yml` với nội dung mẫu sau:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/lms-frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Executing remote ssh commands using password
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /root/nextjs
            docker compose pull
            docker compose up -d
```

## 4. Lợi ích sau khi cài đặt
Từ giờ sếp chỉ cần ngồi code, gõ:
```bash
git add .
git commit -m "Tính năng mới"
git push origin main
```
Sau đó sếp đi pha một tách cafe ☕️, quay lại là web đã tự cập nhật xong xuôi rồi ạ!
