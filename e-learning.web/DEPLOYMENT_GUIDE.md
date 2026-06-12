# 📋 Complete Deployment Guide - LMS Frontend

## Overview

This guide provides step-by-step instructions to deploy the LMS Frontend (Next.js) application to any server using Docker.

## 📁 Project Structure

```
e-learning.web/
├── Dockerfile                  # Multi-stage build
├── deploy/
│   ├── docker/
│   │   ├── .env.example       # Template (commit to git)
│   │   ├── .env               # Production config (DO NOT commit) 
│   │   ├── .env.dev           # Development config (DO NOT commit)
│   │   ├── docker-compose.yml # Production compose
│   │   └── docker-compose.dev.yml # Development compose
│   ├── nginx/
│   │   ├── lms-web.conf       # Production reverse proxy
│   │   └── lms-web-dev.conf   # Development reverse proxy
│   ├── scripts/
│   │   ├── setup.sh           # Initial setup & validation
│   │   ├── deploy-prod.sh     # Production deployment
│   │   └── deploy-dev.sh      # Development deployment
│   └── README.md              # This file
```

---

## 🚀 Quick Start - Development

### Step 1: Initial Setup

```bash
cd e-learning.web/deploy/scripts

# Run setup wizard (creates .env.dev from template)
./setup.sh dev

# Or manually create .env.dev
cp ../docker/.env.example ../docker/.env.dev
```

### Step 2: Start Development Server

```bash
./deploy-dev.sh up
```

### Step 3: Access Application

- **Via Nginx**: http://localhost:8080
- **Direct**: http://localhost:8081
- **Features**: Hot Module Reload (HMR) enabled

### Step 4: View Logs

```bash
./deploy-dev.sh logs
```

### Step 5: Stop When Done

```bash
./deploy-dev.sh down
```

---

## 🚀 Complete Deployment - Production

### Step 1: Prepare Environment Configuration

```bash
cd e-learning.web/deploy/docker

# Create .env from template
cp .env.example .env

# Edit with production values
nano .env
```

**Required values to update:**

```bash
# API endpoint (point to your backend server)
NEXT_PUBLIC_API_URL=http://103.159.51.19:5294

# Auth0 configuration (if using Auth0)
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-actual-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://your-domain.com/api/auth/callback

# Application
ENVIRONMENT=production
NODE_ENV=production
PORT=3000
```

### Step 2: Setup & Validate

```bash
cd deploy/scripts

# Run setup script
./setup.sh prod

# This will:
# ✓ Verify Docker & Docker Compose
# ✓ Check project structure
# ✓ Create .env from .env.example
# ✓ Validate configuration
# ✓ Make scripts executable
```

### Step 3: Build Docker Image

```bash
./deploy-prod.sh build

# This will:
# 1. Pull Node 20 Alpine image
# 2. Install dependencies
# 3. Build Next.js application
# 4. Create optimized production image (~400MB)
```

**Expected output:**
```
[INFO] Project root: /path/to/e-learning.web
[INFO] Building production Docker image...
...
[INFO] ✓ Build completed successfully
```

### Step 4: Start Production Deployment

```bash
./deploy-prod.sh up

# This will:
# 1. Start lms-web container (Next.js app)
# 2. Start nginx container (reverse proxy)
# 3. Perform health checks
# 4. Display access information
```

**Expected output:**
```
========================================
Production Server Ready! 🚀
========================================

Access points:
  • Via Nginx: http://localhost
  • Direct: http://localhost:3000

Container info:
CONTAINER ID   IMAGE            COMMAND
abc123...      lms-web:latest   npm start
def456...      nginx:alpine     nginx -g daemon
```

### Step 5: Verify Deployment

```bash
# Check container status
./deploy-prod.sh ps

# Test health endpoint
curl http://localhost/health

# View logs
./deploy-prod.sh logs
```

---

## 📝 Common Operations

### View Logs

```bash
# Production
./deploy-prod.sh logs

# Development
./deploy-dev.sh logs

# Specific container
docker logs lms-web

# With timestamps
docker logs -t lms-web

# Last 100 lines
docker logs --tail 100 lms-web
```

### Restart Application

```bash
# Quick restart
./deploy-prod.sh restart

# Full rebuild + restart
./deploy-prod.sh rebuild
```

### Update Code and Redeploy

