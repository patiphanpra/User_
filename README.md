# Member Management System für Thai Educational Cooperative Association (สสคบ)

A modern, full-stack member management system designed for educational cooperatives with ~1,500 members.

## Architecture

### Tech Stack

**Backend:**
- Go 1.22+
- Gin Framework
- GORM ORM
- PostgreSQL 16
- JWT Authentication
- Line Messaging API for OTP

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React Query
- Tailwind CSS

**Infrastructure:**
- Docker Compose (development)
- Cloudflare R2 (file storage)

## Project Structure

```
member-mgmt-system/
├── backend/
│   ├── cmd/server/              # Application entry points
│   ├── internal/
│   │   ├── config/              # Configuration management
│   │   ├── handlers/            # HTTP request handlers
│   │   ├── middleware/          # Gin middleware
│   │   ├── models/              # Database models
│   │   ├── repository/          # Data access layer
│   │   ├── service/             # Business logic
│   │   └── utils/               # Utilities
│   ├── pkg/
│   │   ├── auth/                # JWT authentication
│   │   ├── database/            # Database initialization
│   │   └── storage/             # R2/S3 storage
│   ├── migrations/              # Database migrations
│   ├── tests/                   # Test files
│   ├── go.mod                   # Go dependencies
│   └── Dockerfile               # Backend container
│
├── frontend/
│   ├── app/                     # Next.js App Router
│   ├── components/              # Reusable components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   ├── types/                   # TypeScript types
│   ├── public/                  # Static assets
│   ├── package.json             # Dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── Dockerfile               # Frontend container
│
├── docker-compose.yml           # Development environment
├── .env.example                 # Environment variables template
├── .env.local                   # Local development env
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Features

### Core Functionality
- ✅ Member registration and verification
- ✅ Member profile management
- ✅ Document upload and verification
- ✅ Role-based access control (Admin, Staff)
- ✅ JWT-based authentication
- ✅ OTP verification via Line Messaging API

### Authentication & Security
- JWT tokens (15-minute access, 7-day refresh)
- Secure password hashing with bcrypt
- CORS configuration
- Request validation with Zod

### Data Management
- Member information
- Document storage and verification
- OTP tracking
- User audit logs

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Go 1.22+ (for local development)
- Node.js 20+ (for frontend development)
- PostgreSQL 16 (for local development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd member-mgmt-system
```

2. **Setup environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start with Docker Compose**
```bash
docker-compose up --build
```

The system will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

### Local Development

**Backend Setup:**
```bash
cd backend
go mod download
go run ./cmd/server/main.go
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables:

```
ENVIRONMENT          # development, staging, production
SERVER_PORT          # Backend port (default: 8080)
DB_*                 # PostgreSQL credentials
JWT_SECRET           # Secret key for JWT signing
R2_*                 # Cloudflare R2 credentials
LINE_CHANNEL_*       # Line Messaging API credentials
```

## API Documentation

### Authentication
- `POST /api/auth/otp/send` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and get token
- `POST /api/auth/refresh` - Refresh access token

### Members
- `GET /api/members` - List all members (paginated)
- `GET /api/members/:id` - Get member details
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Documents
- `POST /api/members/:id/documents` - Upload document
- `GET /api/members/:id/documents` - List member documents

## Deployment

### Production Build
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

### Database Migrations
```bash
cd backend
go run ./cmd/migrate/main.go
```

## Contributing

1. Follow the project structure guidelines
2. Write tests for new features
3. Use TypeScript for frontend code
4. Document API changes

## Database Schema

### Users Table
- id (UUID)
- email
- phone
- password_hash
- first_name, last_name
- role (admin, staff)
- status (active, inactive)
- created_at, updated_at

### Members Table
- id (UUID)
- membership_no
- personal information
- contact details
- membership_date
- status (active, inactive, suspended)
- profile_image_url
- created_at, updated_at

### OTP Table
- id (UUID)
- phone (indexed)
- code
- expires_at
- used, used_at
- created_at

### Member Documents Table
- id (UUID)
- member_id (foreign key)
- document_type
- document_url
- verification_status
- created_at, updated_at

## Support

For issues and questions, please create an issue in the repository.

## License

Proprietary - Thai Educational Cooperative Association (สสคบ)
