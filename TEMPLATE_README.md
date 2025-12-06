# {{PROJECT_DISPLAY_NAME}}

{{PROJECT_DESCRIPTION}}

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9+
- pnpm 9.14+
- Docker Desktop
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
cd packages/db
pnpm db:push
pnpm db:migrate
pnpm db:seed
cd ../..

# Start development servers
pnpm dev
```

Your app is now running at:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **TypeScript** - Type safety

### Backend
- **NestJS 11** - Node.js framework
- **PostgreSQL 16** - Primary database
- **Drizzle ORM** - Type-safe database access
- **Redis 7** - Caching and job queues
- **BullMQ** - Background job processing

### Infrastructure
- **pnpm Workspaces** - Monorepo management
- **Turborepo** - Build system
- **Docker** - Containerization
- **OpenTelemetry** - Observability

---

## 📦 Project Structure

```
{{PROJECT_NAME}}/
├── apps/
│   ├── api/          # NestJS REST API
│   ├── web/          # Next.js frontend
│   └── worker/       # Background job processor
├── packages/
│   ├── db/           # Database schema & migrations
│   ├── shared/       # Shared types & utilities
│   ├── sdk/          # TypeScript SDK
│   └── ui/           # UI component library
└── deploy/           # Deployment configurations
```

---

## 🔑 Key Features

- ✅ **Authentication** - Email/password with better-auth
- ✅ **Multi-tenancy** - Organization-based isolation
- ✅ **RBAC** - Role-based access control with custom roles
- ✅ **Billing** - Stripe subscriptions & payments
- ✅ **File Uploads** - Cloudflare R2 storage
- ✅ **API Keys** - Secure API authentication
- ✅ **Webhooks** - Outgoing & incoming webhooks
- ✅ **Audit Logs** - Compliance logging
- ✅ **Notifications** - In-app & email notifications
- ✅ **Feature Flags** - Dynamic feature gating
- ✅ **Rate Limiting** - Plan-based API limits
- ✅ **Observability** - OpenTelemetry tracing & logging

---

## 📜 Available Scripts

### Development

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages and apps
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm clean            # Remove build artifacts
```

### Testing

```bash
pnpm test                           # Run all unit tests
cd apps/api && pnpm test:cov        # API tests with coverage
cd apps/web && pnpm test:coverage   # Web tests with coverage
cd apps/api && pnpm test:integration # Integration tests
cd apps/web && pnpm test:e2e        # E2E tests
```

### Database

```bash
cd packages/db
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:generate      # Generate migration files
pnpm db:seed          # Seed database with test data
```

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{PROJECT_NAME}}_dev
REDIS_URL=redis://localhost:6379
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Optional (for production features)

```bash
# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM={{PROJECT_NAME}} <noreply@{{PROJECT_DOMAIN}}>

# Billing
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# File Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME={{PROJECT_NAME}}-uploads

# Observability
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

See `.env.example` for complete list with documentation.

---

## 🚢 Deployment

### Fly.io

```bash
fly deploy -c deploy/fly.api.toml
fly deploy -c deploy/fly.web.toml
fly deploy -c deploy/fly.worker.toml
```

### Railway

Connect your GitHub repository in the Railway dashboard and configure environment variables.

### Render

Use `deploy/render.yaml` for automatic deployment configuration.

### Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 Documentation

- **Setup Guide**: See `SETUP.md` for detailed setup instructions
- **Testing Guide**: See `TESTING.md` for testing guidelines
- **API Reference**: http://localhost:3000/docs/api (when running)
- **Architecture**: See `docs/specs/` for feature specifications

---

## 🧪 Testing

This project maintains high test coverage:

- **API**: 98%+ coverage
- **Web**: 86%+ coverage
- **DB**: 85%+ coverage

Run tests before committing:

```bash
pnpm test
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run `pnpm lint` and `pnpm format`
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with [ForgeStack](https://github.com/your-org/forgestack) - A production-ready SaaS starter kit.

---

<div align="center">

**Built with ❤️ by {{PROJECT_AUTHOR}}**

[Website]({{PROJECT_WEBSITE}}) • [Documentation]({{PROJECT_DOCS_URL}}) • [Support]({{PROJECT_SUPPORT_URL}})

</div>