```bash
# Automatic: git pull + build + restart
./deploy-prod.sh update

# Manual:
cd /path/to/e-learning.web
git pull origin main
./deploy/scripts/deploy-prod.sh rebuild
```

### Stop Deployment

```bash
./deploy-prod.sh down

# Verify stopped
docker ps | grep lms-web
# Should show nothing
```

### Check Container Status

```bash
# Quick status
./deploy-prod.sh ps

# Detailed info
docker inspect lms-web

# Resource usage
docker stats lms-web
```

---

## 🔧 Configuration Guide

### Environment Variables (`.env` file)

| Variable | Purpose | Example |
|----------|---------|---------|
| `ENVIRONMENT` | Deployment environment | `production`, `development` |
| `NODE_ENV` | Node environment | `production` |
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `http://103.159.51.19:5294` |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 tenant domain | `myapp.auth0.com` |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 application ID | `abc123XyZ...` |
| `NEXT_PUBLIC_AUTH0_REDIRECT_URI` | Auth0 callback URL | `http://myapp.com/api/auth/callback` |
| `NEXT_PUBLIC_IMAGE_DOMAIN` | Image optimization domain | `myapp.com` |
| `PORT` | Application port | `3000` |

### Nginx Configuration

**File**: `deploy/nginx/lms-web.conf`

Update for your domain:

```nginx
server {
    listen 80 default_server;
    # Change to your domain(s)
    # server_name myapp.com www.myapp.com;
    
    # ... rest of config
}
```

For SSL/HTTPS setup, see "SSL Certificate Setup" section below.

---

## 🔐 SSL Certificate Setup (HTTPS)

### Using Let's Encrypt (Recommended)

1. **Obtain certificate:**
   ```bash
   certbot certonly --standalone -d your-domain.com -d www.your-domain.com
   ```

2. **Update Nginx config** (`deploy/nginx/lms-web.conf`):
   ```nginx
   # Uncomment and update these lines:
   server {
       listen 443 ssl http2;
       server_name your-domain.com www.your-domain.com;
       
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

3. **Mount certificates in docker-compose.yml**:
   ```yaml
   volumes:
     - /etc/letsencrypt/live/your-domain.com:/etc/nginx/ssl:ro
   ```

4. **Restart nginx:**
   ```bash
   ./deploy-prod.sh restart
   ```

---

## 🐛 Troubleshooting

### Problem: Container won't start

```bash
# Check logs
./deploy-prod.sh logs

# Rebuild from scratch
./deploy-prod.sh clean
./deploy-prod.sh build
./deploy-prod.sh up
```

### Problem: Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Or port 80
lsof -i :80

# Kill the process (if safe)
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### Problem: Out of disk space

```bash
# Check disk usage
df -h

# Clean up old Docker images
docker image prune -a

# Remove old containers
docker container prune

# Remove unused volumes
docker volume prune
```

### Problem: API connection fails

```bash
# Verify API endpoint
grep NEXT_PUBLIC_API_URL deploy/docker/.env

# Test API connectivity
curl http://103.159.51.19:5294/health

# Check if backend is running on correct port
ssh user@server "docker ps | grep api"
```

### Problem: Health check failing

```bash
# Check app directly
curl http://localhost:3000/api/health

# Or via nginx
curl http://localhost/health

# Check container logs
docker logs lms-web
```

---

## 📊 Performance Monitoring

### Container Resources

```bash
# Real-time resource usage
docker stats lms-web

# One-time snapshot
docker inspect --format='{{.State}}, {{.Config.Image}}' lms-web
```

### Application Metrics

```bash
# Response time test
time curl http://localhost/

# Load test (simple)
for i in {1..100}; do
  curl -s http://localhost/ > /dev/null
done
echo "100 requests completed"

# More sophisticated testing
ab -n 1000 -c 10 http://localhost/
```

### Logs Analysis

```bash
# Show errors only
docker logs lms-web | grep -i error

# Count log lines
docker logs lms-web | wc -l

# Export logs to file
docker logs lms-web > logs.txt
```

---

## 🔄 Updates & Maintenance

### Regular Updates

```bash
# Pull latest code and redeploy automatically
cd deploy/scripts
./deploy-prod.sh update

# Or manually:
cd /path/to/e-learning.web
git pull origin main
./deploy/scripts/deploy-prod.sh rebuild
```

### Rollback to Previous Version

```bash
# List Docker images
docker images lms-web

