.PHONY: help dev build prod migrate-up migrate-down seed test clean docker-up docker-down docker-logs docker-clean logs restart push

# Variables
DOCKER_COMPOSE=docker-compose
DOCKER_COMPOSE_DEV=docker-compose.yml
DOCKER_COMPOSE_PROD=docker-compose.prod.yml
ENV_FILE=.env.development
POSTGRES_CONTAINER=mmgmt-postgres
BACKEND_CONTAINER=mmgmt-backend
FRONTEND_CONTAINER=mmgmt-frontend

# Color output
CYAN=\033[0;36m
GREEN=\033[0;32m
YELLOW=\033[0;33m
NC=\033[0m # No Color

help:
	@echo ""
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║  Member Management System - Available Commands             ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  $(CYAN)make dev$(NC)              - Start development environment (docker-compose up)"
	@echo "  $(CYAN)make build$(NC)            - Build production images"
	@echo "  $(CYAN)make restart$(NC)          - Restart all services"
	@echo "  $(CYAN)make clean$(NC)            - Clean up containers and volumes"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  $(CYAN)make migrate-up$(NC)       - Run pending database migrations"
	@echo "  $(CYAN)make migrate-down$(NC)     - Rollback last migration"
	@echo "  $(CYAN)make seed$(NC)             - Seed database with default data"
	@echo "  $(CYAN)make db-shell$(NC)         - Connect to PostgreSQL shell"
	@echo ""
	@echo "$(GREEN)Backend:$(NC)"
	@echo "  $(CYAN)make backend-test$(NC)     - Run backend tests"
	@echo "  $(CYAN)make backend-build$(NC)    - Build backend binary locally"
	@echo ""
	@echo "$(GREEN)Frontend:$(NC)"
	@echo "  $(CYAN)make frontend-install$(NC) - Install frontend dependencies"
	@echo "  $(CYAN)make frontend-lint$(NC)    - Run frontend linter"
	@echo "  $(CYAN)make frontend-test$(NC)    - Run frontend tests"
	@echo ""
	@echo "$(GREEN)Docker Compose:$(NC)"
	@echo "  $(CYAN)make logs$(NC)             - View logs from all services"
	@echo "  $(CYAN)make logs-backend$(NC)     - View backend logs"
	@echo "  $(CYAN)make logs-frontend$(NC)    - View frontend logs"
	@echo "  $(CYAN)make ps$(NC)               - List all services status"
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@echo "  $(CYAN)make prod$(NC)             - Start production environment (docker-compose.prod.yml)"
	@echo "  $(CYAN)make prod-build$(NC)       - Build production environment"
	@echo "  $(CYAN)make prod-down$(NC)        - Stop production environment"
	@echo ""
	@echo ""

# Development
.PHONY: dev
dev: check-env
	@echo "$(GREEN)Starting development environment...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) up -d
	@echo "$(GREEN)✓ Development environment started$(NC)"
	@echo ""
	@echo "  Backend:   http://localhost:8080"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Adminer:   http://localhost:8081"
	@echo ""
	@echo "Run '$(CYAN)make logs$(NC)' to view logs"

.PHONY: build
build:
	@echo "$(GREEN)Building production images...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: restart
restart:
	@echo "$(YELLOW)Restarting services...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

.PHONY: clean
clean:
	@echo "$(YELLOW)Cleaning up development environment...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) down -v
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# Database
.PHONY: migrate-up
migrate-up:
	@echo "$(GREEN)Running migrations...$(NC)"
	docker exec $(BACKEND_CONTAINER) /app/server migrate up
	@echo "$(GREEN)✓ Migrations complete$(NC)"

.PHONY: migrate-down
migrate-down:
	@echo "$(YELLOW)Rolling back migrations...$(NC)"
	docker exec $(BACKEND_CONTAINER) /app/server migrate down
	@echo "$(GREEN)✓ Rollback complete$(NC)"

.PHONY: seed
seed:
	@echo "$(GREEN)Seeding database...$(NC)"
	docker exec $(POSTGRES_CONTAINER) psql -U postgres -d member_mgmt -f /docker-entrypoint-initdb.d/011_seed_receipt_types.up.sql
	docker exec $(POSTGRES_CONTAINER) psql -U postgres -d member_mgmt -f /docker-entrypoint-initdb.d/012_seed_default_admin.up.sql
	@echo "$(GREEN)✓ Database seeded$(NC)"

.PHONY: db-shell
db-shell:
	docker exec -it $(POSTGRES_CONTAINER) psql -U postgres -d member_mgmt

# Backend
.PHONY: backend-test
backend-test:
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd backend && go test -v ./...
	@echo "$(GREEN)✓ Tests complete$(NC)"

.PHONY: backend-build
backend-build:
	@echo "$(GREEN)Building backend binary...$(NC)"
	cd backend && CGO_ENABLED=1 GOOS=linux go build -o ../bin/server ./cmd/server/main.go
	@echo "$(GREEN)✓ Build complete$(NC)"

# Frontend
.PHONY: frontend-install
frontend-install:
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd frontend && npm ci
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: frontend-lint
frontend-lint:
	@echo "$(GREEN)Running frontend linter...$(NC)"
	cd frontend && npm run lint
	@echo "$(GREEN)✓ Lint complete$(NC)"

.PHONY: frontend-test
frontend-test:
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd frontend && npm test
	@echo "$(GREEN)✓ Tests complete$(NC)"

# Docker Logs
.PHONY: logs
logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) logs -f

.PHONY: logs-backend
logs-backend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) logs -f $(BACKEND_CONTAINER)

.PHONY: logs-frontend
logs-frontend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) logs -f $(FRONTEND_CONTAINER)

.PHONY: ps
ps:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_DEV) ps

