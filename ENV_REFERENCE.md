# Environment Configuration Guide

Complete reference for environment variables used in the Member Management System.

## Overview

Environment variables are stored in `.env` files and loaded by Docker Compose and the applications.

- `.env.example` - Template with all available variables
- `.env.development` - Development configuration (created from example)
- `.env.production` - Production configuration (must be manually created)

## File Structure

```
member-mgmt-system/
├── .env.example          # Template (tracked in git)
├── .env.development      # Dev config (git-ignored, created on setup)
├── .env.production       # Prod config (git-ignored, create manually)
└── [services]
    ├── backend/
    └── frontend/
```

## Backend Environment Variables

### Application Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `APP_ENV` | string | Yes | `development` | Application environment: `development`, `staging`, `production` |
| `PORT` | integer | Yes | `8080` | Server port to bind |
| `LOG_LEVEL` | string | No | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### Database Configuration

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `POSTGRES_DB` | string | Yes | `member_mgmt` | Database name |
| `POSTGRES_USER` | string | Yes | `postgres` | Database user |
| `POSTGRES_PASSWORD` | string | Yes | `postgres` | Database password |
| `POSTGRES_HOST` | string | Yes | `postgres` | Database host (docker service name in compose) |
| `POSTGRES_PORT` | integer | Yes | `5432` | Database port |
| `DATABASE_URL` | string | Yes | `postgres://user:pass@host:5432/db` | Full database URL (auto-constructed or custom) |

**Development Values:**
```bash
POSTGRES_DB=member_mgmt_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgres://postgres:postgres@postgres:5432/member_mgmt_dev?sslmode=disable
```

**Production Values:**
```bash
POSTGRES_DB=member_mgmt_prod
POSTGRES_USER=mmgmt_db_prod
POSTGRES_PASSWORD=<strong-random-password-32+chars>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgres://mmgmt_db_prod:<strong-password>@postgres:5432/member_mgmt_prod?sslmode=require
```

### Security - JWT Authentication

| Variable | Type | Required | Length | Description |
|----------|------|----------|--------|-------------|
| `JWT_SECRET` | string | Yes | 32+ chars | Secret key for JWT signing |
| `JWT_REFRESH_SECRET` | string | Yes | 32+ chars | Secret key for refresh token signing |

**Development:**
```bash
JWT_SECRET=dev-secret-key-12345678901234567890
JWT_REFRESH_SECRET=dev-refresh-secret-12345678901234567890
```

**Production (MUST be changed!):**
Generate strong secrets:
```bash
# On Unix/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 127) }) -join ''))
```

### Storage - Cloudflare R2

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `R2_ACCOUNT_ID` | string | Yes | Cloudflare R2 account ID |
| `R2_ACCESS_KEY` | string | Yes | R2 API access key |
| `R2_SECRET_KEY` | string | Yes | R2 API secret key |
| `R2_BUCKET` | string | Yes | Bucket name (e.g., `member-mgmt-files`) |
| `R2_PUBLIC_URL` | string | Yes | Public CDN URL for downloads |

**Example:**
```bash
R2_ACCOUNT_ID=abc123def456
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET=member-mgmt-files-prod
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### Messaging - Line API

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `LINE_CHANNEL_ACCESS_TOKEN` | string | Yes | Line Messaging API channel token |

**Development:**
Leave empty or use test token

**Production:**
Get from Line Business Center:
1. Log in to Line Business Center
2. Navigate to Channel Settings
3. Copy "Channel Access Token"

```bash
LINE_CHANNEL_ACCESS_TOKEN=YOUR_CHANNEL_ACCESS_TOKEN
```

### CORS Configuration

| Variable | Type | Required | Format | Description |
|----------|------|----------|--------|-------------|
| `CORS_ORIGINS` | string | Yes | Comma-separated URLs | Allowed origins for CORS |

**Development:**
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Production:**
```bash
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Frontend Environment Variables

### API Configuration

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | string | Yes | `http://localhost:8080/api` | Backend API base URL (exposed to browser) |
| `NODE_ENV` | string | Yes | `development` or `production` | Node.js environment |

**Development:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NODE_ENV=development
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

### Optional: NextAuth (if using)

| Variable | Type | Description |
|----------|------|-------------|
| `NEXTAUTH_SECRET` | string | Secret for session token signing |
| `NEXTAUTH_URL` | string | Application URL |

