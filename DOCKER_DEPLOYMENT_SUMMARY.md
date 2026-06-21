# Docker & Deployment Configuration Summary

Complete deployment setup for Member Management System has been implemented.

## 📦 Files Created/Updated

### Docker Configuration

```
Dockerfile.backend              - Multi-stage Go build (dev/prod stages)
Dockerfile.frontend             - Multi-stage Next.js build (dev/prod stages)
docker-compose.yml              - Development environment orchestration
docker-compose.prod.yml         - Production environment orchestration
backend/.dockerignore           - Backend build optimization
frontend/.dockerignore          - Frontend build optimization
backend/.air.toml               - Hot reload configuration for Go
```

### Nginx Proxy Configuration

```
nginx/nginx.prod.conf           - Production nginx config (SSL, caching, compression)
nginx/nginx.dev.conf            - Development nginx config (simple proxy)
nginx/README.md                 - Nginx setup and configuration guide
```

### Environment Configuration

```
.env.example                    - Template with all environment variables
.env.development                - Development configuration (auto-created)
.env.production                 - Production configuration (manually created)
ENV_REFERENCE.md                - Complete environment variable documentation
```

### Build & Development Tools

```
Makefile                        - Build automation with 20+ commands
scripts/install.sh              - Installation and setup script
.devcontainer/devcontainer.json - GitHub Codespaces configuration
.devcontainer/post-create.sh    - Dev container setup script
```

### Documentation

```
QUICKSTART.md                   - 30-second quick start guide
DEPLOYMENT.md                   - Production deployment guide (Thai + English)
DOCKER.md                       - Docker architecture and best practices
```

## 🚀 Quick Start Commands

### Development (Local)

```bash
# One-command setup and start
make dev

# Or step-by-step
make setup       # Create .env.development and install deps
make build       # Build Docker images
make dev         # Start services

# Monitor
make logs        # View all logs
make logs-backend
make logs-frontend

# Stop
make clean       # Stop and remove volumes
```

### Production

```bash
# Preparation
cp .env.example .env.production
# Edit .env.production with production values

# Setup certificates
mkdir -p nginx/ssl
cp /path/to/cert.pem nginx/ssl/
cp /path/to/key.pem nginx/ssl/

# Deploy
make prod-build  # Build production images
make prod        # Start services

# Monitoring
docker logs mmgmt-backend-prod
docker logs mmgmt-frontend-prod
docker stats
```

## 🐳 Service Architecture

### Development (docker-compose.yml)

5 services:
1. **postgres** - PostgreSQL 16 with health check
2. **backend** - Go app with hot reload via Air
3. **frontend** - Next.js dev server with hot reload
4. **adminer** - Database admin UI for development
5. **nginx** (optional) - Reverse proxy

Features:
- Volume mounts for hot reload
- Exposed ports (5432, 8080, 3000, 8081)
- Health checks on all services
- Automatic service startup order

### Production (docker-compose.prod.yml)

4 services:
1. **postgres** - PostgreSQL 16 with persistent volume
2. **backend** - Compiled Go binary (prod stage)
3. **frontend** - Optimized Next.js build (prod stage)
4. **nginx** - Reverse proxy with SSL/TLS

Features:
- Multi-stage builds (minimal image size)
- Non-root users (security)
- Health checks for orchestration
- Read-only filesystems
- Capability dropping
- Always-restart policies
- Environment-based configuration

## 🔐 Security Features

### Authentication & Secrets

```bash
# Backend
- JWT tokens (15m access, 7d refresh)
- Strong secret keys (32+ characters)
- HttpOnly cookies for tokens

# Frontend
- React Query for server state
- Zustand for client state
- Automatic token refresh on 401
```

### Infrastructure Security

```bash
# Production only
- Non-root users (appuser, nextjs)
- Linux capabilities dropped (CAP_DROP: ALL)
- Read-only filesystems
- Network isolation (bridge)
- Security headers (X-Frame-Options, etc.)
- Rate limiting (nginx)
- HTTPS/TLS support
```

## 📊 Health Checks

All services have health checks:

```bash
# PostgreSQL
pg_isready check every 10s (dev), 30s (prod)

# Backend
curl /health endpoint every 10s (dev), 30s (prod)

# Frontend  
HTTP GET health check every 30s (prod)

# Nginx
wget health endpoint every 30s (prod)
```

View health status:
```bash
docker inspect mmgmt-backend --format='{{.State.Health.Status}}'
```

## 🛠️ Environment Variables

### Minimal Setup (Development)

```bash
# Database
POSTGRES_DB=member_mgmt_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT (any value works for dev)
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh

# API
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Full Setup (Production)

All of above plus:
```bash
# Database (production)
POSTGRES_USER=<secure-user>
POSTGRES_PASSWORD=<strong-32char-password>

# JWT (MUST be changed!)
JWT_SECRET=<strong-32char-secret>
JWT_REFRESH_SECRET=<strong-32char-secret>

