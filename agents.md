# ForgeStack – agents.md (V2)

## 1. Project Summary

ForgeStack is a **production-grade multi-tenant SaaS starter**, built for engineering teams that want:

- Real multi-tenancy with **PostgreSQL Row-Level Security (RLS)**
- A clean monorepo architecture
- Fully tested auth + orgs + roles + invitations
- Extensible modules for billing, webhooks, API keys, audit logs, file uploads, notifications, and feature flags

ForgeStack is the foundation for **real** SaaS products, not a toy boilerplate.

Primary goal (V2): expand ForgeStack into a complete SaaS platform with robust infrastructure modules and polished UX flows.

---

## 2. Monorepo Structure

ForgeStack/  
├── apps/  
│   ├── api/ — NestJS backend  
│   ├── web/ — Next.js frontend  
│   └── worker/ — BullMQ jobs  
├── packages/  
│   ├── db/ — Drizzle ORM + schema + migrations + RLS  
│   ├── shared/ — Types, DTOs, constants  
│   └── ui/ — Shared UI components + design system  
└── docs/  
├── agents.md  
└── specs/ — Spec-driven development

---

## 3. Existing Features (Preserved)

### Authentication (better-auth)
- Email/password signup + login
- Sessions via secure cookies
- UUID user IDs
- Organizations + roles
- Invitation workflows

### Multi-tenancy
- Full RLS
- Tenant context enforcement
- Owner/member role logic
- Protection against removing last owner

### Projects Module
- CRUD
- Organization-scoped
- Fully tested

### Infrastructure
- PostgreSQL
- Drizzle ORM
- Redis + BullMQ
- Docker Compose
- Resend integration
- Test coverage >90%

---

## 4. V2 feature modules (New)

Agents MUST implement these modules:

### Billing (Stripe)
- Customer creation
- Subscription management
- Billing portal
- Stripe webhooks via worker
- RLS-safe billing records

### File Uploads (Cloudflare R2 default; S3 optional)
- Presigned URLs
- Direct uploads
- Metadata validation
- Optional AWS S3 adapter

### API Keys
- Hashed keys
- Key creation + revocation
- Scopes: read/write/admin
- Nest API key guard
- UI to manage keys

### Outgoing Webhooks
- Endpoints table
- Event queue
- Retry logic
- Signing secrets
- Delivery logs
- RLS scoped

### Incoming Webhooks
- Signed payload verification
- Worker processing
- Idempotency keys
- Logging

### Audit Logs (Immutable)
- Append only
- Org-scoped
- Event types: auth, org, billing, API keys, etc.

### Activity Feed
- Human-readable
- Grouped events
- Dashboard view

### Notifications
- In-app notifications
- Read/unread states
- Email triggers via Resend

### Feature Flags (GrowthBook)
- Server-side evaluation
- Per-user/org targeting
- UI for toggles
- Caching

### Rate Limiting
- NestJS-level
- User/org/API key aware

### User Settings
- Profile
- Avatar upload
- Email change
- Password reset

### Organization Settings
- Logo upload
- Preferences

---

## 5. Third-Party Integrations (Defaults)

- Transactional emails → Resend
- Marketing emails → Customer.io (optional: Mailchimp)
- Feature flags → GrowthBook (optional: LaunchDarkly, Unleash)
- File storage → Cloudflare R2 (optional: AWS S3)
- Billing → Stripe
- Queues → Redis/BullMQ

---

## 6. Architecture Rules (Hard constraints)

### Multi-tenancy
- RLS is mandatory
- All org tables must include org_id
- All DB access must use:

withTenantContext({ orgId, userId, role }, (db) => ...)

### Database Schema (packages/db)
- Drizzle ORM schema files in `src/schema/`
- **IMPORTANT**: Schema imports must NOT use `.js` extensions
  - ✅ `import { organizations } from './organizations'`
  - ❌ `import { organizations } from './organizations.js'`
  - Reason: drizzle-kit reads .ts files directly and fails with .js extensions

### Backend
- NestJS only
- Drizzle ORM only
- No direct SQL bypassing RLS
- DTOs/types must live in packages/shared

### Frontend
- Next.js App Router
- shadcn/ui
- Shared UI in packages/ui
- Strict TypeScript
- Server components by default

### Workers
- All async logic via BullMQ
- Webhooks/emails/audit logs/notifications must be worker-driven

---

## 7. Development Methodology (SDD + TDD + strict subagent workflow)

### Spec-Driven Development (SDD)
- Every feature MUST begin with a spec at:
  /docs/specs/<epic>/<story>.md
- Specs contain:
    - Context
    - User story
    - Acceptance criteria
    - Tasks (backend/frontend/worker/tests)
    - Test plan
- Written ONLY by forge-spec-writer
- Implementation may not begin without a spec.

### Test-Driven Development (TDD)

#### Backend
- ~100% unit test coverage
- Integration tests for flows (auth, orgs, billing, keys, webhooks)

#### Frontend
- Storybook stories for every component
- Unit tests for state/logic
- Playwright flows for all core paths

#### Workers
- Unit tests for handlers
- Integration tests for multi-step external interactions

---

## 8. Subagent Roles (Strict boundaries)

### forge-spec-writer
- ONLY modifies /docs/specs/**
- Writes specs, acceptance criteria, and test plans
- NO code changes allowed

### forge-backend
- ONLY modifies:
    - apps/api/**
    - apps/worker/**
    - packages/db/**
    - packages/shared/**
- Implements backend + worker logic according to specs
- Writes backend tests
- MUST NOT modify frontend files

### forge-frontend
- ONLY modifies:
    - apps/web/**
    - packages/ui/**
    - Storybook stories
    - Frontend unit tests
    - Playwright specs
- Implements UI/pages according to specs
- MUST NOT modify backend or db schema

### forge-code-review
- Reviews code written by forge-backend or forge-frontend
- May refactor, restructure, or improve tests
- May NOT expand features beyond the spec
- Ensures compliance with architecture, RLS, and TDD rules
- Runs after EVERY code contribution

---

## 9. Mandatory workflow for EVERY feature

1. forge-spec-writer  
   → writes/updates spec file

2. forge-backend / forge-frontend  
   → implement feature + tests

3. forge-code-review  
   → mandatory review + refinements

4. Done only after code-review passes

NO feature may skip this pipeline.

---

## 10. Documentation Structure

/docs  
agents.md  
specs/  
epic-auth/  
epic-orgs/  
epic-projects/  
epic-billing/  
epic-webhooks/  
epic-api-keys/  
epic-audit-logs/  
epic-feature-flags/  
epic-storage/

---

## 11. Implementation Priorities (V2)

1. Billing
2. File uploads
3. API keys
4. Outgoing webhooks
5. Incoming webhooks
6. Audit logs
7. Activity feed
8. Notifications
9. Feature flags
10. Rate limiting
11. User settings
12. Org settings
13. Design system
14. Dashboard
15. Marketing site
16. Onboarding
17. MDX docs site

---

## 12. Global Rules

- Never add libraries without instruction
- Never bypass RLS
- Never skip tests
- Always update specs when behavior changes
- Always use strict TypeScript
- Prefer explicitness over cleverness
- Changes must be PR-sized and well-scoped

---
