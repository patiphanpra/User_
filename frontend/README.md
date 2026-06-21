# Frontend README

Next.js 14 member management interface

## Project Structure

```
frontend/
├── app/                 # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # Reusable components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
├── types/               # TypeScript types
├── public/              # Static assets
└── package.json         # Dependencies
```

## Quick Start

### Local Development
```bash
npm install
npm run dev
```

Open http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

### Format Code
```bash
npm run format
npm run type-check
```

## Tech Stack

- **Next.js 14**: App Router, Server Components
- **React 18**: UI library
- **TypeScript**: Type safety
- **React Query**: API client state management
- **Tailwind CSS**: Styling
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Zustand**: Global state management

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API Integration

API calls are managed through `lib/api.ts` using axios + React Query:

```typescript
import { useQuery } from '@tanstack/react-query';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data } = await api.get('/api/members');
      return data;
    }
  });
}
```

## Components

Organize components by feature:
```
components/
├── layout/              # Layout components
├── members/             # Member-related
├── forms/               # Form components
├── common/              # Shared components
└── ui/                  # Generic UI
```

## Styling

Using Tailwind CSS with custom theme configuration in `tailwind.config.js`.

## Type Safety

All API responses should have TypeScript types in `types/`:

```typescript
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
```

## Performance

- Image optimization with Next.js `Image` component
- Code splitting with dynamic imports
- React Query caching and stale-while-revalidate
- CSS-in-JS optimization

## Deployment

```bash
npm run build
npm start
```

Or use Docker:
```bash
docker build -f ../Dockerfile.frontend -t member-mgmt-frontend .
docker run -p 3000:3000 member-mgmt-frontend
```