# Production
.PHONY: prod
prod: check-env-prod
	@echo "$(GREEN)Starting production environment...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD) up -d
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@echo ""
	@echo "  Frontend:  http://localhost"
	@echo "  Backend:   http://localhost/api"
	@echo ""

.PHONY: prod-build
prod-build: check-env-prod
	@echo "$(GREEN)Building production environment...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD) build --no-cache
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: prod-down
prod-down:
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_PROD) down
	@echo "$(GREEN)✓ Stopped$(NC)"

# Setup
.PHONY: check-env
check-env:
	@if [ ! -f .env.development ]; then \
		echo "$(YELLOW)Creating .env.development from .env.example...$(NC)"; \
		cp .env.example .env.development; \
		echo "$(GREEN)✓ .env.development created. Please update if needed.$(NC)"; \
	fi

.PHONY: check-env-prod
check-env-prod:
	@if [ ! -f .env.production ]; then \
		echo "$(YELLOW)ERROR: .env.production not found!$(NC)"; \
		echo "Please create .env.production from .env.example and update with production values."; \
		exit 1; \
	fi

.PHONY: setup
setup: check-env frontend-install
	@echo "$(GREEN)Development environment setup complete!$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Update .env.development with your configuration"
	@echo "  2. Run '$(CYAN)make dev$(NC)' to start services"
	@echo "  3. Run '$(CYAN)make logs$(NC)' to view logs"
	@echo ""

# Utility
.PHONY: version
version:
	@echo "Backend Go version:"; go version
	@echo "Frontend Node version:"; node --version npm --version
	@echo "Docker version:"; docker --version
	@echo "Docker Compose version:"; docker-compose --version

logs-db:
	docker-compose logs -f postgres

# Utility
db-shell:
	docker-compose exec postgres psql -U postgres -d member_mgmt

format:
	cd backend && go fmt ./...
	cd frontend && npm run format

tidy:
	cd backend && go mod tidy

all: setup build

.DEFAULT_GOAL := help
