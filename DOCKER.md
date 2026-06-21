# Docker Architecture Guide

Complete guide to Docker setup for Member Management System.

## Overview

The system uses:
- **Multi-stage Docker builds** for optimized production images
- **Docker Compose** for orchestrating services (development and production)
- **Health checks** to monitor service status
- **Environment variables** for flexible configuration
- **Volumes** for data persistence and development hot reload

## Docker Images

### Backend (Go)

#### Development Stage
- **Base Image:** `golang:1.22-alpine`
- **Features:**
  - Hot reload with Air
  - Full source code mounted
  - Development ports exposed
  - Used for development and debugging
- **Environment:** `target: dev`

#### Production Stage
- **Base Image:** `alpine:3.19`
- **Features:**
  - Compiled binary only
  - Minimal runtime (~30MB vs ~800MB for dev)
  - Non-root user (appuser:appuser)
  - Health checks enabled
  - Read-only filesystem with tmpfs
  - Dropped Linux capabilities
- **Environment:** `target: prod`

### Frontend (Next.js)

#### Development Stage
- **Base Image:** `node:18-alpine`
- **Features:**
  - Hot module reloading
  - Full source code mounted
  - Used with `npm run dev`
- **Environment:** `target: dev`

#### Production Stage
- **Base Image:** `node:18-alpine`
- **Features:**
  - Optimized build output
  - Non-root user (nextjs:nextjs)
  - Production dependencies only
  - Health checks enabled
  - Read-only filesystem with tmpfs
- **Environment:** `target: prod`

## Multi-Stage Builds

### Why Multi-Stage?

1. **Reduced Image Size**
   - Development: Full Go toolchain (~800MB) → Production: Binary only (~30MB)
   - Reduces storage and transfer bandwidth

2. **Security**
   - Production images contain only runtime requirements
   - No source code or build tools exposed
   - Non-root users prevent privilege escalation

3. **Build Performance**
   - Separates build dependencies from runtime
   - Faster container startup in production
   - Can target different stages during development

### Backend Build Process

```
Stage 1: Builder (golang:1.22-alpine)
├── Install build dependencies (gcc, musl-dev)
├── Download Go mod dependencies
├── Copy source code
└── Compile binary (CGO_ENABLED=1)

Stage 2: Development (golang:1.22-alpine)
├── Install development tools (air)
├── Copy full source code
└── Run with hot reload

Stage 3: Production (alpine:3.19)
├── Copy compiled binary from Stage 1
├── Create non-root user
└── Run with minimal footprint
```

### Frontend Build Process

```
Stage 1: Dependencies (node:18-alpine)
├── Copy package.json/package-lock.json
└── Run npm ci

Stage 2: Builder (node:18-alpine)
├── Copy sources
├── Build with Next.js
└── Generate .next folder

Stage 3: Development (node:18-alpine)
├── Copy full source
└── Run npm run dev

Stage 4: Production (node:18-alpine)
├── Copy .next folder from Stage 2
├── Copy public folder
├── Install production dependencies only
├── Create non-root user
└── Run npm start
```

## Docker Compose Configurations

### Development (`docker-compose.yml`)

**Services:**
- **postgres**: PostgreSQL 16 with health check
- **backend**: Go service with Air hot reload
- **frontend**: Next.js dev server
- **adminer**: Database UI for development
- **nginx** (optional): Reverse proxy

**Key Features:**
- Volume mounts for code changes (hot reload)
- Exposed ports for local access (5432, 8080, 3000, 8081)
- Health checks for all services
- Dependencies ensure startup order
- Network isolation with bridge network

**Starting Development:**
```bash
docker-compose up -d
```

### Production (`docker-compose.prod.yml`)

**Services:**
- **postgres**: PostgreSQL 16 (persistent volume)
- **backend**: Compiled Go binary
- **frontend**: Optimized Next.js build
- **nginx**: Reverse proxy and load balancer

**Key Features:**
- No volume mounts (uses compiled artifacts only)
- Environment variables from `.env.production`
- Security options (no-new-privileges)
- Capability dropping (CAP_DROP: ALL, CAP_ADD: NET_BIND_SERVICE)
- Read-only filesystems with tmpfs for temp files
- Always-on restart policies
- Non-root users
- Health checks for container scheduling

**Starting Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Health Checks

All services include health checks:

### PostgreSQL
```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U postgres']
  interval: 10s
  timeout: 5s
  retries: 5
```

### Backend (Go)
```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']
  interval: 30s (prod), 10s (dev)
  timeout: 10s (prod), 5s (dev)
  retries: 3 (prod), 5 (dev)
```

### Frontend (Next.js)
```yaml
healthcheck:
  test: ['CMD', 'node', '-e', '...']  # HTTP GET to /health
  interval: 30s
  timeout: 10s
  retries: 3
```

