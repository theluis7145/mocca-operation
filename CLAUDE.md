# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mocca Operation is a Japanese operation manual management system built with Next.js 15 (App Router) and deployed to Cloudflare Workers. It enables businesses to create, manage, and track work instructions with features like work session tracking, photo documentation, and role-based access control.

## Common Commands

### Development
```bash
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Testing
```bash
npm run test              # Run Jest unit tests
npm run test:watch        # Run Jest in watch mode
npm run test:e2e          # Run Playwright E2E tests
npm run test:all          # Run both unit and E2E tests
```

### Database (Prisma)
```bash
npm run db:generate       # Generate Prisma client
npm run db:push           # Push schema changes
npm run db:migrate        # Create and run migrations
npm run db:seed           # Seed database with initial data
npm run db:studio         # Open Prisma Studio GUI
```

### Cloudflare Deployment
```bash
npm run cf:build          # Build for Cloudflare Workers
npm run cf:preview        # Preview locally with Wrangler
npm run cf:deploy         # Deploy to Cloudflare Workers
```

### D1 Database Migrations (Production)
```bash
npx wrangler d1 execute mocca-operation-db --remote --file=prisma/migrations/<migration-file>.sql
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5 with App Router, TypeScript strict mode
- **Database**: Prisma ORM with D1 (production) / SQLite (development)
- **Auth**: NextAuth.js 5.0 with database sessions
- **UI**: shadcn/ui (Radix primitives) + Tailwind CSS 4
- **State**: Zustand for client state
- **Storage**: Cloudflare R2 for images
- **Deployment**: Cloudflare Workers via OpenNextJS

### Key Directories
```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # Protected routes (business, manual, admin, etc.)
│   └── api/                   # API routes
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── d1.ts                 # D1 database adapter (production)
│   ├── prisma.ts             # Prisma client singleton
│   ├── permissions.ts        # Role-based access control
│   └── r2.ts                 # Cloudflare R2 operations
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Header, Sidebar, etc.
│   └── manual/               # Manual editor components
└── stores/                   # Zustand stores
```

### Database Architecture
- **Multi-tenant**: Businesses are isolated via BusinessAccess join table
- **Roles**: ADMIN (can edit manuals) / WORKER (read-only)
- **Super Admin**: Cross-business access via `isSuperAdmin` flag on User

### Data Flow
1. **Authentication**: NextAuth middleware protects routes → session stored in DB
2. **API Routes**: Check permissions via `src/lib/permissions.ts`
3. **Database**: Development uses SQLite, production uses Cloudflare D1
4. **Images**: Uploaded to R2 via presigned URLs from `/api/upload`

## Important Patterns

### Permission Checking
```typescript
import { checkPermission, checkSuperAdmin } from '@/lib/permissions'

// In API routes:
const session = await auth()
if (!checkSuperAdmin(session)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### D1 vs Prisma
- Development: Use Prisma directly (`src/lib/prisma.ts`)
- Production: Use D1 adapter functions (`src/lib/d1.ts`)
- API routes check environment and use appropriate adapter

### Component Conventions
- Use `'use client'` directive for interactive components
- shadcn/ui components are in `src/components/ui/`
- Layout components handle responsive design (mobile sidebar, etc.)

## Testing

- **Unit tests**: `__tests__/` directory, run with Jest
- **E2E tests**: `e2e/` directory, run with Playwright (Chromium only)
- **CI**: GitHub Actions runs lint, unit tests, and build on every push

## Environment Variables

Required for development (see `.env.example`):
- `DATABASE_URL` - SQLite or PostgreSQL connection
- `NEXTAUTH_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `R2_*` - Cloudflare R2 credentials for image uploads

## Language

This is a Japanese application. UI text, error messages, and user-facing content should be in Japanese.
