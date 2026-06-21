# Member Management System - Architecture & Design

## System Overview

This is a full-stack web application for managing cooperative members with ~1,500 members. The system is designed for scalability, security, and ease of use.

### Architecture Diagram

```
┌───────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14)                                     │
│ - React 18 with TypeScript                               │
│ - React Query for state management                       │
│ - Tailwind CSS for styling                               │
│ - Zustand for global state                               │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTP/REST
                    │
┌───────────────────▼─────────────────────────────────────┐
│ API Gateway / Load Balancer (Nginx)                     │
│ - Request routing                                       │
│ - SSL termination                                       │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│ Backend (Go 1.22 + Gin)                                 │
│ - RESTful API endpoints                                 │
│ - JWT authentication                                    │
│ - Business logic                                        │
│ - Error handling & validation                           │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
┌───────▼──┐  ┌────▼──┐  ┌─────▼────┐  ┌──────▼─────┐
│ Database │  │ Cache │  │ Storage  │  │ Messages  │
│ (Postgres)  │ (Redis)   │ (R2/S3) │  │ (Line API)│
└──────────┘  └────────┘  └──────────┘  └────────────┘
```

## Data Flow

### Authentication Flow
1. User initiates login request with phone number
2. Backend generates OTP and sends via Line Messaging API
3. User receives OTP on Line app
4. User enters OTP
5. Backend validates OTP and generates JWT tokens
6. Frontend stores tokens in localStorage and sets auth headers

### Member Management Flow
1. Admin/Staff navigates to members page
2. Frontend sends request with JWT token
3. Backend validates token and checks permissions
4. Backend queries PostgreSQL for member data
5. Frontend displays paginated results with React Query

### File Upload Flow
1. User selects file to upload
2. Frontend validates file size/type
3. Frontend sends file to backend API
4. Backend validates and stores in Cloudflare R2
5. Backend saves file metadata in PostgreSQL
6. Frontend shows success/error message

## Security Considerations

### Authentication
- JWT tokens with short TTL (15 minutes)
- Refresh tokens with longer TTL (7 days)
- Secure token storage in httpOnly cookies (future)
- CORS configuration for frontend domain

### Authorization
- Role-based access control (RBAC)
- Middleware for permission checking
- User ID validation on all requests

### Data Protection
- Encrypted passwords (bcrypt)
- SQL injection prevention (parametrized queries via GORM)
- CORS headers to prevent unauthorized requests
- Rate limiting on API endpoints (TODO)

### File Uploads
- File type and size validation
- Secure storage in R2 with signed URLs
- Access control on document viewing

## Database Schema

See `backend/migrations/001_initial_schema.sql` for complete schema with:
- Users table (admin, staff)
- Members table (cooperative members)
- OTP table (one-time passwords)
- Member Documents table
- Refresh Tokens table

Key indexes for performance:
- members.email
- members.phone
- members.status
- otps.phone and expires_at
- documents.member_id

## API Endpoints

### Authentication
```
POST   /api/auth/otp/send         - Request OTP
POST   /api/auth/otp/verify       - Verify OTP and get tokens
POST   /api/auth/refresh          - Refresh access token
POST   /api/auth/logout           - Logout
```

### Members
```
GET    /api/members               - List members (paginated)
GET    /api/members/:id           - Get member details
POST   /api/members               - Create member
PUT    /api/members/:id           - Update member
DELETE /api/members/:id           - Delete member
GET    /api/members/:id/documents - List documents
```

### Documents
```
POST   /api/members/:id/documents - Upload document
GET    /api/documents/:id         - Download document
DELETE /api/documents/:id         - Delete document
PUT    /api/documents/:id/verify  - Verify document (admin)
```

### Admin
```
GET    /api/admin/users           - List users
POST   /api/admin/users           - Create user
PUT    /api/admin/users/:id       - Update user
DELETE /api/admin/users/:id       - Delete user
```

## Deployment Architecture

### Development
- Docker Compose with 3 containers:
  - PostgreSQL 16
  - Go backend
  - Next.js frontend
- Volume mounts for live code reload (TODO)

### Production
- Containerized services on Kubernetes or Docker Swarm
- PostgreSQL with automated backups
- Redis for caching
- CDN for frontend static assets
- S3/R2 for member documents
- Load balancer/reverse proxy (Nginx)
- SSL/TLS certificates
- Health checks and monitoring

## Performance Optimization

### Database
- Connection pooling (configured in GORM)
- Query optimization with proper indexes
- Pagination to limit result sets
- Caching with Redis (TODO)

### Frontend
- Code splitting with dynamic imports
- React Query for client-state management
- Image optimization
- CSS-in-JS optimization

### Backend
- Goroutine pooling for request handling
- Efficient routing with Gin
- Compression for API responses
- Caching headers for static content

## Future Enhancements

1. **Caching Layer**
   - Redis for session data
   - Cache member lists

2. **Search & Filtering**
   - Full-text search capability
   - Advanced filtering options

3. **Reporting**
   - Member statistics
   - Document verification reports
   - Activity logs

4. **Notifications**
   - Email notifications
   - SMS notifications via Line

5. **Two-Factor Authentication**
   - Support for TOTP apps

6. **API Versioning**
   - /api/v1, /api/v2 routes

7. **Monitoring & Logging**
   - Structured logging
   - Application performance monitoring
   - Error tracking

## Development Guidelines

### Code Organization
- Frontend: Feature-based folder structure
- Backend: Clean architecture with clear separation of concerns

### Naming Conventions
- Go: camelCase for functions/variables, PascalCase for exports
- TypeScript: camelCase for variables, PascalCase for types/interfaces

### Error Handling
- Frontend: Toast notifications for user feedback
- Backend: Structured error responses with error codes

### Testing
- Backend: Unit tests for services and handlers
- Frontend: Component tests with React Testing Library
