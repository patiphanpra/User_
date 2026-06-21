# Member Management System - API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

All endpoints except `/auth/*` require a valid JWT token in the Authorization header:

```
Authorization: Bearer {access_token}
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": {
    "field": "Field specific error message"
  },
  "timestamp": "2024-04-08T10:00:00Z"
}
```

## Endpoints

### Authentication

#### Request OTP
```
POST /auth/otp/send

{
  "phone": "+66812345678"
}

Response: 200 OK
{
  "message": "OTP sent successfully",
  "expires_in": 300
}
```

#### Verify OTP
```
POST /auth/otp/verify

{
  "phone": "+66812345678",
  "code": "123456"
}

Response: 200 OK
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "staff"
  },
  "expiresIn": 900
}
```

#### Refresh Token
```
POST /auth/refresh

{
  "refreshToken": "eyJ..."
}

Response: 200 OK
{
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

### Members

#### List Members
```
GET /members?page=1&limit=20&status=active&search=john

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "membershipNo": "M001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+66812345678",
      "status": "active",
      "createdAt": "2024-04-08T10:00:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 20,
  "totalPages": 75
}
```

#### Get Member
```
GET /members/:id

Response: 200 OK
{
  "id": "uuid",
  "membershipNo": "M001",
  "title": "นาย",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+66812345678",
  "dateOfBirth": "1990-01-01",
  "idCard": "1234567890123",
  "address": "123 Main St",
  "district": "Watthana",
  "province": "Bangkok",
  "postalCode": "10110",
  "status": "active",
  "membershipDate": "2023-01-01",
  "verificationStatus": "verified",
  "profileImageUrl": "https://r2.example.com/...",
  "createdAt": "2024-04-08T10:00:00Z",
  "updatedAt": "2024-04-08T10:00:00Z"
}
```

#### Create Member
```
POST /members

{
  "title": "นาย",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+66898765432",
  "dateOfBirth": "1995-05-15",
  "idCard": "9876543210987",
  "address": "456 Oak St",
  "district": "Bangrak",
  "province": "Bangkok",
  "postalCode": "10500"
}

Response: 201 Created
{
  "id": "new-uuid",
  "membershipNo": "M1501",
  ...
}
```

#### Update Member
```
PUT /members/:id

{
  "email": "newemail@example.com",
  "phone": "+66812345678",
  "address": "789 Elm St"
}

Response: 200 OK
{
  "id": "uuid",
  ...
}
```

#### Delete Member
```
DELETE /members/:id

Response: 204 No Content
```

### Documents

#### Upload Document
```
POST /members/:id/documents

Content-Type: multipart/form-data

{
  "file": <file>,
  "documentType": "id_card"
}

Response: 201 Created
{
  "id": "doc-uuid",
  "memberId": "member-uuid",
  "documentType": "id_card",
  "documentUrl": "https://r2.example.com/...",
  "verificationStatus": "pending",
  "createdAt": "2024-04-08T10:00:00Z"
}
```

#### List Member Documents
```
GET /members/:id/documents

Response: 200 OK
{
  "data": [
    {
      "id": "doc-uuid",
      "documentType": "id_card",
      "verificationStatus": "verified",
      ...
    }
  ]
}
```

#### Delete Document
```
DELETE /documents/:id

Response: 204 No Content
```

#### Verify Document (Admin only)
```
PUT /documents/:id/verify

{
  "verified": true,
  "notes": "Document is valid"
}

Response: 200 OK
{
  "id": "doc-uuid",
  "verificationStatus": "verified",
  ...
}
```

## Rate Limiting

- 100 requests per minute per IP for public endpoints
- 1000 requests per minute per IP for authenticated endpoints

## Pagination

All list endpoints support pagination:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
- `total`: Total number of items
- `page`: Current page
- `limit`: Items per page
- `totalPages`: Total number of pages

## Filters

Member list endpoint supports:
- `status`: Filter by status (active, inactive, suspended)
- `search`: Search by name or email
- `sort`: Sort field (firstName, createdAt, status)
- `order`: Sort order (asc, desc)

## Response Codes

- `200`: OK
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Unprocessable Entity
- `500`: Internal Server Error

## TODO

- [ ] Add more validation examples
- [ ] Add webhook documentation
- [ ] Add batch operation endpoints
- [ ] Add export endpoints (CSV, PDF)
