# ForgeStack Setup Guide

A comprehensive step-by-step guide for setting up ForgeStack from the GitHub template.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| **Node.js** | 20.9+ | [Download](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm) |
| **pnpm** | 9.14+ | `npm install -g pnpm@9.14.2` |
| **Docker Desktop** | Latest | [Download](https://www.docker.com/products/docker-desktop) |
| **Git** | Latest | [Download](https://git-scm.com/) |

### Required Accounts

You'll need accounts for the following services:

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **GitHub** | Repository hosting | [github.com](https://github.com) |
| **Stripe** | Billing & subscriptions | [stripe.com](https://stripe.com) |
| **Resend** | Transactional emails | [resend.com](https://resend.com) |
| **Cloudflare** | R2 file storage | [cloudflare.com](https://cloudflare.com) |

### Optional Services

| Service | Purpose | Sign Up Link |
|---------|---------|--------------|
| **Neon** | Managed PostgreSQL | [neon.tech](https://neon.tech) |
| **Supabase** | Managed PostgreSQL | [supabase.com](https://supabase.com) |
| **Upstash** | Managed Redis | [upstash.com](https://upstash.com) |
| **Grafana Cloud** | Observability | [grafana.com](https://grafana.com) |
| **Honeycomb** | Observability | [honeycomb.io](https://honeycomb.io) |

---

## 🚀 Quick Start

### 1. Create Repository from Template

1. Go to the [ForgeStack GitHub repository](https://github.com/your-org/forgestack)
2. Click the **"Use this template"** button
3. Select **"Create a new repository"**
4. Choose a repository name (e.g., `my-saas-app`)
5. Select visibility (Public or Private)
6. Click **"Create repository"**

### 2. Clone Your Repository

```bash
git clone https://github.com/your-username/my-saas-app.git
cd my-saas-app
```

### 3. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all packages and apps in the monorepo.

### 4. Start Local Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

Verify services are running:
```bash
docker-compose ps
```

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration. For local development, the defaults work out of the box. See [Configuration Deep Dive](#-configuration-deep-dive) for production setup.

### 6. Set Up Database

```bash
cd packages/db
pnpm db:push      # Apply schema to database
pnpm db:migrate   # Apply RLS policies and migrations
pnpm db:seed      # Seed with test data (optional)
cd ../..
```

This creates:
- 26 database tables
- Row-Level Security (RLS) policies
- RBAC permissions and roles
- Test users and organizations (if seeded)

### 7. Create a Super-Admin User

Super-admin users have platform-wide access and can:
- Impersonate any user (for support purposes)
- Access the `/admin` panel
- Manage platform-wide settings
- View all organizations (bypasses RLS)

#### Option A: Via Database Seed (Development)

The seed script creates a super-admin user automatically:

```bash
cd packages/db && pnpm db:seed
```

This creates:
- **Email:** `superadmin@forgestack.dev`
- **Name:** `Super Admin`

**Note:** This user doesn't have a password. You'll need to:
1. Sign up with this email first, OR
2. Update the existing user's `is_super_admin` flag (see Option B)

#### Option B: Promote Existing User (Recommended for Production)

After a user signs up normally, promote them to super-admin via SQL:

```bash
# Connect to your database
psql $DATABASE_URL

# Find the user by email
SELECT id, email, name, is_super_admin FROM users WHERE email = 'your-email@example.com';

# Promote to super-admin
UPDATE users SET is_super_admin = true WHERE email = 'your-email@example.com';

# Verify
SELECT id, email, name, is_super_admin FROM users WHERE email = 'your-email@example.com';
```

Or using Docker Compose:

```bash
docker-compose exec postgres psql -U postgres -d forgestack_dev -c \
  "UPDATE users SET is_super_admin = true WHERE email = 'your-email@example.com';"
```

#### Option C: Via Drizzle Studio (Visual)

```bash
cd packages/db && pnpm db:studio
```

1. Open http://localhost:4983 in your browser
2. Navigate to the `users` table
3. Find your user by email
4. Set `is_super_admin` to `true`
5. Save changes

#### Security Notes

⚠️ **Important Security Considerations:**

1. **No API endpoint** - Super-admin status can ONLY be set via direct database access. This is intentional to prevent privilege escalation attacks.

2. **Limit super-admins** - Only create super-admin accounts for trusted platform administrators. Most users should have organization-level roles instead.

3. **Audit access** - All super-admin actions (especially impersonation) are logged in the `audit_logs` table.

4. **Cannot be impersonated** - Super-admin users cannot be impersonated by other super-admins for security.

5. **Session handling** - Super-admin sessions use the same authentication as regular users. Consider using hardware security keys or MFA for super-admin accounts.

### 7. Start Development Servers

```bash
pnpm dev
```

This starts all services in development mode:
- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **Worker**: Background job processor

### 8. Verify Installation

Open your browser and navigate to:
- **Web App**: http://localhost:3000
- **API Health**: http://localhost:4000/health

You should see the ForgeStack landing page and a healthy API response.

---

## 🔧 External Services Setup

### Stripe Setup (Billing & Subscriptions)

Stripe handles subscription billing, checkout, and customer portal.

#### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Switch to **Test Mode** (toggle in top-right)

#### 2. Get API Keys

1. Go to [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
   ```

#### 3. Create Products & Prices

1. Go to [Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **"+ Add product"**
3. Create three products:

**Starter Plan:**
- Name: `Starter`
- Description: `For small teams`
- Pricing: `$29/month` (recurring)
- Copy the **Price ID** (starts with `price_`)

**Pro Plan:**
- Name: `Pro`
- Description: `For growing teams`
- Pricing: `$99/month` (recurring)
- Copy the **Price ID**

**Enterprise Plan:**
- Name: `Enterprise`
- Description: `For large organizations`
- Pricing: `$299/month` (recurring)
- Copy the **Price ID**

4. Add Price IDs to `.env`:
   ```bash
   STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxx
   STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxx
   ```

#### 4. Set Up Webhook Endpoint

Webhooks keep your database in sync with Stripe events (subscriptions, payments, etc.).

**For Local Development:**

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local API:
   ```bash
   stripe listen --forward-to localhost:4000/api/v1/incoming-webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
   ```

**For Production:**

1. Go to [Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL: `https://api.yourdomain.com/api/v1/incoming-webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** and add to production `.env`

---

### Resend Setup (Transactional Emails)

Resend handles all transactional emails (welcome, invitations, notifications, etc.).

#### 1. Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Verify your email address

#### 2. Verify Your Domain

1. Go to [Dashboard → Domains](https://resend.com/domains)
2. Click **"+ Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)
5. Wait for verification (usually 5-10 minutes)

**For Development:** You can use Resend's test domain (`onboarding@resend.dev`) without verification, but emails will only be sent to your verified email address.

#### 3. Get API Key

1. Go to [Dashboard → API Keys](https://resend.com/api-keys)
2. Click **"+ Create API Key"**
3. Name: `ForgeStack Development` (or `Production`)
4. Permission: **Sending access**
5. Copy the API key (starts with `re_`)
6. Add to `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=ForgeStack <noreply@yourdomain.com>
   ```

**Note:** The `EMAIL_FROM` address must use your verified domain.

---

### Cloudflare R2 Setup (File Storage)

Cloudflare R2 provides S3-compatible object storage for file uploads.

#### 1. Create Cloudflare Account

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Complete account verification

#### 2. Create R2 Bucket

1. Go to [Dashboard → R2](https://dash.cloudflare.com/r2)
2. Click **"Create bucket"**
3. Bucket name: `forgestack-uploads` (or your preferred name)
4. Location: Choose closest to your users
5. Click **"Create bucket"**

#### 3. Get Account ID

1. In the R2 dashboard, look at the URL or sidebar
2. Your Account ID is displayed (format: `abc123def456...`)
3. Add to `.env`:
   ```bash
   R2_ACCOUNT_ID=your_account_id
   ```

#### 4. Create API Token

1. Go to **R2 → Manage R2 API Tokens**
2. Click **"Create API token"**
3. Token name: `ForgeStack`
4. Permissions: **Object Read & Write**
5. TTL: **Forever** (or set expiration)
6. Click **"Create API token"**
7. Copy the **Access Key ID** and **Secret Access Key**
8. Add to `.env`:
   ```bash
   R2_ACCESS_KEY_ID=your_access_key_id
   R2_SECRET_ACCESS_KEY=your_secret_access_key
   R2_BUCKET_NAME=forgestack-uploads
   ```

#### 5. Configure CORS (Optional)

If you need direct browser uploads:

1. Go to your bucket → **Settings** → **CORS Policy**
2. Add CORS rule:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

#### 6. Set Up Public Access (Optional)

For public file downloads via CDN:

1. Go to your bucket → **Settings** → **Public Access**
2. Enable **Public Access**
3. Or set up a **Custom Domain**:
   - Go to **Custom Domains**
   - Add domain: `files.yourdomain.com`
   - Add CNAME record to your DNS
4. Add to `.env`:
   ```bash
   R2_PUBLIC_URL=https://files.yourdomain.com
   ```

---

### Database Options

ForgeStack supports multiple PostgreSQL providers:

#### Option 1: Local PostgreSQL (Default)

Already running via Docker Compose:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgestack_dev
```

#### Option 2: Neon (Serverless PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env`:
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

#### Option 3: Supabase (PostgreSQL + Extras)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings → Database**
4. Copy the **Connection string** (Transaction mode)
5. Add to `.env`:
   ```bash
   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
   ```

#### Option 4: Railway (Managed PostgreSQL)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project
3. Add **PostgreSQL** service
4. Copy the **DATABASE_URL** from variables
5. Add to `.env`

---

### Redis Options

ForgeStack uses Redis for job queues, rate limiting, and caching.

#### Option 1: Local Redis (Default)

Already running via Docker Compose:
```bash
REDIS_URL=redis://localhost:6379
```

#### Option 2: Upstash (Serverless Redis)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a new database
3. Copy the **Redis URL**
4. Add to `.env`:
   ```bash
   REDIS_URL=rediss://default:password@xxx.upstash.io:6379
   ```

#### Option 3: Redis Cloud

1. Sign up at [redis.com](https://redis.com)
2. Create a new database
3. Copy the connection string
4. Add to `.env`

---

### Observability Setup (Optional)

ForgeStack includes OpenTelemetry support for production observability.

#### Option 1: Local Observability Stack

Use the included Docker Compose observability stack:

```bash
docker-compose -f docker-compose.yml -f docker-compose.observability.yml up -d
```

This starts:
- **Grafana** (http://localhost:3001) - Dashboards
- **Tempo** (http://localhost:3200) - Distributed tracing
- **Loki** (http://localhost:3100) - Log aggregation
- **Prometheus** (http://localhost:9090) - Metrics

Enable in `.env`:
```bash
OTEL_ENABLED=true
OTEL_EXPORTER_TYPE=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=info
```

#### Option 2: Grafana Cloud

1. Sign up at [grafana.com](https://grafana.com)
2. Create a new stack
3. Go to **Connections → Add new connection → OpenTelemetry**
4. Copy the OTLP endpoint and token
5. Add to `.env`:
   ```bash
   OTEL_ENABLED=true
   OTEL_EXPORTER_TYPE=otlp
   OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
   OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-token>
   ```

#### Option 3: Honeycomb

1. Sign up at [honeycomb.io](https://honeycomb.io)
2. Create a new environment
3. Copy the API key
4. Add to `.env`:
   ```bash
   OTEL_ENABLED=true
   OTEL_EXPORTER_TYPE=otlp
   OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
   OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<api-key>
   ```

---

## ⚙️ Configuration Deep Dive

### Environment Variables Explained

#### Core Configuration

```bash
# Node environment (development, production, test)
NODE_ENV=development

# Database connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis connection string (required for jobs, rate limiting, caching)
REDIS_URL=redis://host:6379
```

#### API Configuration

```bash
# API server port
API_PORT=4000

# CORS allowed origins (comma-separated for multiple)
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

#### Web Configuration

```bash
# Web app port
WEB_PORT=3000

# Public API URL (used by frontend)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# App URL for emails, redirects, auth callbacks
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Authentication

```bash
# Secret key for JWT tokens (min 32 characters)
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-change-in-production

# Auth URL (must match APP_URL)
BETTER_AUTH_URL=http://localhost:3000
```

### Feature Flags Configuration

Feature flags are defined in the database and can be managed via the admin panel.

**Plan-Based Flags:**
- `advanced-analytics` - Pro, Enterprise
- `api-access` - Pro, Enterprise
- `audit-logs` - Enterprise only
- `sso` - Enterprise only

**Boolean Flags:**
- `beta-features` - Manual enable/disable
- `new-dashboard` - Percentage rollout

**Customization:**

1. Go to `/admin/feature-flags` (requires admin role)
2. Create new flag or edit existing
3. Set flag type: `plan`, `boolean`, or `percentage`
4. Configure rules and overrides

### Rate Limiting Customization

Rate limits are plan-based and stored in the database.

**Default Limits:**

| Plan | Per Minute | Per Hour | Per Day |
|------|------------|----------|---------|
| Free | 100 | 1,000 | 10,000 |
| Starter | 500 | 10,000 | 100,000 |
| Pro | 2,000 | 50,000 | 500,000 |
| Enterprise | 10,000 | Unlimited | Unlimited |

**Customization:**

Edit `packages/db/src/seed/plans.ts` to change default limits, then re-seed:

```bash
cd packages/db
pnpm db:seed
```

Or update via SQL:

```sql
UPDATE plans SET rate_limit_per_minute = 1000 WHERE name = 'pro';
```

### RBAC Customization

ForgeStack includes 4 system roles and 33 permissions across 11 resources.

**System Roles (cannot be modified):**
- **Owner** - Full access (`*` wildcard)
- **Admin** - All except roles and billing management
- **Member** - Standard CRUD permissions
- **Viewer** - Read-only access

**Custom Roles:**

1. Go to `/settings/roles`
2. Click **"Create Role"**
3. Name your role (e.g., `Developer`, `Support`)
4. Select permissions from the list
5. Assign role to members

**Permission Format:** `resource:action`

**Resources:**
- `projects`, `members`, `billing`, `settings`, `api_keys`, `webhooks`, `audit_logs`, `roles`, `files`, `notifications`, `feature_flags`

**Actions:**
- `create`, `read`, `update`, `delete`, `manage`, `invite`, `assign`

**Examples:**
- `projects:create` - Can create projects
- `members:invite` - Can invite members
- `billing:manage` - Can manage billing
- `*` - All permissions (Owner only)

---

## 🎨 Customization Guide

### Adding New API Endpoints

1. **Create a new module:**
   ```bash
   cd apps/api/src
   nest g module tasks
   nest g controller tasks
   nest g service tasks
   ```

2. **Define DTOs:**
   ```typescript
   // apps/api/src/tasks/dto/create-task.dto.ts
   export class CreateTaskDto {
     @IsString()
     title: string;

     @IsOptional()
     @IsString()
     description?: string;
   }
   ```

3. **Implement service:**
   ```typescript
   // apps/api/src/tasks/tasks.service.ts
   @Injectable()
   export class TasksService {
     async create(ctx: TenantContext, dto: CreateTaskDto) {
       return withTenantContext(ctx, async (tx) => {
         return tx.insert(tasks).values({
           ...dto,
           organizationId: ctx.orgId,
         }).returning();
       });
     }
   }
   ```

4. **Add controller:**
   ```typescript
   // apps/api/src/tasks/tasks.controller.ts
   @Controller('tasks')
   @UseGuards(TenantContextGuard)
   export class TasksController {
     @Post()
     @RequirePermission('tasks:create')
     create(@TenantCtx() ctx: TenantContext, @Body() dto: CreateTaskDto) {
       return this.tasksService.create(ctx, dto);
     }
   }
   ```

5. **Add tests:**
   ```typescript
   // apps/api/src/tasks/tasks.service.spec.ts
   describe('TasksService', () => {
     // Unit tests
   });
   ```

### Adding New Frontend Pages

1. **Create page file:**
   ```bash
   # For protected route
   touch apps/web/src/app/\(protected\)/tasks/page.tsx

   # For public route
   touch apps/web/src/app/\(marketing\)/about/page.tsx
   ```

2. **Implement page:**
   ```typescript
   // apps/web/src/app/(protected)/tasks/page.tsx
   export default async function TasksPage() {
     return (
       <div>
         <PageHeader
           title="Tasks"
           description="Manage your tasks"
         />
         <TaskList />
       </div>
     );
   }
   ```

3. **Add to navigation:**
   ```typescript
   // apps/web/src/components/layout/sidebar.tsx
   const navigation = [
     // ...
     { name: 'Tasks', href: '/tasks', icon: CheckSquare },
   ];
   ```

4. **Add Storybook story:**
   ```typescript
   // apps/web/src/components/tasks/task-list.stories.tsx
   export default {
     title: 'Tasks/TaskList',
     component: TaskList,
   };
   ```

5. **Add tests:**
   ```typescript
   // apps/web/src/app/(protected)/tasks/page.test.tsx
   describe('TasksPage', () => {
     it('renders task list', () => {
       // Test implementation
     });
   });
   ```

### Adding Background Jobs

1. **Define job handler:**
   ```typescript
   // apps/worker/src/handlers/task-reminder.handler.ts
   import { Job } from 'bullmq';
   import { createLogger } from '../telemetry/logger';

   const logger = createLogger('TaskReminderHandler');

   export interface TaskReminderJobData {
     taskId: string;
     userId: string;
   }

   export async function handleTaskReminder(job: Job<TaskReminderJobData>) {
     const { taskId, userId } = job.data;
     logger.info({ taskId, userId }, 'Processing task reminder');

     // Send reminder email
     // Update task status

     return { success: true };
   }
   ```

2. **Register handler:**
   ```typescript
   // apps/worker/src/index.ts
   import { handleTaskReminder } from './handlers/task-reminder.handler';

   // Add to worker registration
   worker.process('task-reminder', handleTaskReminder);
   ```

3. **Queue job from API:**
   ```typescript
   // apps/api/src/tasks/tasks.service.ts
   import { QUEUE_NAMES } from '@forgestack/shared';

   async scheduleReminder(taskId: string, userId: string) {
     await this.queueService.add(
       QUEUE_NAMES.TASKS,
       'task-reminder',
       { taskId, userId },
       { delay: 3600000 } // 1 hour
     );
   }
   ```

### Adding Database Tables

1. **Define schema:**
   ```typescript
   // packages/db/src/schema/tasks.ts
   import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
   import { organizations } from './organizations';
   import { users } from './users';

   export const tasks = pgTable('tasks', {
     id: uuid('id').primaryKey().defaultRandom(),
     organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
     createdBy: uuid('created_by').notNull().references(() => users.id),
     title: text('title').notNull(),
     description: text('description'),
     completed: boolean('completed').default(false),
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   });
   ```

2. **Export schema:**
   ```typescript
   // packages/db/src/schema/index.ts
   export * from './tasks';
   ```

3. **Generate migration:**
   ```bash
   cd packages/db
   pnpm db:generate
   ```

4. **Apply migration:**
   ```bash
   pnpm db:migrate
   ```

5. **Add RLS policy (if needed):**
   ```sql
   -- packages/db/migrations/XXXX_add_tasks_rls.sql
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

   CREATE POLICY tasks_org_isolation ON tasks
     USING (organization_id = current_setting('app.current_org_id', true)::uuid);
   ```

### Customizing UI Theme

1. **Edit design tokens:**
   ```typescript
   // packages/ui/src/tokens/colors.ts
   export const colors = {
     primary: {
       50: '#f0f9ff',
       500: '#0ea5e9',
       900: '#0c4a6e',
     },
     // Add your brand colors
   };
   ```

2. **Update Tailwind config:**
   ```javascript
   // apps/web/tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           brand: {
             primary: '#your-color',
             secondary: '#your-color',
           },
         },
       },
     },
   };
   ```

3. **Update global styles:**
   ```css
   /* packages/ui/src/styles.css */
   @layer base {
     :root {
       --primary: 210 100% 50%;
       --secondary: 220 90% 60%;
     }
   }
   ```

---

## 🚀 Deployment Guide

### Fly.io Deployment

1. **Install Fly CLI:**
   ```bash
   # macOS
   brew install flyctl

   # Linux/WSL
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly:**
   ```bash
   fly auth login
   ```

3. **Create apps:**
   ```bash
   # API
   fly apps create your-app-api

   # Web
   fly apps create your-app-web

   # Worker
   fly apps create your-app-worker
   ```

4. **Set secrets:**
   ```bash
   # API secrets
   fly secrets set -a your-app-api \
     DATABASE_URL="postgresql://..." \
     REDIS_URL="redis://..." \
     STRIPE_SECRET_KEY="sk_live_..." \
     RESEND_API_KEY="re_..."

   # Web secrets
   fly secrets set -a your-app-web \
     NEXT_PUBLIC_API_URL="https://your-app-api.fly.dev/api/v1" \
     BETTER_AUTH_SECRET="..."
   ```

5. **Deploy:**
   ```bash
   # API
   fly deploy -c deploy/fly.api.toml

   # Web
   fly deploy -c deploy/fly.web.toml

   # Worker
   fly deploy -c deploy/fly.worker.toml
   ```

### Railway Deployment

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Create project:**
   ```bash
   railway init
   ```

4. **Add services:**
   - Go to Railway dashboard
   - Add PostgreSQL service
   - Add Redis service
   - Link to GitHub repository

5. **Configure environment variables** in Railway dashboard

6. **Deploy:**
   ```bash
   railway up
   ```

### Render Deployment

1. **Connect GitHub repository** in Render dashboard

2. **Create services:**
   - **Web Service** (apps/web)
   - **Background Worker** (apps/worker)
   - **Private Service** (apps/api)

3. **Add PostgreSQL database**

4. **Add Redis instance**

5. **Configure environment variables** for each service

6. **Deploy** - Render auto-deploys on git push

### Docker Compose Self-Hosting

1. **Build images:**
   ```bash
   docker build -t your-app-api -f apps/api/Dockerfile .
   docker build -t your-app-web -f apps/web/Dockerfile .
   docker build -t your-app-worker -f apps/worker/Dockerfile .
   ```

2. **Push to registry:**
   ```bash
   docker tag your-app-api registry.example.com/your-app-api:latest
   docker push registry.example.com/your-app-api:latest
   ```

3. **Update docker-compose.prod.yml** with your image names

4. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## 🧪 Testing Your Setup

### Run All Tests

```bash
# Unit tests
pnpm test

# API tests with coverage
cd apps/api && pnpm test:cov

# Web tests with coverage
cd apps/web && pnpm test:coverage

# Integration tests (requires database)
cd apps/api && pnpm test:integration

# E2E tests (requires running app)
cd apps/web && pnpm test:e2e
```

### Manual Testing Checklist

- [ ] Sign up for a new account
- [ ] Verify email (check logs if using dev mode)
- [ ] Complete onboarding flow
- [ ] Create an organization
- [ ] Invite a team member
- [ ] Create a project
- [ ] Upload a file
- [ ] Create an API key
- [ ] Test API with SDK
- [ ] Subscribe to a plan (test mode)
- [ ] Check webhook delivery
- [ ] View audit logs
- [ ] Test notifications

---

## 🆘 Troubleshooting

### Database Connection Issues

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
1. Ensure Docker is running: `docker ps`
2. Check PostgreSQL is running: `docker-compose ps postgres`
3. Verify DATABASE_URL in `.env`
4. Try restarting: `docker-compose restart postgres`

### Redis Connection Issues

**Error:** `Redis connection failed`

**Solution:**
1. Check Redis is running: `docker-compose ps redis`
2. Verify REDIS_URL in `.env`
3. Try restarting: `docker-compose restart redis`

### Stripe Webhook Issues

**Error:** `Webhook signature verification failed`

**Solution:**
1. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
2. For local dev, use `stripe listen --forward-to localhost:4000/api/v1/incoming-webhooks/stripe`
3. Copy the webhook signing secret from CLI output
4. Restart API server after updating `.env`

### Email Not Sending

**Error:** Emails not being sent

**Solution:**
1. Check `RESEND_API_KEY` is set
2. Verify `EMAIL_FROM` uses verified domain
3. Check worker logs: `docker-compose logs worker`
4. In dev mode without API key, emails are logged to console

### File Upload Issues

**Error:** `Failed to upload file`

**Solution:**
1. Verify R2 credentials in `.env`
2. Check bucket name matches
3. Ensure CORS is configured for browser uploads
4. Check API logs for detailed error

### Build Errors

**Error:** `Module not found` or build failures

**Solution:**
1. Clean and reinstall: `pnpm clean && pnpm install`
2. Build packages first: `pnpm turbo build --filter='./packages/*'`
3. Clear Next.js cache: `rm -rf apps/web/.next`
4. Clear NestJS cache: `rm -rf apps/api/dist`

---

## 📚 Next Steps

After completing setup:

1. **Read the Documentation**
   - Browse `/docs` in your running app
   - Review API reference
   - Check out SDK documentation

2. **Explore the Codebase**
   - Review `docs/specs/` for feature specifications
   - Check `TESTING.md` for testing guidelines
   - Read `agents.md` for development guidelines

3. **Customize Your App**
   - Update branding and colors
   - Add your business logic
   - Customize email templates
   - Configure feature flags

4. **Deploy to Production**
   - Choose a deployment platform
   - Set up production database
   - Configure production secrets
   - Set up monitoring

5. **Join the Community**
   - Star the repository
   - Report issues
   - Contribute improvements
   - Share your success story

---

## 🤝 Getting Help

- **Documentation**: http://localhost:3000/docs (when running locally)
- **GitHub Issues**: [Report a bug or request a feature](https://github.com/your-org/forgestack/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/your-org/forgestack/discussions)

---

**Built with ❤️ by [PulseDevLabs](https://github.com/PulseDevLabs)**

