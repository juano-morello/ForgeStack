# ForgeStack – agents.md

## 1. Project Summary
ForgeStack is a production‑ready **multi-tenant SaaS starter** built with:
- **Next.js 16 (App Router)** + Tailwind + shadcn/ui  
- **NestJS** for backend APIs  
- **Drizzle ORM** + **Postgres RLS** for strict data isolation  
- **BullMQ + Redis** for background jobs  
- **better-auth** for authentication  
- **pnpm + Turborepo** monorepo structure  
- **Docker Compose** for local dev

**Primary goal of v1:**  
Deliver a clean, functional skeleton with authentication, org creation, org switching, project CRUD, and fully enforced RLS.

---

## 2. Current Milestone (v1 Scope)

### Included:
- Next.js + better-auth signup/login
- Users, Organizations, Memberships
- Org switching UI
- Postgres schema with Drizzle
- Full **RLS-based multi-tenancy** (`app.current_org_id`)
- NestJS API with tenant context interceptor
- CRUD for `projects` (org-scoped)
- BullMQ worker with one demo job
- Docker Compose (Postgres + Redis + services)
- Test infrastructure (TDD)
- Storybook setup (frontend)
- Playwright setup (flows)

### Excluded (future milestones):
- Stripe billing
- Audit logs
- Advanced role/permissions matrix
- AI features
- External integrations
- Deployment + Terraform infra

---

## 3. Hard Tech Constraints

### Monorepo
```
/apps/api       → NestJS  
/apps/web       → NextJS 16  
/apps/worker    → BullMQ worker  
/packages/db    → Drizzle ORM + schema + migrations  
/packages/shared  
/packages/ui  
/docs
```

### Backend
- NestJS only
- Drizzle (`pg-node`)
- No Prisma, MikroORM, or SQL abstraction layers
- All org-scoped queries must go through **withTenantContext()**
- RLS is enforced in Postgres, not in application code

### Frontend
- NextJS 16 App Router
- Tailwind + shadcn/ui
- Storybook for every component
- No Chakra/MUI/Material/etc.

### Auth
- **better-auth** (default)
- Cognito optional for future

### Multi-tenancy
- **RLS ONLY**
- Org isolation via:
  ```
  SET LOCAL app.current_org_id = '<org_uuid>';
  SET LOCAL app.current_user_id = '<user_uuid>';
  SET LOCAL app.current_role = '<role>';
  ```

---

## 4. Architecture Overview

### Request Flow:
1. User logs in via Next.js + better-auth  
2. User selects active org  
3. Frontend sends:
   - JWT/session token  
   - `X-Org-Id` header  
4. Nest guard resolves:
   - user_id  
   - org_id  
   - role  
5. API calls DB using:
   ```
   withTenantContext({ orgId, userId, role }, (db) => ...)
   ```
6. RLS policies enforce row-level access
7. Worker consumes background jobs using same Drizzle schema

---

## 5. Data Model (v1)

### users
- id, email, created_at

### organizations
- id, name, owner_user_id

### organization_members
- org_id, user_id, role (OWNER, MEMBER)

### projects
- id, org_id, name, description, timestamps

### invitations (optional)
- org_id, email, role, token, expires_at

---

## 6. Development Methodology (TDD + SDD)

### Spec Driven Development (SDD)
- Every feature begins with a spec under:
```
/docs/specs/<epic>/<story>.md
```
- No feature may be implemented without a spec
- Behavior changes → spec must be updated

### Test Driven Development (TDD)
Backend:
- ~100% unit coverage for domain logic
- Integration tests for every API flow (Nest + Drizzle + RLS)
Frontend:
- Storybook stories for every component
- Unit tests for all components
- Playwright flows for all key user actions

Workers:
- Unit tests for handlers
- Integration tests for queue and Redis interactions

No PR may merge without passing tests.

---

## 7. Docs Structure

```
/docs
  agents.md
  specs/
    epic-auth/
      login.md
      signup.md
    epic-orgs/
      create-org.md
      switch-org.md
    epic-projects/
      create-project.md
      list-projects.md
```

Each story contains:
- Overview
- Acceptance criteria
- Tasks & subtasks
- Test plan

---

## 8. Implementation Priorities (v1)

1. Monorepo + Docker Compose  
2. Drizzle schema + base migrations  
3. RLS policies + `withTenantContext()`  
4. NestJS API skeleton  
5. better-auth integration  
6. Org creation + membership  
7. Org switcher UI  
8. Projects CRUD (API + web)  
9. Worker + sample job  
10. Full test suite (unit + integration + e2e)

---

## 9. Agent Behavior Guidelines (AugmentCode / Auggie)

- Follow **spec-first, test-first** at all times  
- Never introduce new libraries without explicit instruction  
- Respect monorepo boundaries (`apps` vs `packages`)  
- Prefer small, focused changes  
- Always use existing patterns (`withTenantContext`, DTOs, folders)  
- Never bypass RLS with raw SQL that ignores tenant context  
- Update specs when implementing or modifying behavior  
- If unsure, choose **explicit**, not “clever,” solutions

---

## 10. CI/CD Policy (GitHub Actions)

PR pipeline must pass:
- Lint  
- Type-check  
- Backend unit tests  
- Backend integration tests (Postgres + Redis via Docker)  
- Frontend unit tests  
- Storybook build  
- Playwright tests  

PRs must:
- Be based on updated specs  
- Not merge directly into `main`  
- Not reduce test coverage  

Main pipeline:
- All PR checks  
- Coverage report  
- Build artifacts (optional future)

---

## 11. Future Extensions (Not in v1)
- Billing (Stripe)
- Audit logs
- Advanced RBAC
- Webhooks framework
- AI-enabled flows
- Deployments (AWS/Terraform)
- Real dashboards (Tremor/Recharts)

This section is for reference; agents should ignore until instructed.

---

*End of agents.md*
