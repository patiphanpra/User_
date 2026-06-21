# Backend README

Go-based REST API for Member Management System

## Project Structure

```
backend/
├── cmd/server/          # Main application
├── internal/
│   ├── config/          # Configuration
│   ├── handlers/        # HTTP handlers
│   ├── middleware/      # Gin middleware
│   ├── models/          # Data models
│   ├── repository/      # Data access
│   ├── service/         # Business logic
│   └── utils/           # Utilities
├── pkg/
│   ├── auth/            # JWT manager
│   ├── database/        # DB connection
│   └── storage/         # R2 client
└── migrations/          # SQL migrations
```

## Quick Start

### Local Development
```bash
# Install dependencies
go mod download

# Run server
go run ./cmd/server/main.go

# Run tests
go test ./...
```

### Docker
```bash
docker build -f ../Dockerfile.backend -t member-mgmt-backend .
docker run -p 8080:8080 --env-file ../.env.local member-mgmt-backend
```

## API Routes

### Authentication
```
POST   /api/auth/otp/send       - Send OTP
POST   /api/auth/otp/verify     - Verify OTP
POST   /api/auth/refresh        - Refresh token
```

### Members
```
GET    /api/members             - List members
GET    /api/members/:id         - Get member
POST   /api/members             - Create member
PUT    /api/members/:id         - Update member
DELETE /api/members/:id         - Delete member
```

## Environment Variables

See `.env.example` in root directory.

## Dependencies

- **gin-gonic/gin**: Web framework
- **gorm**: ORM
- **golang-jwt**: JWT handling
- **aws-sdk-go-v2**: S3/R2 client
- **joho/godotenv**: .env loading

## Development

### Adding a New Feature

1. Create model in `internal/models/`
2. Create repository in `internal/repository/`
3. Create service in `internal/service/`
4. Create handler in `internal/handlers/`
5. Register route in `main.go`

### Database Migrations

Create SQL files in `migrations/` directory:
```
migrations/
├── 001_create_users.sql
├── 002_create_members.sql
└── 003_create_documents.sql
```

## Testing

```bash
go test ./... -v
go test ./... -cover
```

## Performance Optimization

- Connection pooling configured in GORM
- Request validation on input
- Database indexes on frequently queried fields
- Pagination for list endpoints
