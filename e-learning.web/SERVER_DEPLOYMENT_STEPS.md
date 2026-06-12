# Hướng dẫn Deploy lên Server (VPS) với Domain daihoc.io.vn

Dưới đây là các bước chi tiết để đưa ứng dụng từ máy cá nhân lên server thật.

## Bước 1: Chuẩn bị Server (VPS)
1. **Mua VPS**: Khuyên dùng Ubuntu 22.04 LTS (từ các nhà cung cấp như Vietnix, Long Vân, hoặc quốc tế như DigitalOcean, Linode).
2. **Đăng nhập vào Server**:
   Sử dụng Terminal trên Mac của bạn:
   ```bash
   ssh root@<IP_CỦA_SERVER>
   ```

## Bước 2: Trỏ Domain
1. Truy cập vào trang quản trị tên miền của bạn.
2. Thêm các bản ghi (Record) sau:
   - **Loại A**: `@` trỏ về `<IP_CỦA_SERVER>`
   - **Loại A**: `*` trỏ về `<IP_CỦA_SERVER>` (Để hỗ trợ các subdomain như stem.daihoc.io.vn)

## Bước 3: Cài đặt Docker trên Server
Chạy các lệnh sau trên Server:
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Kiểm tra Docker đã chạy chưa
sudo docker ps
```

## Bước 4: Đưa Code lên Server và Chạy
1. **Copy code**: Bạn có thể dùng `git clone` hoặc dùng lệnh `scp` để copy từ máy Mac lên:
   ```bash
   # Chạy lệnh này trên máy Mac (không phải trên server)
   scp -r /Users/hoangnguyen/Desktop/nextjs root@<IP_SERVER>:/root/
   ```
2. **Chạy ứng dụng**:
   Trên Server:
   ```bash
   cd /root/nextjs
   docker compose up -d --build
   ```

## Bước 5: Cài đặt Nginx và SSL (HTTPS)
Để web chạy được qua cổng 443 (HTTPS), ta dùng Nginx làm Reverse Proxy.

1. **Cài đặt Nginx**:
   ```bash
   sudo apt install nginx -y
   ```
2. **Cấu hình Nginx**:
   Tạo file cấu hình: `sudo nano /etc/nginx/sites-available/lms`
   Dán nội dung sau vào:
   ```nginx
   server {
       listen 80;
       server_name daihoc.io.vn *.daihoc.io.vn;

       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. **Kích hoạt cấu hình**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Cài đặt SSL miễn phí (Certbot)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d daihoc.io.vn -d *.daihoc.io.vn
   ```
   *(Lưu ý: Để cài SSL cho wildcard `*.daihoc.io.vn`, Certbot có thể yêu cầu xác thực DNS tùy theo nhà cung cấp).*

## Bước 6: Kiểm tra
Mở trình duyệt và truy cập: **https://daihoc.io.vn**

---
**Ghi chú quan trọng**: Nếu server có tường lửa (Firewall), hãy nhớ mở các cổng **80** và **443**:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```
