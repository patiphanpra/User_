# Frontend - Member Management System UI Documentation

This directory contains all the UI components and pages for the Member Management System frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Authentication pages (group layout)
│   ├── (admin)/             # Admin dashboard pages (group layout)
│   ├── (member)/            # Member portal pages (group layout)
│   └── layout.tsx           # Root layout with QueryClient provider
├── components/
│   ├── ui/                  # Reusable shadcn/ui components
│   ├── auth/                # Auth-specific components
│   ├── members/             # Member-specific components
│   ├── receipts/            # Receipt-specific components
│   └── common/              # Shared components (OTPInput, ThaiIDInput, etc.)
├── hooks/                   # Custom React hooks
├── lib/
│   ├── api.ts              # Axios instance with interceptors
│   ├── schemas/            # Zod validation schemas
│   └── utils.ts            # Utility functions
├── store/                   # Zustand state management
├── types/                   # TypeScript type definitions
└── public/                  # Static assets
```

## Technologies Used

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.3+ (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Server State**: React Query (TanStack Query v5)
- **Client State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table v8 (via shadcn/ui)
- **HTTP Client**: Axios with automatic token refresh
- **Date Handling**: date-fns with Thai locale
- **UI Icons**: Lucide React
- **File Upload**: React Dropzone

## Key Features

### Authentication
- Login with email/password
- Forgot password with OTP verification via Line Messaging API
- Password reset with validation
- JWT stored in memory, refresh token in httpOnly cookie
- Automatic token refresh on 401 response
- Role-based access control (Admin vs Staff)

### Admin Dashboard
- **Dashboard**: Stats cards, recent members, recent receipts
- **Members**: Searchable list with filters, pagination, CSV export
- **Member Detail**: Full form with Thai ID validation, status management
- **Add Member**: Complete member registration form
- **Receipts**: List, filter by type/status/date, create new
- **File Manager**: Admin document uploads

### Member Portal
- **Profile**: View personal information
- **My Receipts**: Download receipt history, PDF export
- **Upload Proof**: Drag-and-drop file upload with progress

### Reusable Components

#### Custom Components
- **OTPInput**: 6-digit OTP input with auto-focus, paste support
- **ThaiIDInput**: Thai national ID validation with checksum verification
- **DeathBadge**: Red badge showing deceased member status
- **FileUploader**: Drag-and-drop with preview and progress bar

#### shadcn/ui Components
- Form, Input, Label, Button, Card, Alert
- Table with sorting and filtering
- Tabs for tabbed content
- Badge for status indicators
- Dropdown menu for navigation
- Progress bar for uploads
- Skeleton for loading states

## Schemas & Validation

All forms use Zod schemas with Thai error messages:

- `loginSchema`: Email + password validation
- `forgotPasswordSchema`: Phone number (10 digits)
- `verifyOtpSchema`: OTP (6 digits)
- `resetPasswordSchema`: Password strength (8+ chars, uppercase, number)
- `memberSchema`: Thai ID checksum, required fields
- `receiptSchema`: Member ID, type, amount
- `fileUploadSchema`: File type validation (PDF, JPG, PNG, max 10MB)

## API Integration

All API calls are typed with TypeScript and include:
- Automatic Authorization header injection
- Token refresh on 401 response
- Error handling with custom error types
- Request/response interceptors

### API Endpoints Supported
- Auth: login, logout, forgotPassword, verifyOtp, resetPassword, me, refresh
- Members: list, get, create, update, delete, export (CSV)
- Receipts: list, get, create, update, getMemberReceipts, listTypes
- Files: upload, list, delete, download
- Stats: getDashboard

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Running the Application

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Code formatting
npm run format
```

## Language

- **UI Language**: Thai (ภาษาไทย)
- **Date Format**: Thai format (e.g., 15 มกราคม 2567)
- **Currency**: Thai Baht (฿)
- **All validation messages**: Thai language

## Mobile Responsive

All pages are fully responsive:
- Mobile-first design approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly buttons and inputs
- Optimized for small screens

## Performance Optimizations

- React Query for efficient caching and background updates
- Server-side rendering with Next.js 14
- Image optimization with next/image
- Code splitting and lazy loading
- Skeleton loading states
- Optimistic UI updates

## Security

- JWT tokens stored in memory (not localStorage)
- Refresh tokens in httpOnly cookies (secure by default)
- CSRF protection via axios withCredentials
- Input validation on all forms
- Type-safe API calls with TypeScript