### Nginx
```yaml
healthcheck:
  test: ['CMD', 'wget', '--quiet', '--spider', 'http://localhost/health']
  interval: 30s
  timeout: 10s
  retries: 3
```

**Check Status:**
```bash
docker inspect mmgmt-backend --format='{{.State.Health.Status}}'
# Returns: starting, healthy, unhealthy
```

## Environment Variables

### Development (`.env.development`)

```bash
# Application
APP_ENV=development
PORT=8080

# Database
POSTGRES_DB=member_mgmt_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT Secrets
JWT_SECRET=dev-jwt-secret-...
JWT_REFRESH_SECRET=dev-refresh-secret-...

# R2 Storage (optional)
R2_ACCOUNT_ID=
R2_ACCESS_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Production (`.env.production`)

```bash
# Application
APP_ENV=production
PORT=8080

# Database
POSTGRES_DB=member_mgmt_prod
POSTGRES_USER=mmgmt_db_user
POSTGRES_PASSWORD=<strong-password>

# JWT Secrets (must be changed!)
JWT_SECRET=<strong-32char-secret>
JWT_REFRESH_SECRET=<strong-32char-secret>

# R2 Storage (required)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Volume Management

### PostgreSQL Data

```yaml
volumes:
  postgres_data:
    driver: local
```

**Backup:**
```bash
docker exec mmgmt-postgres pg_dump -U postgres member_mgmt > backup.sql
```

**Restore:**
```bash
docker exec -i mmgmt-postgres psql -U postgres member_mgmt < backup.sql
```

### Development Volume Mounts

```yaml
volumes:
  - ./backend:/app           # Source code
  - /app/tmp                # Ignore tmp directory
  - ./frontend:/app          # Frontend source
  - /app/.next              # Ignore build output
  - /app/node_modules       # Ignore dependencies
```

## Networking

### Bridge Network: `member-network`

All services communicate via internal DNS:
- `postgres:5432` → PostgreSQL
- `backend:8080` → Go backend
- `frontend:3000` → Next.js frontend
- `nginx:80` → Nginx proxy

**External Access:**
- Port 5432 → PostgreSQL (dev only)
- Port 8080 → Backend API
- Port 3000 → Frontend (dev only)
- Port 80/443 → Nginx (prod only)

## Security Best Practices

### Production Only

1. **Non-root Users**
   - Backend: appuser (UID 1000)
   - Frontend: nextjs (UID 1001)

2. **Capability Dropping**
   ```yaml
   cap_drop:
     - ALL
   cap_add:
     - NET_BIND_SERVICE  # Only bind to ports
   ```

3. **Read-only Filesystem**
   ```yaml
   read_only: true
   tmpfs:
     - /tmp              # Temporary directory
   ```

4. **Security Options**
   ```yaml
   security_opt:
     - no-new-privileges:true
   ```

5. **Environment Secrets**
   - Never commit `.env.production`
   - Use strong JWT secrets (32+ characters)
   - Use different DB passwords than development
   - Use secrets management for production (Docker Secrets, Vault, etc.)

## Building and Running

### Quick Commands

```bash
# Development
make dev               # Start with docker-compose.yml

# Production
make prod              # Start with docker-compose.prod.yml
make prod-build        # Build production images

# Logs and Monitoring
make logs              # View all logs
make logs-backend      # Backend logs only
docker stats           # Real-time resource usage
```

### Manual Docker Commands

```bash
# Build specific stage
docker build --target prod -t mmgmt-backend:prod ./backend

# Run container
docker run -e DATABASE_URL=... mmgmt-backend:prod

# Push to registry
docker tag mmgmt-backend:prod myregistry.io/mmgmt-backend:prod
docker push myregistry.io/mmgmt-backend:prod
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs mmgmt-backend

# Inspect container
docker inspect mmgmt-backend

# Check health
docker inspect mmgmt-backend --format='{{.State.Health}}'
```

### Port Conflicts

```bash
# Find process using port
lsof -i :8080

# Change in .env or docker-compose
BACKEND_PORT=8081
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused images/containers
docker system prune -a --volumes

# Remove specific image
docker rmi mmgmt-backend:latest
```

### Memory Issues

```bash
# Check resource usage
docker stats

# Limit memory in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## Performance Optimization

### Development
- Hot reload enabled (Air for Go, next/dev for Next.js)
- Source code mounted (instant updates)
- All ports exposed for debugging

### Production
- Compiled binaries only
- Multi-stage builds (smaller images)
- Non-root users (security)
- Health checks (automatic recovery)
- Gzip compression (smaller responses)
- Rate limiting (nginx)
- Caching (static assets)

## References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Alpine Linux](https://alpinelinux.org/) (minimal base image)
