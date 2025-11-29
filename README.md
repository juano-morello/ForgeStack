# ForgeStack

<div align="center">

![ForgeStack](https://img.shields.io/badge/ForgeStack-Multi--Tenant_SaaS_Starter-7c3aed?style=for-the-badge)

**A production-ready, multi-tenant SaaS starter kit with enterprise-grade security**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)](https://redis.io/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25+-brightgreen)](.)

[Getting Started](#-getting-started) •
[Features](#key-features) •
[Architecture](#-architecture) •
[API Reference](#-api-reference) •
[Contributing](#-contributing)

</div>

---

## 📋 Overview

ForgeStack is a full-stack, multi-tenant SaaS boilerplate designed to accelerate B2B application development. It provides a complete foundation with organization-based tenancy, role-based access control, and row-level security out of the box.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password auth with [better-auth](https://better-auth.com) |
| 🏢 **Multi-tenancy** | Organization-based data isolation |
| 🛡️ **Row-Level Security** | PostgreSQL RLS policies for data protection |
| 👥 **Team Management** | Invite members, manage roles (OWNER/MEMBER) |
| 📧 **Email Integration** | Transactional emails with [Resend](https://resend.com) |
| 🎨 **Modern UI** | Next.js 16 + React 19 + Tailwind CSS + shadcn/ui |
| 📦 **Monorepo** | pnpm workspaces + Turborepo |
| ✅ **Tested** | 95%+ coverage with Jest, Vitest, and Playwright |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                     Next.js 16 (App Router)                             │
│            React 19.2 • Tailwind CSS • shadcn/ui                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP/REST + Cookies
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               API                                        │
│                         NestJS 11                                        │
│           Guards • Services • Repositories • DTOs                        │
└──────────────────┬────────────────────────────────┬─────────────────────┘
                   │                                │
                   ▼                                ▼
┌──────────────────────────────┐    ┌────────────────────────────────────┐
│        PostgreSQL 16         │    │            Redis 7                  │
│   Drizzle ORM • RLS Policies │    │   BullMQ • Session Cache           │
└──────────────────────────────┘    └────────────────────────────────────┘
```

### Monorepo Structure

```
ForgeStack/
├── apps/
│   ├── api/                 # NestJS REST API (Port 4000)
│   ├── web/                 # Next.js Frontend (Port 3000)
│   └── worker/              # BullMQ Background Jobs
├── packages/
│   ├── db/                  # Drizzle ORM + Schema + RLS
│   ├── shared/              # Shared TypeScript types & constants
│   └── ui/                  # Shared UI components (future)
├── docs/
│   └── specs/               # Feature specifications
├── docker-compose.yml       # Local development services
└── turbo.json              # Turborepo configuration
```

| Package | Description |
|---------|-------------|
| `apps/api` | NestJS backend with REST endpoints, authentication, and business logic |
| `apps/web` | Next.js frontend with App Router, React Server Components, and client-side state |
| `apps/worker` | Background job processor for emails and async tasks |
| `packages/db` | Database schema, migrations, RLS policies, and Drizzle client |
| `packages/shared` | Shared TypeScript types, constants, and validation schemas |

---

## 📋 Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| [Node.js](https://nodejs.org/) | 20.9+ | JavaScript runtime (required by Next.js 16) |
| [pnpm](https://pnpm.io/) | 9.14+ | Package manager |
| [Docker](https://www.docker.com/) | Latest | PostgreSQL & Redis containers |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/forgestack.git
cd forgestack
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### 4. Configure Environment

```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit with your values (see Environment Variables section)
```

### 5. Run Database Migrations

```bash
cd packages/db
pnpm db:push      # Apply schema
pnpm db:migrate   # Apply RLS policies
```

### 6. Start Development Servers

```bash
# From root directory
pnpm dev
```

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:4000 |
| API Health | http://localhost:4000/health |

---

## 📁 Project Structure

```
ForgeStack/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/              # Authentication module
│   │   │   ├── core/              # Guards, filters, interceptors
│   │   │   ├── health/            # Health check endpoint
│   │   │   ├── invitations/       # Member invitation system
│   │   │   ├── members/           # Organization members
│   │   │   ├── organizations/     # Organization CRUD
│   │   │   ├── projects/          # Projects CRUD
│   │   │   └── queue/             # BullMQ queue service
│   │   └── test/                  # Test utilities & integration tests
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/               # Next.js App Router pages
│   │   │   ├── components/        # React components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── lib/               # Utilities & API client
│   │   │   └── types/             # TypeScript types
│   │   └── e2e/                   # Playwright E2E tests
│   │
│   └── worker/
│       └── src/
│           ├── handlers/          # Job handlers
│           └── worker.ts          # BullMQ worker setup
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema/            # Drizzle table definitions
│   │   │   ├── context.ts         # Tenant context & RLS
│   │   │   └── index.ts           # Exports
│   │   └── drizzle/               # Migration files
│   │
│   └── shared/
│       └── src/
│           ├── constants.ts       # Shared constants
│           └── types.ts           # Shared TypeScript types
│
└── docs/specs/                    # Feature specifications
```

---

## 📜 Available Scripts

Run from the **root directory** unless otherwise noted.

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Remove all build artifacts |

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests |
| `cd apps/api && pnpm test:cov` | API tests with coverage |
| `cd apps/web && pnpm test:coverage` | Web tests with coverage |
| `cd apps/api && pnpm test:integration` | Integration tests (requires DB) |
| `cd apps/web && pnpm e2e` | Playwright E2E tests |

### Database

| Command | Description |
|---------|-------------|
| `cd packages/db && pnpm db:push` | Push schema to database |
| `cd packages/db && pnpm db:migrate` | Run migrations |
| `cd packages/db && pnpm db:studio` | Open Drizzle Studio |
| `cd packages/db && pnpm db:generate` | Generate migration files |

### Docker

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start PostgreSQL and Redis |
| `docker-compose down` | Stop services |
| `docker-compose logs -f` | View service logs |

---

## 🔑 Environment Variables

### API (`apps/api/.env`)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgestack_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:4000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### Web (`apps/web/.env`)

```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Database (for better-auth)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgestack_dev"
```

---

## 🔐 Key Features Documentation

### Authentication Flow

ForgeStack uses [better-auth](https://better-auth.com) for authentication:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Signup  │ ──► │  Login   │ ──► │ Session  │ ──► │  Logout  │
│  /signup │     │  /login  │     │  Cookie  │     │  Clear   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

```typescript
// Frontend: Check auth status
const { data: session } = useSession();

// API: Access current user (set by TenantContextGuard)
const user = request.user;
```

### Multi-Tenancy with Row-Level Security

Every database query is automatically scoped to the current organization:

```typescript
// Queries are automatically filtered by RLS policies
await withTenantContext({ orgId, userId, role }, async (tx) => {
  // This only returns projects in the current org!
  return await tx.select().from(projects);
});
```

**Request Flow:**
1. Frontend sends `X-Org-Id` header with requests
2. `TenantContextGuard` validates user's org membership
3. `withTenantContext()` sets PostgreSQL session variables
4. RLS policies automatically filter all queries

### Organization & Member Management

```
User creates org → Becomes OWNER → Can invite members
                                 → Can manage roles
                                 → Can delete org

Member joins     → Receives MEMBER role
                → Can view/create projects
                → Cannot manage members
```

### Email Invitations

1. Owner invites user by email
2. API creates invitation with secure token
3. Worker sends email via Resend
4. Recipient clicks link to accept
5. New member added to organization

---

## 📡 API Reference

### Base URL

```
http://localhost:4000/api/v1
```

### Authentication

All protected endpoints require:
- Valid session cookie (`better-auth.session_token`)
- Organization context header (`X-Org-Id`)

### Endpoints

#### Health & Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | No |
| `GET` | `/auth/me` | Current user info | Yes |

#### Organizations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/organizations` | List user's orgs | Yes* |
| `POST` | `/organizations` | Create org | Yes* |
| `PATCH` | `/organizations/:id` | Update org | OWNER |
| `DELETE` | `/organizations/:id` | Delete org | OWNER |

#### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/projects` | List projects (supports `?search=`) | Yes |
| `GET` | `/projects/:id` | Get project | Yes |
| `POST` | `/projects` | Create project | Yes |
| `PATCH` | `/projects/:id` | Update project | Yes |
| `DELETE` | `/projects/:id` | Delete project | OWNER |

#### Members

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/members` | List members | Yes |
| `PATCH` | `/members/:userId/role` | Update role | OWNER |
| `DELETE` | `/members/:userId` | Remove member | OWNER |

#### Invitations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/invitations` | List pending | OWNER |
| `POST` | `/invitations` | Send invite | OWNER |
| `DELETE` | `/invitations/:id` | Cancel invite | OWNER |
| `POST` | `/invitations/accept` | Accept invite | Yes* |
| `POST` | `/invitations/decline` | Decline invite | Yes* |

> *Endpoints marked with `*` do not require `X-Org-Id` header

---

## 🧪 Testing

### Coverage Targets

| Package | Target | Current |
|---------|--------|---------|
| API | >90% | 98.51% |
| Web | >80% | 86.30% |
| DB | >80% | 85%+ |

### Running Tests

```bash
# All unit tests
pnpm test

# API with coverage
cd apps/api && pnpm test:cov

# Web with coverage
cd apps/web && pnpm test:coverage

# Integration tests (requires database)
cd apps/api && pnpm test:integration

# E2E tests (requires running app)
cd apps/web && pnpm e2e
```

### Test Types

| Type | Location | Framework |
|------|----------|-----------|
| API Unit | `apps/api/src/**/*.spec.ts` | Jest |
| API Integration | `apps/api/test/integration/` | Jest |
| Web Unit | `apps/web/src/**/*.test.tsx` | Vitest |
| E2E | `apps/web/e2e/` | Playwright |
| DB Unit | `packages/db/src/**/*.test.ts` | Vitest |

---

## 🚢 Deployment

### Production Build

```bash
# Build all packages and apps
pnpm build

# Build specific app
pnpm turbo build --filter=@forgestack/api
pnpm turbo build --filter=@forgestack/web
```

### Production Environment Variables

```bash
# Required for production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/forgestack_prod
REDIS_URL=redis://host:6379
BETTER_AUTH_SECRET=<strong-secret-min-32-chars>
BETTER_AUTH_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Docker Deployment

```bash
# Build production images
docker build -t forgestack-api -f apps/api/Dockerfile .
docker build -t forgestack-web -f apps/web/Dockerfile .
docker build -t forgestack-worker -f apps/worker/Dockerfile .
```

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch from `main`
2. Write/update specs in `docs/specs/` if needed
3. Write failing tests first (TDD)
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- **TypeScript** — Strict mode enabled
- **ESLint** — Enforced via `pnpm lint`
- **Prettier** — Enforced via `pnpm format`

### Commit Convention

```
type(scope): description

feat(api): add member invitation endpoints
fix(web): resolve login redirect issue
test(db): add RLS integration tests
docs: update API reference
```

### Pull Request Guidelines

- Link related issues
- Include test coverage for new code
- Update documentation as needed
- Request review from maintainers

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [PulseDevLabs](https://github.com/PulseDevLabs)**

</div>
