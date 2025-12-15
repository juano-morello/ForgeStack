# ForgeStack

<div align="center">

![ForgeStack](https://img.shields.io/badge/ForgeStack-Multi--Tenant_SaaS_Starter-7c3aed?style=for-the-badge)
![GitHub Template](https://img.shields.io/badge/GitHub-Template-2ea44f?style=for-the-badge&logo=github)

**A production-ready, multi-tenant SaaS starter kit with enterprise-grade security**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)](https://redis.io/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25+-brightgreen)](.)

[Use This Template](#-use-this-template) •
[Getting Started](#-getting-started) •
[Features](#key-features) •
[Architecture](#-architecture) •
[API Reference](#-api-reference)

</div>

---

## 🚀 Use This Template

ForgeStack is a **GitHub Template Repository**. Create your own SaaS project with one click:

### Quick Start

1. **Click "Use this template"** → "Create a new repository" on GitHub
2. **Clone your new repository:**
   ```bash
   git clone https://github.com/your-org/your-project.git
   cd your-project
   ```
3. **Install dependencies and run the setup script:**
   ```bash
   pnpm install
   pnpm init
   ```
4. **Follow the interactive prompts** to customize:
   - Project name (e.g., `my-saas-app`)
   - Display name (e.g., `My SaaS App`)
   - NPM scope (e.g., `@mycompany`)
   - Description, author info, and repository URL

The setup script will automatically:
- Replace all ForgeStack branding with your project name
- Update all package.json files with your npm scope
- Configure Docker and deployment files
- Update environment templates
- Clean up template-specific files

> 📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

---

## 📋 Overview

ForgeStack is a full-stack, multi-tenant SaaS boilerplate designed to accelerate B2B application development. It provides a complete foundation with organization-based tenancy, role-based access control, and row-level security out of the box.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Email/password auth with [better-auth](https://better-auth.com) |
| 🏢 **Multi-tenancy** | Organization-based data isolation |
| 🛡️ **Row-Level Security** | PostgreSQL RLS policies for data protection |
| 👥 **Team Management** | Invite members, assign roles with granular permissions |
| 🔒 **Granular RBAC** | Custom roles with fine-grained permissions (33 permissions, 11 resources) |
| 📧 **Email Integration** | Transactional emails with [Resend](https://resend.com) |
| 💳 **Billing & Subscriptions** | Stripe integration with checkout, customer portal & usage metering |
| 📁 **File Uploads** | S3-compatible storage (Cloudflare R2) with signed URLs |
| 🔑 **API Keys** | Generate, manage, and authenticate with scoped API keys |
| 🪝 **Webhooks** | Outgoing events + incoming Stripe webhook handling |
| 📋 **Audit Logs** | Immutable compliance logs with export (org + platform level) |
| 📊 **Activity Feed** | Real-time timeline with aggregation |
| 🔔 **Notifications** | In-app and email notifications with preferences |
| 🚩 **Feature Flags** | Plan-based gating, percentage rollouts, org overrides |
| ⚡ **Rate Limiting** | Plan-based API rate limits with Redis |
| 📈 **Usage Tracking** | API calls, storage, and seat metering with limits |
| 🛠️ **Super Admin Panel** | Platform-wide user/org management with suspension |
| 🎭 **User Impersonation** | Admin impersonation with audit logging and session timeout |
| 🤖 **AI Integration** | Vercel AI SDK with streaming chat, rate limiting, and usage tracking |
| 📚 **Documentation Site** | Built-in MDX documentation with API guides |
| 🎯 **Onboarding Flow** | Guided setup with org creation and team invites |
| 📡 **Observability** | OpenTelemetry tracing, Pino structured logs, Prometheus metrics |
| 🐳 **Docker Ready** | Multi-stage Dockerfiles with deployment templates |
| 🎨 **Modern UI** | Next.js 16 + React 19 + Tailwind CSS + shadcn/ui + Storybook |
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
                                │ HTTP/REST + Cookies + API Keys
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               API                                        │
│                         NestJS 11                                        │
│    Auth • Rate Limiting • Guards • Services • Repositories • DTOs       │
└──────┬─────────────────┬──────────────────┬────────────────┬────────────┘
       │                 │                  │                │
       ▼                 ▼                  ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ PostgreSQL   │  │    Redis     │  │   Stripe     │  │  Cloudflare R2   │
│ Drizzle+RLS  │  │ BullMQ+Cache │  │   Billing    │  │  File Storage    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Worker     │
                  │ Emails/Jobs  │
                  └──────────────┘
```

### Monorepo Structure

```
ForgeStack/
├── apps/
│   ├── api/                 # NestJS REST API (Port 4000)
│   ├── web/                 # Next.js Frontend (Port 3000)
│   └── worker/              # BullMQ Background Jobs
├── packages/
│   ├── db/                  # Drizzle ORM + Schema + RLS + RBAC
│   ├── shared/              # Shared types, constants, logger & queue names
│   ├── sdk/                 # TypeScript SDK for API consumption
│   └── ui/                  # Shared UI component library (shadcn/ui based)
├── deploy/                  # Deployment templates
│   ├── fly.api.toml         # Fly.io API configuration
│   ├── fly.web.toml         # Fly.io Web configuration
│   ├── fly.worker.toml      # Fly.io Worker configuration
│   ├── railway.json         # Railway configuration
│   └── render.yaml          # Render configuration
├── docker/                  # Observability stack configs
│   ├── grafana/             # Grafana dashboards
│   ├── prometheus/          # Prometheus config
│   ├── tempo/               # Tempo tracing config
│   └── loki/                # Loki logging config
├── docs/
│   ├── specs/               # Feature specifications
│   └── proposals/           # Feature proposals & roadmap
├── docker-compose.yml            # Local development services
├── docker-compose.prod.yml       # Production deployment
└── turbo.json                    # Turborepo configuration
```

| Package | Description |
|---------|-------------|
| `apps/api` | NestJS backend with REST endpoints, authentication, RBAC, admin panel, and business logic |
| `apps/web` | Next.js frontend with App Router, marketing pages, docs site, onboarding, and dashboard |
| `apps/worker` | Background job processor for emails, webhooks, usage aggregation, and cleanup tasks |
| `packages/db` | Database schema (26 tables), migrations, RLS policies, RBAC tables, and Drizzle client |
| `packages/shared` | Centralized types, constants, Pino logger factory, and queue name definitions |
| `packages/emails` | React Email templates for transactional emails (Welcome, Invitation, Password Reset, etc.) |
| `packages/sdk` | TypeScript SDK for external API consumption with typed methods |
| `packages/ui` | Reusable UI component library with shadcn/ui primitives, compound components, and Storybook |
| `deploy/` | Platform-specific deployment configurations (Fly.io, Railway, Render) |

---

## 🗄️ Database Schema

ForgeStack uses **26 PostgreSQL tables** with Drizzle ORM and Row-Level Security:

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with auth, profile, suspension status |
| `organizations` | Multi-tenant organizations with settings |
| `organization_members` | User-org membership with legacy role |
| `projects` | Organization projects with metadata |
| `invitations` | Pending member invitations with tokens |

### RBAC Tables

| Table | Description |
|-------|-------------|
| `roles` | System and custom roles per organization |
| `permissions` | Available permissions (resource:action format) |
| `role_permissions` | Many-to-many role-permission mapping |
| `member_roles` | User role assignments within organizations |

### Billing & Usage Tables

| Table | Description |
|-------|-------------|
| `customers` | Stripe customer records per organization |
| `subscriptions` | Active subscription details |
| `plans` | Available subscription plans |
| `usage_records` | API call, storage, and seat usage tracking |
| `usage_limits` | Plan-based usage limits |
| `billing_events` | Billing event history |

### Feature & Content Tables

| Table | Description |
|-------|-------------|
| `feature_flags` | Feature flag definitions with rules |
| `files` | File metadata for R2/S3 uploads |
| `activities` | Activity feed entries |
| `notifications` | In-app notifications with read status |
| `audit_logs` | Organization-scoped audit trail |
| `platform_audit_logs` | Platform-wide admin actions |

### Webhook Tables

| Table | Description |
|-------|-------------|
| `webhook_endpoints` | Registered outgoing webhook URLs |
| `webhook_deliveries` | Delivery attempts with status |
| `incoming_webhook_events` | Received webhook events (Stripe) |

### API Key Table

| Table | Description |
|-------|-------------|
| `api_keys` | API keys with scopes and hashed secrets |

---

## 📋 Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| [Node.js](https://nodejs.org/) | 20.9+ | JavaScript runtime (required by Next.js 16) |
| [pnpm](https://pnpm.io/) | 9.14+ | Package manager |
| [Docker](https://www.docker.com/) | Latest | PostgreSQL & Redis containers |

---

## 🚀 Getting Started

> **Note:** If you're using this as a template, first follow the [Use This Template](#-use-this-template) section above.

### 1. Clone and Initialize

```bash
# If using as a template (creates your own project):
# Use the GitHub "Use this template" button, then:
git clone https://github.com/your-org/your-project.git
cd your-project
pnpm install
pnpm init  # Interactive setup to customize branding

# If developing ForgeStack itself:
git clone https://github.com/PulseDevLabs/ForgeStack.git
cd ForgeStack
pnpm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### 3. Configure Environment

```bash
# Copy the environment template to create your local config
cp .env.example .env

# Edit with your values (see Environment Variables section)
# All apps (api, web, worker) load from this single root .env file
```

### 4. Run Database Migrations

```bash
cd packages/db
pnpm db:push      # Apply schema
pnpm db:migrate   # Apply RLS policies
```

### 5. Start Development Servers

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
│   │   └── src/
│   │       ├── activities/        # Activity feed module
│   │       ├── admin/             # Super admin modules
│   │       │   ├── admin-organizations/  # Org management (suspend, transfer)
│   │       │   ├── admin-users/          # User management (suspend, delete)
│   │       │   └── platform-audit/       # Platform-wide audit logs
│   │       ├── api-keys/          # API key management with scopes
│   │       ├── audit-logs/        # Organization compliance audit logs
│   │       ├── auth/              # Authentication (better-auth)
│   │       ├── billing/           # Stripe billing (checkout, portal, invoices)
│   │       ├── core/              # Guards, decorators, interceptors, filters
│   │       ├── dashboard/         # Dashboard summary stats
│   │       ├── feature-flags/     # Feature flags with org overrides
│   │       ├── files/             # File upload (R2/S3) with signed URLs
│   │       ├── health/            # Health check endpoint
│   │       ├── incoming-webhooks/ # Stripe webhook processing
│   │       ├── invitations/       # Member invitation system
│   │       ├── members/           # Organization members & role assignment
│   │       ├── notifications/     # In-app & email notifications
│   │       ├── organizations/     # Organization CRUD
│   │       ├── permissions/       # Permissions listing (RBAC)
│   │       ├── projects/          # Projects CRUD
│   │       ├── queue/             # BullMQ queue service
│   │       ├── rate-limiting/     # Plan-based API rate limiting
│   │       ├── roles/             # Custom roles (RBAC)
│   │       ├── telemetry/         # OpenTelemetry + Pino logging
│   │       ├── usage/             # Usage tracking & limits
│   │       ├── users/             # User profile management
│   │       └── webhooks/          # Outgoing webhook endpoints & delivery
│   │
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/        # Login, signup, invitation accept
│   │       │   ├── (marketing)/   # Landing page, features, pricing
│   │       │   ├── (onboarding)/  # Guided onboarding flow
│   │       │   ├── (protected)/   # Authenticated app pages
│   │       │   │   ├── admin/     # Feature flags admin
│   │       │   │   ├── dashboard/ # Main dashboard
│   │       │   │   ├── activities/# Activity feed
│   │       │   │   ├── notifications/ # Notifications page
│   │       │   │   ├── organizations/ # Org list, create, members
│   │       │   │   ├── projects/  # Project list, detail, edit
│   │       │   │   └── settings/  # All settings pages
│   │       │   ├── (super-admin)/ # Platform admin panel
│   │       │   ├── api/           # Next.js API routes (auth, health)
│   │       │   └── docs/          # MDX documentation site
│   │       ├── components/        # 24 component directories
│   │       ├── hooks/             # 27 custom React hooks
│   │       ├── lib/               # API client, auth, utilities
│   │       └── types/             # 16 TypeScript type files
│   │
│   └── worker/
│       └── src/
│           ├── handlers/          # 14 job handlers
│           │   ├── welcome-email.handler.ts
│           │   ├── send-invitation.handler.ts
│           │   ├── notification-email.handler.ts
│           │   ├── webhook-delivery.handler.ts
│           │   ├── audit-log.handler.ts
│           │   ├── activity.handler.ts
│           │   ├── stripe-webhook.handler.ts
│           │   ├── stripe-usage-report.handler.ts
│           │   ├── usage-aggregation.handler.ts
│           │   ├── active-seats.handler.ts
│           │   ├── cleanup-deleted-files.handler.ts
│           │   ├── cleanup-orphaned-files.handler.ts
│           │   ├── incoming-webhook-processing.handler.ts
│           │   └── ai-task.handler.ts
│           ├── services/          # Email service (Resend)
│           └── telemetry/         # OpenTelemetry + logging
│
├── packages/
│   ├── db/
│   │   └── src/
│   │       ├── schema/            # 26 Drizzle table definitions
│   │       ├── seed/              # RBAC & data seed scripts
│   │       ├── context.ts         # Tenant context & RLS
│   │       └── index.ts           # Exports
│   │
│   ├── shared/
│   │   └── src/
│   │       ├── types/             # 8 shared type modules
│   │       ├── browser.ts         # Browser-safe exports
│   │       ├── constants.ts       # Validation constants
│   │       ├── logger.ts          # Pino logger factory
│   │       ├── queues.ts          # Queue name definitions
│   │       └── index.ts           # Main exports
│   │
│   ├── sdk/
│   │   └── src/
│   │       ├── client.ts          # API client implementation
│   │       ├── types.ts           # SDK types
│   │       └── index.ts           # Exports
│   │
│   └── ui/
│       └── src/
│           ├── components/        # 22 base + 4 compound components
│           ├── hooks/             # use-toast
│           ├── lib/               # cn utility
│           ├── tokens/            # Design tokens (colors, spacing, typography)
│           └── styles.css         # Global styles
│
├── deploy/                        # Platform deployment configs
├── docker/                        # Observability stack configs
└── docs/                          # Specs & proposals
```

### Worker Job Handlers

The worker processes 14 different job types:

| Handler | Queue | Description |
|---------|-------|-------------|
| `welcome-email` | `email` | Send welcome email to new users |
| `send-invitation` | `email` | Send member invitation emails |
| `notification-email` | `email` | Send notification emails |
| `webhook-delivery` | `webhooks` | Deliver outgoing webhooks with retries |
| `audit-log` | `audit` | Process and store audit log entries |
| `activity` | `activity` | Process activity feed entries |
| `stripe-webhook` | `stripe` | Process incoming Stripe webhooks |
| `stripe-usage-report` | `billing` | Report usage to Stripe for metered billing |
| `usage-aggregation` | `usage` | Aggregate usage data (daily/monthly) |
| `active-seats` | `usage` | Count active seats for billing |
| `cleanup-deleted-files` | `files` | Remove soft-deleted files from storage |
| `cleanup-orphaned-files` | `files` | Clean up orphaned file uploads |
| `incoming-webhook-processing` | `webhooks` | Process incoming webhook events |
| `ai-task` | `ai-task` | Process background AI tasks (generate, summarize, extract) |

---

## 📦 Package Exports

### @forgestack/shared

The shared package provides multiple entry points for different environments:

| Import Path | Description | Environment |
|-------------|-------------|-------------|
| `@forgestack/shared` | Full exports (types, constants, logger, queues) | Node.js |
| `@forgestack/shared/browser` | Browser-safe exports (types, constants only) | Browser |
| `@forgestack/shared/types` | Type definitions only | Both |
| `@forgestack/shared/constants` | Validation constants | Both |
| `@forgestack/shared/logger` | Pino logger factory with OpenTelemetry | Node.js |
| `@forgestack/shared/queues` | BullMQ queue name definitions | Node.js |

**Shared Types:**

```typescript
// Import in browser (Next.js client components)
import { OrgRole, PaginatedResponse, WebhookEventType } from '@forgestack/shared/browser';

// Import in Node.js (API, Worker)
import { createLogger, QUEUE_NAMES } from '@forgestack/shared';
```

### @forgestack/sdk

TypeScript SDK for external API consumption:

```typescript
import { ForgeStackClient } from '@forgestack/sdk';

const client = new ForgeStackClient({
  baseUrl: 'https://api.yourapp.com',
  apiKey: 'fsk_xxxxxxxxxxxx',
});

const projects = await client.projects.list();
```

### @forgestack/ui

Shared UI component library:

```typescript
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, StatCard } from '@forgestack/ui';
import { useToast } from '@forgestack/ui';
```

### @forgestack/emails

React Email templates for transactional emails:

```typescript
import { WelcomeEmail, InvitationEmail, PasswordResetEmail } from '@forgestack/emails';
import { render } from '@react-email/render';

// Render to HTML string
const html = await render(WelcomeEmail({ userName: 'John', appName: 'MyApp' }));
```

**Available Templates:**
- `WelcomeEmail` - New user welcome
- `InvitationEmail` - Team invitation
- `PasswordResetEmail` - Password reset link
- `NotificationEmail` - Generic notification
- `SubscriptionConfirmedEmail` - Subscription confirmation
- `PaymentFailedEmail` - Payment failure alert

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

ForgeStack uses a **single `.env` file at the project root** for all apps. Copy `.env.example` and configure your values:

```bash
cp .env.example .env
```

### Core Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgestack_dev"

# Redis (required for BullMQ, rate limiting, caching)
REDIS_URL="redis://localhost:6379"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"  # Generate: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# URLs
APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
```

### Stripe Billing (V2)

```bash
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"
STRIPE_PRICE_ID_STARTER="price_xxxxxxxxxxxx"
STRIPE_PRICE_ID_PRO="price_xxxxxxxxxxxx"
STRIPE_PRICE_ID_ENTERPRISE="price_xxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC="price_xxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO="price_xxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE="price_xxxxxxxxxxxx"
```

### Cloudflare R2 (V2)

```bash
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="forgestack-files"
R2_PUBLIC_URL="https://files.yourdomain.com"
```

See `.env.example` for the complete list with documentation.

---

## 🌐 Web App Routes

### Public Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/features` | Features overview |
| `/pricing` | Pricing plans |
| `/login` | User login |
| `/signup` | User registration |
| `/docs` | Documentation site |
| `/docs/*` | Documentation pages |

### Protected Routes (Authenticated)

| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard with stats |
| `/organizations` | Organization list |
| `/organizations/new` | Create organization |
| `/organizations/:id/members` | Manage members |
| `/projects` | Project list |
| `/projects/:id` | Project details |
| `/projects/:id/edit` | Edit project |
| `/activities` | Activity feed |
| `/notifications` | Notifications center |

### Settings Routes

| Route | Description |
|-------|-------------|
| `/settings/profile` | User profile settings |
| `/settings/organization` | Organization settings |
| `/settings/api-keys` | API key management |
| `/settings/webhooks` | Webhook endpoints |
| `/settings/roles` | Custom role management |
| `/settings/roles/:roleId` | Edit role permissions |
| `/settings/billing` | Subscription & billing |
| `/settings/billing/invoices` | Invoice history |
| `/settings/audit-logs` | Organization audit logs |
| `/settings/notifications` | Notification preferences |
| `/settings/features` | Feature flag status |

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/feature-flags` | Feature flag management |

### Super Admin Routes (Platform)

| Route | Description |
|-------|-------------|
| `/super-admin` | Platform dashboard |
| `/super-admin/users` | User management |
| `/super-admin/users/:id` | User details |
| `/super-admin/organizations` | Organization management |
| `/super-admin/organizations/:id` | Organization details |
| `/super-admin/audit-logs` | Platform audit logs |

### Onboarding Routes

| Route | Description |
|-------|-------------|
| `/onboarding` | Onboarding flow start |
| `/onboarding/create-org` | Create first organization |
| `/onboarding/choose-plan` | Select subscription plan |
| `/onboarding/invite-team` | Invite team members |
| `/onboarding/complete` | Onboarding complete |

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

### Organization & Role-Based Access Control

ForgeStack uses a granular RBAC system with customizable roles and permissions:

```
User creates org → Assigned OWNER role → Full access (wildcard *)
                                       → Can create custom roles
                                       → Can assign roles to members

Member joins     → Assigned MEMBER role → Standard CRUD permissions
                                        → Can be upgraded to Admin/custom roles
```

**System Roles (cannot be modified):**

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Full access to all resources | `*` (wildcard) |
| **Admin** | Administrative access | All except `roles:*` and `billing:manage` |
| **Member** | Standard team member | Create/read/update projects, view members |
| **Viewer** | Read-only access | All `*:read` permissions |

**Permission Format:** `resource:action` (e.g., `projects:create`, `members:update`)

**Supported Resources:** projects, members, billing, settings, api_keys, webhooks, audit_logs, roles, files, notifications, feature_flags

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
- Organization context header (`X-Org-Id`) for org-scoped endpoints

Alternatively, use API key authentication:
- Header: `X-API-Key: fsk_xxxxxxxxxxxx`

### Core Endpoints

#### Health & Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Liveness check (always returns 200) | No |
| `GET` | `/health/ready` | Readiness check (verifies DB + Redis connectivity) | No |
| `GET` | `/auth/me` | Current user info | Yes |

#### Organizations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/organizations` | List user's orgs | Yes* |
| `POST` | `/organizations` | Create org | Yes* |
| `GET` | `/organizations/:id` | Get org details | Yes |
| `PATCH` | `/organizations/:id` | Update org | OWNER |
| `DELETE` | `/organizations/:id` | Delete org | OWNER |

#### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/projects` | List projects | Yes |
| `POST` | `/projects` | Create project | Yes |
| `GET` | `/projects/:id` | Get project | Yes |
| `PATCH` | `/projects/:id` | Update project | Yes |
| `DELETE` | `/projects/:id` | Delete project | OWNER |

#### Members & Invitations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/organizations/:orgId/members` | List members | Yes |
| `PATCH` | `/organizations/:orgId/members/:userId` | Update member role | OWNER |
| `DELETE` | `/organizations/:orgId/members/:userId` | Remove member | OWNER |
| `POST` | `/organizations/:orgId/invitations` | Send invite | OWNER |
| `GET` | `/organizations/:orgId/invitations` | List invitations | OWNER |
| `DELETE` | `/organizations/:orgId/invitations/:id` | Cancel invite | OWNER |
| `POST` | `/invitations/accept` | Accept invite | Yes* |
| `POST` | `/invitations/decline` | Decline invite | Yes* |

#### Dashboard & Activities

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard/summary` | Dashboard stats | Yes |
| `GET` | `/activities` | List activities | Yes |
| `GET` | `/activities/recent` | Recent activities | Yes |

#### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `PATCH` | `/users/me/profile` | Update profile | Yes* |
| `POST` | `/users/me/change-password` | Change password | Yes* |
| `POST` | `/users/me/change-email` | Change email | Yes* |
| `GET` | `/users/me/onboarding-status` | Get onboarding status | Yes* |
| `POST` | `/users/me/complete-onboarding` | Complete onboarding | Yes* |

> *Endpoints marked with `*` do not require `X-Org-Id` header

---

## 🆕 V2 Features

ForgeStack V2 introduces enterprise-grade features for production SaaS applications.

### 🛠️ Super Admin Panel

Platform-wide administration for managing users and organizations:

| Feature | Description |
|---------|-------------|
| **User Management** | List, view, suspend/unsuspend, delete users |
| **Org Management** | List, view, suspend/unsuspend, transfer ownership, delete orgs |
| **Platform Audit Logs** | Track all admin actions across the platform |
| **Dashboard** | Platform-wide statistics and health overview |

**Super Admin Routes:**
- `/super-admin` - Dashboard with platform stats
- `/super-admin/users` - User management table
- `/super-admin/organizations` - Organization management table
- `/super-admin/audit-logs` - Platform-wide audit trail

### 🔒 Granular RBAC with Permissions

Role-based access control with fine-grained permissions:

| Feature | Description |
|---------|-------------|
| **Custom Roles** | Create org-specific roles beyond system defaults |
| **33 Permissions** | Fine-grained permissions across 11 resources |
| **Permission Guards** | `@RequirePermission('resource:action')` decorator |
| **Wildcard Support** | `*` for all permissions, `resource:*` for all actions |
| **Frontend Gates** | `<PermissionGate>` component and `usePermission` hook |

```typescript
// Backend: Protect endpoints with permissions
@RequirePermission('projects:delete')
@Delete(':id')
async deleteProject(@Param('id') id: string) { ... }

// Frontend: Conditional rendering based on permissions
<PermissionGate permission="members:invite">
  <InviteButton />
</PermissionGate>

// Frontend: Check permissions in hooks
const canInvite = usePermission('members:invite');
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/roles` | List all roles (system + custom) |
| `POST` | `/roles` | Create custom role |
| `PATCH` | `/roles/:id` | Update custom role |
| `DELETE` | `/roles/:id` | Delete custom role |
| `GET` | `/permissions` | List all permissions |
| `POST` | `/members/:userId/roles` | Assign roles to member |
| `GET` | `/members/:userId/roles` | Get member's roles |

### 💳 Billing & Subscriptions (Stripe)

Full Stripe integration for subscription management:

| Feature | Description |
|---------|-------------|
| **Subscription Plans** | Free, Starter, Pro, Enterprise tiers |
| **Checkout** | Stripe Checkout for seamless payments |
| **Customer Portal** | Self-service subscription management |
| **Webhook Handling** | Automatic subscription sync |
| **Usage Metering** | Track and bill by usage (optional) |

```typescript
// Create checkout session
const session = await billingService.createCheckoutSession(orgId, 'pro');

// Check subscription status
const subscription = await billingService.getSubscription(orgId);
```

### 📁 File Uploads (Cloudflare R2)

S3-compatible file storage with security features:

| Feature | Description |
|---------|-------------|
| **Signed URLs** | Secure upload/download URLs |
| **File Limits** | Plan-based storage limits |
| **MIME Validation** | Whitelist allowed file types |
| **Org Isolation** | Files scoped to organizations |

```typescript
// Get signed upload URL
const { uploadUrl, fileId } = await filesService.getUploadUrl(ctx, 'avatar.jpg');

// Get signed download URL
const downloadUrl = await filesService.getDownloadUrl(ctx, fileId);
```

### 🔑 API Keys

Secure API key management for external integrations:

| Feature | Description |
|---------|-------------|
| **Key Generation** | Secure random key generation |
| **Scoped Permissions** | Read, write, admin scopes |
| **Key Rotation** | Rotate without downtime |
| **Usage Tracking** | Track last used timestamp |

```typescript
// Authenticate with API key
// Header: X-API-Key: fsk_xxxxxxxxxxxx
const { org, permissions } = await apiKeyService.validate(key);
```

### 🪝 Webhooks

**Outgoing Webhooks** — Send events to external endpoints:

| Feature | Description |
|---------|-------------|
| **Event Types** | project.created, member.invited, etc. |
| **Retry Logic** | Exponential backoff (3 attempts) |
| **Signatures** | HMAC-SHA256 for verification |
| **Delivery Logs** | Track delivery status |

```typescript
// Register webhook endpoint
await webhookService.createEndpoint(ctx, {
  url: 'https://example.com/webhook',
  events: ['project.created', 'member.invited'],
});
```

**Incoming Webhooks** — Receive webhooks from Stripe:

| Feature | Description |
|---------|-------------|
| **Signature Verification** | Verify Stripe signatures |
| **Idempotency** | Prevent duplicate processing |
| **Event Storage** | Store for debugging |

### 📋 Audit Logs

Immutable compliance logging for security and auditing:

| Feature | Description |
|---------|-------------|
| **Immutable** | Append-only, no updates/deletes |
| **Comprehensive** | Who, what, when, where |
| **Searchable** | Filter by actor, action, resource |
| **Export** | CSV/JSON export for compliance |

```typescript
// Automatic logging via AuditLogsService
await auditLogsService.log(ctx, {
  action: 'member.role_changed',
  resourceType: 'member',
  resourceId: userId,
  metadata: { oldRole: 'MEMBER', newRole: 'OWNER' },
});
```

### 📊 Activity Feed

Real-time activity timeline for users:

| Feature | Description |
|---------|-------------|
| **Timeline** | Chronological activity stream |
| **Aggregation** | Group related activities |
| **Filtering** | By type, date, resource |
| **Pagination** | Cursor-based pagination |

### 🔔 Notifications

In-app and email notifications with user preferences:

| Feature | Description |
|---------|-------------|
| **In-App** | Real-time notification bell |
| **Email** | Configurable email delivery |
| **Preferences** | Per-type enable/disable |
| **Priority** | High, medium, low priority |

**Notification Types:**
- `member.invited`, `member.role_changed` (High)
- `project.shared`, `webhook.failed` (Medium)
- `member.joined`, `project.created` (Low)

### 🚩 Feature Flags

Dynamic feature gating without deployments:

| Feature | Description |
|---------|-------------|
| **Plan-Based** | Enable features by subscription |
| **Percentage** | Gradual rollout (0-100%) |
| **Overrides** | Per-org enable/disable |
| **Caching** | Fast flag evaluation |

```typescript
// Check if feature is enabled
if (await featureFlags.isEnabled(ctx, 'advanced-analytics')) {
  // Show advanced analytics
}
```

**Predefined Flags:**
| Flag | Type | Plans |
|------|------|-------|
| `advanced-analytics` | plan | pro, enterprise |
| `api-access` | plan | pro, enterprise |
| `audit-logs` | plan | enterprise |
| `sso` | plan | enterprise |
| `beta-features` | boolean | (manual) |

### ⚡ Rate Limiting

Plan-based API rate limiting with Redis:

| Plan | Per Minute | Per Hour | Per Day |
|------|------------|----------|---------|
| Free | 100 | 1,000 | 10,000 |
| Starter | 500 | 10,000 | 100,000 |
| Pro | 2,000 | 50,000 | 500,000 |
| Enterprise | 10,000 | Unlimited | Unlimited |

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
Retry-After: 45  (only on 429)
```

### 📈 Usage Tracking & Limits

Track and enforce usage limits per organization:

| Feature | Description |
|---------|-------------|
| **API Call Tracking** | Count API requests per org with daily/monthly aggregation |
| **Storage Metering** | Track file storage usage per org |
| **Seat Counting** | Active seat tracking for billing |
| **Usage Limits** | Plan-based limits with enforcement |
| **Usage History** | Historical usage data for analytics |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/billing/usage` | Current usage summary |
| `GET` | `/billing/usage/history` | Historical usage data |
| `GET` | `/billing/usage/api-calls` | API call breakdown |
| `GET` | `/billing/usage/storage` | Storage usage details |
| `GET` | `/billing/usage/seats` | Active seat count |
| `GET` | `/billing/usage/limits` | Current plan limits |

### 📚 Built-in Documentation Site

MDX-powered documentation with guides and API reference:

| Feature | Description |
|---------|-------------|
| **MDX Support** | Write docs in MDX with React components |
| **API Reference** | Auto-generated API documentation |
| **Guides** | Step-by-step tutorials |
| **Code Blocks** | Syntax-highlighted code examples |
| **Sidebar Navigation** | Organized doc structure |

**Documentation Routes:**
- `/docs` - Documentation home
- `/docs/installation` - Installation guide
- `/docs/quickstart` - Quick start tutorial
- `/docs/api` - API reference
- `/docs/sdk` - SDK documentation
- `/docs/guides` - How-to guides

### 🎯 Guided Onboarding

Step-by-step onboarding flow for new users:

| Step | Description |
|------|-------------|
| **Welcome** | Introduction to the platform |
| **Create Org** | Set up first organization |
| **Choose Plan** | Select subscription plan |
| **Invite Team** | Invite initial team members |
| **Complete** | Success and next steps |

### 🤖 AI Integration (Vercel AI SDK)

Built-in AI capabilities powered by Vercel AI SDK:

| Feature | Description |
|---------|-------------|
| **Streaming Chat** | Real-time streaming responses with SSE |
| **Multiple Providers** | OpenAI and Anthropic support out of the box |
| **Rate Limiting** | Per-org token and request limits with Redis |
| **Usage Tracking** | Track tokens used, model costs, and API calls |
| **Background Tasks** | Queue AI tasks for async processing |

```typescript
// Frontend: Use the AI chat hook
const { messages, sendMessage, isStreaming } = useAiChat();

// Backend: Stream AI responses
@Post('chat')
async chat(@Body() dto: ChatDto, @Req() req: Request) {
  return this.aiService.streamChat(req.tenantContext, dto.messages);
}
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/chat` | Stream chat completion |
| `POST` | `/ai/generate` | Generate text (non-streaming) |
| `POST` | `/ai/generate-object` | Generate structured JSON |
| `GET` | `/ai/usage` | Get AI usage statistics |

**Frontend Routes:**
- `/ai` - AI Chat interface

### 🎭 User Impersonation

Admin user impersonation for support and debugging:

| Feature | Description |
|---------|-------------|
| **Session Management** | Start/end impersonation with time limits |
| **Audit Logging** | All impersonation actions logged |
| **Visual Indicator** | Clear banner showing impersonation status |
| **Automatic Timeout** | Sessions expire after configurable duration |
| **Permission Check** | Only super-admins can impersonate |

```typescript
// Start impersonation (super-admin only)
await impersonationService.start(adminId, targetUserId, { expiresIn: 3600 });

// Check if currently impersonating
const isImpersonating = await impersonationService.isActive(sessionId);

// End impersonation
await impersonationService.end(sessionId);
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/impersonation/start` | Start impersonating a user |
| `POST` | `/impersonation/end` | End current impersonation |
| `GET` | `/impersonation/status` | Check impersonation status |

### 📧 React Email Templates

Transactional email templates with React Email:

| Template | Description |
|----------|-------------|
| **WelcomeEmail** | New user welcome message |
| **InvitationEmail** | Team member invitation |
| **PasswordResetEmail** | Password reset link |
| **NotificationEmail** | Generic notification |
| **SubscriptionConfirmedEmail** | Subscription confirmation |
| **PaymentFailedEmail** | Payment failure alert |

```typescript
import { WelcomeEmail, render } from '@forgestack/emails';

const html = await render(WelcomeEmail({ userName: 'John', appName: 'MyApp' }));
await resend.emails.send({ to, subject, html });
```

### 📡 OpenTelemetry Observability

Production-grade observability with distributed tracing, structured logging, and metrics:

| Feature | Description |
|---------|-------------|
| **Distributed Tracing** | OpenTelemetry traces with Tempo/Jaeger export |
| **Structured Logging** | Pino JSON logs with trace correlation (shared logger factory) |
| **Metrics** | Prometheus-compatible metrics endpoint |
| **Auto-Instrumentation** | HTTP, PostgreSQL, Redis, BullMQ |
| **Log Aggregation** | Loki-compatible log forwarding |

**Configuration:**

```bash
# Enable OpenTelemetry
OTEL_ENABLED=true
OTEL_SERVICE_NAME=forgestack-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318

# Log level
LOG_LEVEL=info  # debug, info, warn, error
```

**Observability Stack:**

Start the full observability stack with the configs in `/docker/`:

| Service | Port | Purpose |
|---------|------|---------|
| Grafana | 3001 | Dashboards & visualization |
| Tempo | 3200 | Distributed tracing |
| Loki | 3100 | Log aggregation |
| Prometheus | 9090 | Metrics collection |

**Trace Correlation:**

All logs include trace IDs for correlation via the shared logger factory:

```typescript
// Using the shared logger factory
import { createLogger } from '@forgestack/shared';
const logger = createLogger({ module: 'MyService' });
logger.info('Project created', { projectId: 'xxx' });
```

Output:
```json
{
  "level": "info",
  "time": 1700000000000,
  "msg": "Project created",
  "traceId": "abc123...",
  "spanId": "def456...",
  "projectId": "xxx",
  "service": "forgestack-api"
}
```

### 🎨 Shared UI Component Library

Reusable UI components with Storybook documentation:

| Component Type | Examples |
|----------------|----------|
| **Base Components** | Button, Card, Input, Select, Dialog, Table, Tabs, etc. |
| **Compound Components** | ConfirmDialog, EmptyState, PageHeader, StatCard |
| **Design Tokens** | Colors, spacing, typography scales |

**Usage:**

```typescript
import { Button, Card, ConfirmDialog } from '@forgestack/ui';
import { useToast } from '@forgestack/ui';
```

**Storybook:**

```bash
cd packages/ui && pnpm storybook
```

### 🐳 Docker & Deployment

Production-ready containerization with multi-stage builds:

| Feature | Description |
|---------|-------------|
| **Multi-Stage Builds** | Optimized images (~150MB for API) |
| **Health Checks** | Built-in container health checks |
| **Non-Root User** | Security-hardened containers |
| **Platform Templates** | Fly.io, Railway, Render configs |

**Build Images:**

```bash
# Build all images
docker build -t forgestack-api -f apps/api/Dockerfile .
docker build -t forgestack-web -f apps/web/Dockerfile .
docker build -t forgestack-worker -f apps/worker/Dockerfile .
```

**Deployment Templates:**

| Platform | Config Files |
|----------|-------------|
| Fly.io | `deploy/fly.api.toml`, `deploy/fly.web.toml`, `deploy/fly.worker.toml` |
| Railway | `deploy/railway.json` |
| Render | `deploy/render.yaml` |
| Docker Compose | `docker-compose.prod.yml` |

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

# Observability (optional but recommended)
OTEL_ENABLED=true
OTEL_SERVICE_NAME=forgestack-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
LOG_LEVEL=info
```

### Docker Deployment

```bash
# Build production images
docker build -t forgestack-api -f apps/api/Dockerfile .
docker build -t forgestack-web -f apps/web/Dockerfile .
docker build -t forgestack-worker -f apps/worker/Dockerfile .

# Run with Docker Compose (production)
docker-compose -f docker-compose.prod.yml up -d

# Run with observability stack
docker-compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d
```

### Platform Deployments

Pre-configured deployment templates are available in the `deploy/` directory:

| Platform | Command | Notes |
|----------|---------|-------|
| **Fly.io** | `fly deploy` | Uses `deploy/fly.toml` |
| **Railway** | Connect via Dashboard | Uses `deploy/railway.toml` |
| **Render** | Connect via Dashboard | Uses `deploy/render.yaml` |

### GitHub Actions CI/CD

The repository includes a GitHub Actions workflow for automated Docker builds:

```yaml
# .github/workflows/docker-build.yml
# Triggers on push to main branch
# Builds and pushes images to container registry
```

---

## 🤖 AI-Assisted Development

ForgeStack includes comprehensive AI context documentation in the `.ai/` directory, designed to work with any AI coding assistant (Cursor, Windsurf, Copilot, Augment, Claude, GPT, etc.).

### Quick Start

```bash
# When starting a new feature, point your AI to:
"Read .ai/README.md for project context, then help me implement [feature]"

# For specific patterns:
"Follow .ai/patterns/api-endpoint.md to create a Tasks endpoint"

# For debugging:
"Use .ai/troubleshooting.md to help debug this RLS issue"
```

### AI Context Structure

```
.ai/
├── README.md              # Usage guide for AI assistants
├── architecture.md        # System overview
├── conventions.md         # Code style and naming conventions
├── troubleshooting.md     # Common issues and solutions
├── agents/                # Sub-agent workflow definitions
│   ├── spec-writer.md     # Specification writing agent
│   ├── backend.md         # Backend implementation agent
│   ├── frontend.md        # Frontend implementation agent
│   └── code-review.md     # Code review agent
├── features/              # Feature-specific documentation
│   ├── authentication.md  # better-auth integration
│   ├── multi-tenancy.md   # RLS and tenant context
│   ├── billing.md         # Stripe integration
│   ├── api-keys.md        # API key management
│   └── webhooks.md        # Outgoing and incoming webhooks
├── patterns/              # Implementation patterns
│   ├── api-endpoint.md    # NestJS endpoint creation
│   ├── database-query.md  # Drizzle ORM with RLS
│   ├── background-job.md  # BullMQ job creation
│   └── react-hook.md      # SWR data fetching
├── prompts/               # Reusable prompt templates
│   ├── create-endpoint.md # API endpoint prompt
│   ├── create-job.md      # Background job prompt
│   ├── add-feature.md     # Full-stack feature prompt
│   ├── write-tests.md     # Test writing prompt
│   ├── add-page.md        # Next.js page prompt
│   ├── add-component.md   # React component prompt
│   └── debug-issue.md     # Debugging prompt
└── schemas/
    └── overview.md        # Database schema summary
```

### Key Benefits

- **Model-Agnostic**: Works with any LLM (Claude, GPT, Gemini, etc.)
- **IDE-Agnostic**: No vendor lock-in to specific tools
- **Copy-Paste Friendly**: Plain Markdown for easy sharing
- **Self-Contained**: Each document provides complete context

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