# Stop current deployment
./deploy-prod.sh down

# Update docker-compose.yml to use previous tag
# e.g., change: lms-web:latest to lms-web:v1.0.0
nano deploy/docker/docker-compose.yml

# Restart with previous version
./deploy-prod.sh up
```

### Database Migrations

If your app has database migrations:

```bash
# Run before deploying new version
docker exec lms-web npm run migrate

# Then deploy
./deploy-prod.sh rebuild
```

---

## 🔄 Auto-Restart Configuration

The Docker compose file already has `restart: unless-stopped`, which means:

- Containers automatically restart if they crash
- Containers survive server reboot (requires Docker daemon auto-start)

To verify auto-restart is working:

```bash
# Stop container
docker stop lms-web

# It should auto-restart within seconds
sleep 5
docker ps | grep lms-web
```

---

## 📱 Deployment on Remote Server

### Initial Setup on Remote Server

1. **SSH to server:**
   ```bash
   ssh user@your-server.com
   ```

2. **Clone repository:**
   ```bash
   cd /home/production
   git clone https://github.com/your-org/lms_dev.git
   cd lms_dev/e-learning.web
   ```

3. **Run setup:**
   ```bash
   cd deploy/scripts
   ./setup.sh prod
   ```

4. **Edit production environment:**
   ```bash
   nano ../docker/.env
   ```

5. **Deploy:**
   ```bash
   ./deploy-prod.sh build
   ./deploy-prod.sh up
   ```

### Continuous Updates on Remote Server

```bash
# SSH to server
ssh user@your-server.com

# Navigate to app directory
cd /home/production/lms_dev/e-learning.web/deploy/scripts

# Update and redeploy (one command!)
./deploy-prod.sh update

# Check status
./deploy-prod.sh ps
```

---

## 💾 Backup & Disaster Recovery

### Backup Configuration

```bash
# Backup .env file (store securely!)
cp deploy/docker/.env deploy/docker/.env.backup
encrypt deploy/docker/.env.backup  # Or use your preferred encryption

# Backup Docker volume
docker run --rm -v lms-web-cache:/data -v $(pwd):/backup \
  alpine tar czf /backup/lms-web-cache.tar.gz -C /data .
```

### Restore from Backup

```bash
# Restore volume
docker volume rm lms-web-cache
docker run --rm -v lms-web-cache:/data -v $(pwd):/backup \
  alpine tar xzf /backup/lms-web-cache.tar.gz -C /data

# Restore environment
cp deploy/docker/.env.backup deploy/docker/.env

# Restart
./deploy-prod.sh restart
```

---

## 📞 Support & Documentation

- **Next.js**: https://nextjs.org/docs
- **Docker**: https://docs.docker.com/
- **Nginx**: https://nginx.org/en/docs/
- **Docker Compose**: https://docs.docker.com/compose/

---

## ✅ Deployment Checklist

### Before Initial Deployment

- [ ] Dockerfile is optimized (multi-stage build)
- [ ] `.env.example` has all required variables
- [ ] `.env` files are in `.gitignore`
- [ ] Docker & Docker Compose are installed on target server
- [ ] Backend API is running and accessible
- [ ] Domain name is configured (if using custom domain)
- [ ] SSL certificate is ready (if using HTTPS)

### Before Each Deployment

- [ ] Code is committed to git
- [ ] `.env` file is updated with correct production values
- [ ] Backend API URL is correct
- [ ] Docker build is successful locally
- [ ] Health checks pass after deployment
- [ ] Application loads without errors

### After Deployment

- [ ] Access frontend via browser
- [ ] Check that API calls work correctly
- [ ] Verify SSL certificate (if HTTPS)
- [ ] Monitor logs for errors
- [ ] Test key features (login, data loading, etc.)
- [ ] Check Docker stats for resource usage

---

## 📝 Key Points to Remember

1. **`.env.example`** = Template (commit to git)
2. **`.env`** = Actual config (DO NOT commit)
3. **Always run setup first** (`./setup.sh prod` or `./setup.sh dev`)
4. **Test in dev first** before deploying to production
5. **Monitor logs** regularly for issues
6. **Keep backups** of environment files
7. **Document** any custom configurations

---

**Last Updated**: May 5, 2026  
**Version**: 1.0.0
