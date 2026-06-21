# Member Management System - Deployment & Docker Guide

## Table of Contents

- [English Guide](#english-guide)
- [Thai Guide (คำแนะนำภาษาไทย)](#thai-guide)

---

## English Guide

### Quick Start

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v1.29+)
- [Make](https://www.gnu.org/software/make/) (optional, for convenient commands)

#### Development Setup

1. **Clone and Navigate**
   ```bash
   cd member-mgmt-system
   ```

2. **Create Environment Files**
   ```bash
   make setup
   # or manually:
   cp .env.example .env.development
   ```

3. **Start Development Environment**
   ```bash
   make dev
   ```
   
   This command will:
   - Start PostgreSQL database (port 5432)
   - Start Go backend with hot reload (port 8080)
   - Start Next.js frontend with hot reload (port 3000)
   - Start Adminer database UI (port 8081)

4. **Access Services**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Adminer (DB): http://localhost:8081
   - Default database: `member_mgmt`
   - Default user: `postgres` / `postgres`

5. **View Logs**
   ```bash
   make logs              # All services
   make logs-backend      # Backend only
   make logs-frontend     # Frontend only
   ```

#### Database Migrations

The migrations are automatically applied when PostgreSQL starts. If you need to manually apply them:

```bash
make migrate-up         # Run pending migrations
make migrate-down       # Rollback last migration
make seed              # Seed with default data (receipt types, admin user)
```

#### Stop Development Environment

```bash
make clean    # Stops all containers and removes volumes
make stop     # (if available) Just stops containers without removing volumes
```

### Production Deployment

#### Prerequisites for Production

- Docker and Docker Compose installed on server
- SSL certificates (for HTTPS)
- Cloudflare R2 account configured
- Line Messaging API credentials
- Strong secrets generated for JWT tokens
- Domain name configured

#### Production Setup

1. **Create Production Environment File**
   ```bash
   cp .env.example .env.production
   ```

2. **Configure Production Variables**
   
   Edit `.env.production` and update:
   ```bash
   # Database
   POSTGRES_DB=member_mgmt_prod
   POSTGRES_USER=<secure-username>
   POSTGRES_PASSWORD=<strong-password>
   
   # JWT Secrets (generate strong values!)
   JWT_SECRET=<32+ character strong secret>
   JWT_REFRESH_SECRET=<32+ character strong secret>
   
   # Cloudflare R2
   R2_ACCOUNT_ID=<your-account-id>
   R2_ACCESS_KEY=<your-access-key>
   R2_SECRET_KEY=<your-secret-key>
   R2_BUCKET=member-mgmt-files-prod
   R2_PUBLIC_URL=https://<your-cdn>.example.com
   
   # Line API
   LINE_CHANNEL_ACCESS_TOKEN=<your-token>
   
   # CORS Origins
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Frontend
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   ```

3. **Configure SSL Certificates**
   ```bash
   mkdir -p nginx/ssl
   cp /path/to/your/cert.pem nginx/ssl/
   cp /path/to/your/key.pem nginx/ssl/
   ```

4. **Build and Start Production**
   ```bash
   make prod-build
   make prod
   ```

5. **Verify Services are Running**
   ```bash
   docker ps
   docker logs mmgmt-backend-prod
   docker logs mmgmt-frontend-prod
   ```

### Environment Variables Reference

#### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `APP_ENV` | Yes | Application environment | `production`, `development` |
| `PORT` | Yes | Backend server port | `8080` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgres://user:pass@host/db` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | (generate strong value) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (min 32 chars) | (generate strong value) |
| `R2_ACCOUNT_ID` | Yes | Cloudflare R2 account ID | - |
| `R2_ACCESS_KEY` | Yes | Cloudflare R2 access key | - |
| `R2_SECRET_KEY` | Yes | Cloudflare R2 secret key | - |
| `R2_BUCKET` | Yes | R2 bucket name | `member-mgmt-files` |
| `R2_PUBLIC_URL` | Yes | Public R2 URL | `https://cdn.example.com` |
| `LINE_CHANNEL_ACCESS_TOKEN` | Yes | Line Messaging API token | - |
| `CORS_ORIGINS` | Yes | Allowed CORS origins (comma-separated) | `https://yourdomain.com` |

#### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | API endpoint URL | `http://localhost:8080/api` |
| `NODE_ENV` | Yes | Node environment | `development`, `production` |

### Makefile Commands

### Development Commands

```bash
make help              # Show all available commands
make dev               # Start development environment
make build             # Build production images
make restart           # Restart all services
make clean             # Stop containers and remove volumes

# Database
make migrate-up        # Run database migrations
make migrate-down      # Rollback migrations
make seed              # Seed database with default data
make db-shell          # Connect to PostgreSQL shell

# Logs
make logs              # View all service logs
make logs-backend      # View backend logs
make logs-frontend     # View frontend logs

# Backend
make backend-test      # Run backend tests
make backend-build     # Build backend binary
```

### Production Commands

```bash
make prod              # Start production environment
make prod-build        # Build production images
make prod-down         # Stop production environment
```

---

### Troubleshooting

#### Services Won't Start

1. **Check Docker is Running**
   ```bash
   docker ps
   ```

2. **View Logs**
   ```bash
   docker logs <service-name>
   ```

3. **Check Port Availability**
   ```bash
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

#### Database Connection Issues

1. **Restart Database**
   ```bash
   docker restart mmgmt-postgres
   ```

2. **Check PostgreSQL Health**
   ```bash
   docker exec mmgmt-postgres pg_isready
   ```

3. **Connect Manually**
   ```bash
   make db-shell
   ```

#### Frontend Not Connecting to Backend

1. **Check API URL**
   - Ensure `NEXT_PUBLIC_API_URL` is correct in `.env.development` or `.env`
   - Default: `http://localhost:8080/api`

2. **Check CORS**
   - Verify `CORS_ORIGINS` includes frontend URL
   - Backend should log CORS configuration

#### SSL Certificate Issues (Production)

1. **Verify Certificates**
   ```bash
   openssl x509 -in nginx/ssl/cert.pem -noout -text
   ```

2. **Update nginx config if needed**
   - Edit `nginx/nginx.prod.conf`
   - Uncomment SSL sections
   - Update certificate paths if different

---

## Thai Guide (คำแนะนำภาษาไทย)

### เริ่มต้นอย่างรวดเร็ว

#### ความต้องการ

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v1.29+)
- [Make](https://www.gnu.org/software/make/) (ใช้ร่วมกับคำสั่ง make ทีจะสะดวกขึ้น)

### ตั้งค่าการพัฒนา

1. **โคลนและนำทาง**
   ```bash
   cd member-mgmt-system
   ```

2. **สร้างไฟล์ Environment**
   ```bash
   make setup
   # หรือ:
   cp .env.example .env.development
   ```

3. **เริ่มสภาพแวดล้อมการพัฒนา**
   ```bash
   make dev
   ```

   คำสั่งนี้จะ:
   - เริ่ม PostgreSQL (พอร์ต 5432)
   - เริ่ม Go backend with hot reload (พอร์ต 8080)
   - เริ่ม Next.js frontend with hot reload (พอร์ต 3000)
   - เริ่ม Adminer database UI (พอร์ต 8081)

4. **เข้าถึงบริการ**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Adminer (DB): http://localhost:8081
   - ฐานข้อมูลเริ่มต้น: `member_mgmt`
   - ผู้ใช้เริ่มต้น: `postgres` / `postgres`

5. **ดูบันทึก**
   ```bash
   make logs              # บริการทั้งหมด
   make logs-backend      # Backend เท่านั้น
   make logs-frontend     # Frontend เท่านั้น
   ```

### การโยกย้ายฐานข้อมูล

การโยกย้ายจะถูกใช้โดยอัตโนมัติเมื่อ PostgreSQL เริ่มต้น หากต้องการใช้ด้วยตนเอง:

```bash
make migrate-up         # เรียกใช้การโยกย้ายที่รอคัย
make migrate-down       # ย้อนกลับการโยกย้ายครั้งสุดท้าย
make seed              # เก็บพืชด้วยข้อมูลเริ่มต้น
```

### หยุดสภาพแวดล้อมการพัฒนา

```bash
make clean    # หยุดคอนเทนเนอร์ทั้งหมดและลบปริมาณ
```

---

## Service Health Checks

All services in production include health checks:

```bash
# Backend health
curl http://localhost:8080/health

# Next.js frontend health  
curl http://localhost:3000/health

# Nginx (if in production)
curl http://localhost/health
```

## Logs and Monitoring

```bash
# View all logs with timestamps
docker-compose logs --timestamps

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs backend

# Container processes
docker-compose ps
```

## Backup and Restore

### PostgreSQL Backup

```bash
# Backup database
docker exec mmgmt-postgres pg_dump -U postgres member_mgmt > backup.sql

# Restore database
docker exec -i mmgmt-postgres psql -U postgres member_mgmt < backup.sql
```

### Docker Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect member-mgmt-system_postgres_data

# Backup volume
docker run --rm -v member-mgmt-system_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## Performance Optimization

### Docker Compose Development

For better performance during development:

1. Set appropriate resource limits in docker-compose.yml
2. Use named volumes instead of bind mounts where possible
3. Monitor with `docker stats`

### Production Best Practices

1. Use production-grade database backup solutions
2. Implement monitoring (Prometheus, DataDog, etc.)
3. Set up log aggregation (ELK, Splunk, etc.)
4. Use CDN for static assets
5. Implement rate limiting (done in nginx.prod.conf)
6. Use environment-specific secrets management

## Support

For issues or questions:

1. Check logs: `make logs`
2. Review `.env.development` or `.env.production` configuration
3. Verify all required services are running: `docker ps`
4. Check Docker and Docker Compose versions

---

**Last Updated:** 2024  
**Maintained by:** Development Team