# R2 Storage
R2_ACCOUNT_ID=<id>
R2_ACCESS_KEY=<key>
R2_SECRET_KEY=<secret>
R2_BUCKET=member-mgmt-files-prod
R2_PUBLIC_URL=https://r2.yourdomain.com

# Line API
LINE_CHANNEL_ACCESS_TOKEN=<token>

# CORS
CORS_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

See [ENV_REFERENCE.md](ENV_REFERENCE.md) for complete variable list.

## 📈 Performance Optimizations

### Backend
- Multi-stage build (full toolchain → Alpine minimal runtime)
- Compiled binary only (no source code)
- Read-only filesystem with tmpfs
- Health checks for orchestration

### Frontend
- Multi-stage build (full deps → optimized runner)
- Next.js static generation
- Gzip compression
- 30-day asset caching
- Optimized node_modules (production deps only)

### Nginx
- Gzip compression (level 6)
- Static asset caching (30 days)
- Rate limiting (10 req/s API, 30 req/s general)
- Connection pooling
- Buffer optimization

## 🔄 Development Workflow

### Hot Reload

**Backend:**
- Air monitors `.go` files
- Automatically rebuilds and restarts
- Change detection < 1 second

**Frontend:**
- Next.js dev server
- Module hot reloading
- Change detection < 500ms

**Database:**
- Mount migrations read-only
- New migrations auto-applied on container start

### Testing

```bash
# Backend tests
make backend-test

# Frontend tests
make frontend-test

# Both
make test
```

### Building

```bash
# Development image
docker-compose build backend

# Production image
docker build --target prod -t mmgmt-backend:prod backend/
```

## 📤 Deployment Steps

### Local Development

1. `make dev` - Start everything
2. Services available on localhost:3000, 8080
3. Changes auto-reload
4. `make clean` - Stop and cleanup

### Staging/Production

1. Create `.env.production` from `.env.example`
2. Set all required variables
3. Setup SSL certificates in `nginx/ssl/`
4. `make prod-build` - Build production images
5. `make prod` - Start production services
6. Monitor with `docker logs` and `docker stats`

### Continuous Deployment (CD)

```bash
# In your CI/CD pipeline:

# 1. Build images
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. Push to registry (optional)
docker tag mmgmt-backend:latest myregistry.io/mmgmt-backend:latest
docker push myregistry.io/mmgmt-backend:latest

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations (if needed)
docker-compose exec backend /app/server migrate up

# 5. Monitor health
docker-compose ps
docker stats
```

## 🐛 Troubleshooting

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :3000          # Unix/Mac
netstat -ano | findstr :3000  # Windows

# Change in .env
BACKEND_PORT=8081
FRONTEND_PORT=3001
```

### Container Won't Start

```bash
docker-compose logs backend
docker inspect mmgmt-backend
docker-compose exec backend /bin/sh  # Debug shell
```

### Database Connection Fails

```bash
docker logs mmgmt-postgres
docker-compose exec postgres pg_isready
```

### Frontend Can't Reach Backend

```bash
# Check NEXT_PUBLIC_API_URL in .env
# Should be http://localhost:8080/api (dev) or proxy URL (prod)

curl http://localhost:8080/health  # Verify backend is running
```

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| Dockerfile.backend | Define Go build process |
| Dockerfile.frontend | Define Next.js build process |
| docker-compose.yml | Orchestrate dev services |
| docker-compose.prod.yml | Orchestrate prod services |
| Makefile | Development commands |
| QUICKSTART.md | Get started quick |
| DEPLOYMENT.md | Production guide |
| DOCKER.md | Architecture details |
| ENV_REFERENCE.md | Variable documentation |
| nginx/*.conf | Proxy configuration |

## 🔗 Related Documentation

- [DOCKER.md](DOCKER.md) - Complete Docker architecture guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment procedures
- [ENV_REFERENCE.md](ENV_REFERENCE.md) - All environment variables
- [nginx/README.md](nginx/README.md) - Nginx configuration
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide

## 📝 Version Information

- **Go:** 1.22-alpine
- **Node.js:** 18-alpine  
- **PostgreSQL:** 16-alpine
- **Nginx:** alpine
- **Docker:** 20.10+ required
- **Docker Compose:** 1.29+ required
- **Alpine Linux:** 3.19

## 🎯 Next Steps

1. **Setup Development**
   - Run `make dev`
   - Access http://localhost:3000

2. **Configure Production**
   - Create `.env.production`
   - Setup SSL certificates
   - Configure domain DNS

3. **Deploy**
   - Run `make prod-build && make prod`
   - Monitor with `make logs` and `docker stats`

4. **Monitor & Maintain**
   - Setup log aggregation
   - Configure backups
   - Monitor performance metrics

---

**Last Updated:** 2024  
**Docker & Deployment Configuration:** Complete ✅
