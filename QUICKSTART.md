# Quick Start Guide - Member Management System

## ⚡ 30-Second Start

```bash
# 1. Clone or enter directory
cd member-mgmt-system

# 2. Start everything
make dev

# 3. Access services
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Database: http://localhost:8081 (Adminer)
```

**Done!** The system is running with hot reload enabled.

---

## 📋 Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (1.29+)
- Terminal/Command Prompt
- Optional: [Make](https://www.gnu.org/software/make/) (for convenient commands)

## 🚀 Development Setup

### Option 1: Using Make (Recommended)

```bash
# Setup and start
make setup
make dev

# View logs
make logs

# Stop
make clean
```

### Option 2: Manual Commands

```bash
# Copy environment file
cp .env.example .env.development

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🛑 Stop Services

```bash
make clean          # Stop and remove volumes
docker-compose stop # Stop without removing
```

## 🔄 Common Operations

### View Logs
```bash
make logs              # All services
make logs-backend      # Backend only
make logs-frontend     # Frontend only
```

### Database Access
```bash
# Via Adminer UI
http://localhost:8081
# User: postgres
# Password: postgres (from .env.development)

# Via Command Line
make db-shell
```

### Run Migrations
```bash
make migrate-up       # Apply pending migrations
make migrate-down     # Rollback last migration
make seed            # Seed with default data
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# View service logs
docker-compose logs

# Verify ports are available
# Port 5432 (PostgreSQL), 8080 (Backend), 3000 (Frontend)
```

### Cannot connect to database
```bash
# Restart database
docker-compose restart postgres

# Check health
docker inspect mmgmt-postgres --format='{{.State.Health.Status}}'
```

### Frontend can't reach backend
```bash
# Check API URL in .env.development
# Should be: http://localhost:8080/api

# Verify backend is running
curl http://localhost:8080/health
```

## 📁 Project Structure

```
member-mgmt-system/
├── backend/              # Go API server
│   ├── cmd/server/      # Entry point
│   ├── internal/        # Business logic
│   ├── migrations/      # Database migrations
│   └── Dockerfile.backend
├── frontend/            # Next.js web app
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── lib/             # Utilities and API
│   └── Dockerfile.frontend
├── nginx/               # Reverse proxy config
├── docker-compose.yml   # Dev environment
├── docker-compose.prod.yml  # Prod environment
└── Makefile             # Build automation
```

## 🔐 Environment Variables

### Development (`.env.development`)

Key variables that might need updating:

```bash
# Database
POSTGRES_DB=member_mgmt_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT Secrets (for development, any value works)
JWT_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh-secret

# Frontend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 📊 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:8080 | REST API |
| Adminer | http://localhost:8081 | Database admin UI |
| PostgreSQL | localhost:5432 | Database (internal) |

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [DOCKER.md](DOCKER.md) - Docker architecture details
- [nginx/README.md](nginx/README.md) - Nginx configuration
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - API documentation

## 🔗 Helpful Commands

```bash
# Status
docker-compose ps          # Show all services

# Logs
docker-compose logs -f backend    # Follow backend logs
docker-compose logs --tail=50     # Last 50 lines

# Exec
docker-compose exec backend sh    # Shell into backend
docker-compose exec frontend sh   # Shell into frontend

# Clean
docker-compose down -v            # Remove everything

# Rebuild
docker-compose build --no-cache   # Rebuild images
```

## 🎯 Next Steps

1. **For Development:**
   - Review `/frontend/README.md` for frontend setup
   - Check `/backend/README.md` for backend setup
   - See `FRONTEND_IMPLEMENTATION_GUIDE.md` for feature details

2. **For Deployment:**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Setup `.env.production`
   - Configure SSL certificates
   - Use `make prod` to deploy

3. **For Contributing:**
   - See [CONTRIBUTING.md](CONTRIBUTING.md)
   - Follow project conventions
   - Submit PRs with documentation

## ❓ FAQ

**Q: How do I change the database name?**
```bash
# Edit .env.development
POSTGRES_DB=my_database

# Restart
make clean && make dev
```

**Q: How do I use my own database?**
```bash
# Edit DATABASE_URL in .env.development
DATABASE_URL=postgres://user:pass@external-host:5432/db

# Set POSTGRES_USER/PASSWORD if using Docker postgres
```

**Q: Can I run backend/frontend separately?**
```bash
# Backend
cd backend && go run ./cmd/server/main.go

# Frontend
cd frontend && npm run dev
```

**Q: How do I debug the backend?**
```bash
# View logs
make logs-backend

# Or attach debugger on hot-reload port
# (see backend README for details)
```

## 🆘 Support

For issues:
1. Check logs: `make logs`
2. Review `.env.development` configuration
3. Verify Docker is running
4. Verify ports are available (5432, 8080, 3000)

---

**Happy Coding!** 🚀
make db-shell
# or
docker-compose exec postgres psql -U postgres -d member_mgmt
```

### Stop Services

```bash
docker-compose down
```

### Stop Services & Clean Data

```bash
make docker-clean
```

## Development

### Backend Development

```bash
# Run backend locally (requires PostgreSQL running)
cd backend
go mod download
go run ./cmd/server/main.go
```

### Frontend Development

```bash
# Run frontend locally
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Port Already in Use

If ports 3000, 8080, or 5432 are in use:

```bash
# Edit docker-compose.yml and change ports
# e.g., "3001:3000" instead of "3000:3000"
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Frontend Can't Connect to Backend

- Check backend is running: `docker-compose ps`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS configuration in backend

### Out of Memory

```bash
# Increase Docker memory limit in Docker Desktop settings
# Or run services separately:
docker-compose up database
docker-compose up backend
docker-compose up frontend
```

## Next Steps

1. **Read the documentation**
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API.md](API.md) - API documentation
   - [README.md](README.md) - Project overview

2. **Explore the code**
   - Backend: `backend/internal/`
   - Frontend: `frontend/app/`

3. **Start developing**
   - See [CONTRIBUTING.md](CONTRIBUTING.md)

4. **Run tests**
   - `make backend-test`

## Getting Help

- Check existing documentation
- Search GitHub issues
- Create a new issue with details

Happy coding! 🚀