## Docker Compose Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BACKEND_PORT` | integer | `8080` | Exposed backend port (host) |
| `FRONTEND_PORT` | integer | `3000` | Exposed frontend port (host) |
| `ADMINER_PORT` | integer | `8081` | Exposed adminer port (host) |
| `POSTGRES_PORT` | integer | `5432` | Exposed database port (host) |
| `NGINX_HTTP_PORT` | integer | `80` | Exposed HTTP port (production) |
| `NGINX_HTTPS_PORT` | integer | `443` | Exposed HTTPS port (production) |

## Setting Environment Variables

### Method 1: .env File (Most Common)

```bash
# Create from template
cp .env.example .env.development

# Edit with editor
nano .env.development  # or use VS Code, etc.

# Docker Compose auto-loads .env.development or .env
docker-compose up
```

### Method 2: Export Before Running

```bash
export JWT_SECRET=my-secret-key
export POSTGRES_PASSWORD=my-password
docker-compose up
```

### Method 3: Command Line Arguments

```bash
docker-compose run -e JWT_SECRET=my-secret backend
```

### Method 4: Docker Secrets (Production)

```yaml
services:
  backend:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
    name: mmgmt_jwt_secret
```

## Environment Validation

### Check Configuration Loading

**Backend:**
```bash
docker-compose exec backend env | grep -E 'JWT_SECRET|DATABASE_URL|CORS'
```

**Frontend:**
```bash
docker-compose exec frontend env | grep -E 'NEXT_PUBLIC_API_URL|NODE_ENV'
```

### Verify Database Connection

```bash
docker-compose exec backend curl -f http://localhost:8080/health
# Returns: {"status":"healthy"}
```

### Test Backend API

```bash
curl http://localhost:8080/api/health
```

## Common Configuration Scenarios

### Local Development with Hot Reload

```bash
APP_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/member_mgmt_dev?sslmode=disable
JWT_SECRET=dev-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Docker Development (Compose)

```bash
APP_ENV=development
DATABASE_URL=postgres://postgres:postgres@postgres:5432/member_mgmt_dev?sslmode=disable
# Services communicate via service names (postgres, backend, frontend) inside Docker network
```

### Production with External Database

```bash
APP_ENV=production
DATABASE_URL=postgres://user:pass@db.provider.com:5432/member_mgmt_prod?sslmode=require
# Update health check endpoint and monitoring
```

### Production with All Services in Docker

```bash
APP_ENV=production
DATABASE_URL=postgres://mmgmt_user:strong-pass@postgres:5432/member_mgmt_prod?sslmode=require
# Services communicate via Docker network
# Use secrets management for sensitive values
```

## Security Best Practices

### ✅ DO

- Use strong, randomly generated secrets in production
- Store sensitive variables in `.env` files (never in code)
- Use different secrets for dev/staging/production
- Rotate secrets periodically
- Use HTTPS in production (set via nginx config)
- Limit CORS origins to specific domains
- Use environment-specific configurations

### ❌ DON'T

- Commit `.env` or `.env.production` to git
- Use same secrets across environments
- Use weak or human-memorable secrets
- Log or print sensitive variables
- Share `.env` files via chat/email
- Use default passwords in production
- Expose secrets in Docker image layers

## Troubleshooting

### Services Can't Connect

**Problem:** Backend can't connect to database

**Solution:**
```bash
# Verify DATABASE_URL is correct
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec backend curl -f http://postgres:5432 || true
```

### API URL Unreachable

**Problem:** Frontend shows "Cannot reach API"

**Solution:**
```bash
# Check NEXT_PUBLIC_API_URL
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL

# Should be: http://localhost:8080/api (dev) or url from nginx (prod)
```

### Secret Mismatch

**Problem:** JWT verification fails

**Solution:**
```bash
# Verify backends use same secret
docker-compose exec backend env | grep JWT_SECRET
docker-compose exec frontend env | grep JWT

# Regenerate if needed:
# 1. Update .env.development
# 2. Restart services: make clean && make dev
```

### Permission Denied

**Problem:** Database/file permissions error

**Solution:**
```bash
# Check volume permissions
ls -la postgres_data/

# Reset volumes
docker-compose down -v
docker-compose up -d
```

## References

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Cloudflare R2 API](https://developers.cloudflare.com/r2/api/)
- [Line Messaging API](https://developers.line.biz/en/services/messaging-api/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)
- [Docker Compose .env File](https://docs.docker.com/compose/environment-variables/set-environment-variables/)
