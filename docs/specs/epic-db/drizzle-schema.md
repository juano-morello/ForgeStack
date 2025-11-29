# Drizzle Schema + Base Migrations

## Overview

Set up Drizzle ORM in `/packages/db` with the base schema for ForgeStack v1. This package serves as the central database layer shared across all applications (API, Worker) in the monorepo.

The v1 data model includes:
- **users** – Core user accounts
- **organizations** – Tenant entities for multi-tenancy
- **organization_members** – Join table linking users to orgs with roles
- **projects** – Org-scoped resources demonstrating RLS
- **invitations** (optional) – Pending org invites

All tables use UUIDs as primary keys and include proper foreign key relationships. This schema is designed to work with Postgres RLS policies (defined in a separate spec).

---

## Acceptance Criteria

### Drizzle ORM Configuration
- [ ] Drizzle ORM installed in `/packages/db` with `pg-node` driver
- [ ] `drizzle.config.ts` configured at package root
- [ ] Database connection uses `DATABASE_URL` environment variable
- [ ] Connection pooling configured appropriately for development

### Schema Definitions
- [ ] All tables use `uuid` as primary key with `gen_random_uuid()` default
- [ ] All timestamps use `timestamp with time zone`

#### users
| Column      | Type                      | Constraints                    |
|-------------|---------------------------|--------------------------------|
| id          | uuid                      | PK, default gen_random_uuid() |
| email       | varchar(255)              | NOT NULL, UNIQUE               |
| created_at  | timestamp with time zone  | NOT NULL, default now()        |

#### organizations
| Column        | Type                      | Constraints                    |
|---------------|---------------------------|--------------------------------|
| id            | uuid                      | PK, default gen_random_uuid() |
| name          | varchar(255)              | NOT NULL                       |
| owner_user_id | uuid                      | NOT NULL, FK → users.id        |
| created_at    | timestamp with time zone  | NOT NULL, default now()        |

#### organization_members
| Column   | Type                      | Constraints                           |
|----------|---------------------------|---------------------------------------|
| org_id   | uuid                      | PK (composite), FK → organizations.id |
| user_id  | uuid                      | PK (composite), FK → users.id         |
| role     | enum('OWNER', 'MEMBER')   | NOT NULL, default 'MEMBER'            |
| joined_at| timestamp with time zone  | NOT NULL, default now()               |

#### projects
| Column      | Type                      | Constraints                    |
|-------------|---------------------------|--------------------------------|
| id          | uuid                      | PK, default gen_random_uuid() |
| org_id      | uuid                      | NOT NULL, FK → organizations.id|
| name        | varchar(255)              | NOT NULL                       |
| description | text                      | NULL                           |
| created_at  | timestamp with time zone  | NOT NULL, default now()        |
| updated_at  | timestamp with time zone  | NOT NULL, default now()        |

#### invitations (optional)
| Column     | Type                      | Constraints                    |
|------------|---------------------------|--------------------------------|
| id         | uuid                      | PK, default gen_random_uuid() |
| org_id     | uuid                      | NOT NULL, FK → organizations.id|
| email      | varchar(255)              | NOT NULL                       |
| role       | enum('OWNER', 'MEMBER')   | NOT NULL, default 'MEMBER'     |
| token      | varchar(255)              | NOT NULL, UNIQUE               |
| expires_at | timestamp with time zone  | NOT NULL                       |
| created_at | timestamp with time zone  | NOT NULL, default now()        |

### Relations
- [ ] `organizations.owner_user_id` → `users.id`
- [ ] `organization_members.org_id` → `organizations.id` (CASCADE DELETE)
- [ ] `organization_members.user_id` → `users.id` (CASCADE DELETE)
- [ ] `projects.org_id` → `organizations.id` (CASCADE DELETE)
- [ ] `invitations.org_id` → `organizations.id` (CASCADE DELETE)

### Migrations & Scripts
- [ ] Base migration generated via `drizzle-kit generate`
- [ ] Migration runs successfully against fresh Postgres
- [ ] Package scripts configured:
  - `db:generate` – Generate migrations from schema changes
  - `db:migrate` – Apply pending migrations
  - `db:push` – Push schema directly (dev only)
  - `db:studio` – Launch Drizzle Studio
  - `db:seed` – Seed development data

---

## Tasks & Subtasks

### 1. Install Drizzle ORM Dependencies
- [ ] Add `drizzle-orm` package
- [ ] Add `pg` (node-postgres) driver
- [ ] Add `drizzle-kit` as dev dependency
- [ ] Add `@types/pg` as dev dependency
- [ ] Add `dotenv` for env loading in scripts

### 2. Configure drizzle.config.ts
- [ ] Create `drizzle.config.ts` at `/packages/db/drizzle.config.ts`
- [ ] Configure `schema` path to `./src/schema/index.ts`
- [ ] Configure `out` path to `./drizzle` for migrations
- [ ] Configure `driver` as `pg`
- [ ] Configure `dbCredentials` using `DATABASE_URL` env var
- [ ] Enable `verbose` and `strict` mode

### 3. Create Schema Files
- [ ] Create `/packages/db/src/schema/` directory
- [ ] Create `users.ts` with users table definition
- [ ] Create `organizations.ts` with organizations table
- [ ] Create `organization-members.ts` with join table
- [ ] Create `projects.ts` with projects table
- [ ] Create `invitations.ts` with invitations table (optional)
- [ ] Create `index.ts` barrel export

### 4. Define Table Schemas with Proper Types
- [ ] Define `roleEnum` for OWNER/MEMBER
- [ ] Implement UUID primary keys with `gen_random_uuid()`
- [ ] Implement timestamp columns with timezone
- [ ] Add NOT NULL constraints where required
- [ ] Add UNIQUE constraint on `users.email`
- [ ] Add composite primary key on `organization_members`

### 5. Set Up Relations Between Tables
- [ ] Define relations in each schema file using `relations()`
- [ ] Configure one-to-many: users → organizations (as owner)
- [ ] Configure many-to-many: users ↔ organizations (via members)
- [ ] Configure one-to-many: organizations → projects
- [ ] Configure one-to-many: organizations → invitations

### 6. Create Connection Utility
- [ ] Create `/packages/db/src/client.ts`
- [ ] Export `db` instance with schema
- [ ] Export `pool` for connection management
- [ ] Create `withTenantContext()` wrapper (stub for RLS spec)
- [ ] Handle connection errors gracefully

### 7. Generate Initial Migration
- [ ] Run `drizzle-kit generate` to create migration
- [ ] Verify migration SQL is correct
- [ ] Migration file created in `/packages/db/drizzle/`

### 8. Create Migration Scripts
- [ ] Add `db:generate` script to package.json
- [ ] Add `db:migrate` script to package.json
- [ ] Add `db:push` script to package.json  
- [ ] Add `db:studio` script to package.json
- [ ] Create `/packages/db/src/migrate.ts` for programmatic migrations

### 9. Add Seed Script
- [ ] Create `/packages/db/src/seed.ts`
- [ ] Seed test user(s)
- [ ] Seed test organization with owner
- [ ] Seed organization membership
- [ ] Seed sample project(s)
- [ ] Add `db:seed` script to package.json

---

## Test Plan

### Migration Tests
- [ ] Fresh migration runs without errors on empty Postgres
- [ ] Migration is idempotent (running twice doesn't fail)
- [ ] Rollback/drop works cleanly

### Schema Introspection
- [ ] `drizzle-kit studio` shows all tables correctly
- [ ] All columns match schema definitions
- [ ] All constraints are present in database

### Foreign Key Constraints
- [ ] Cannot create organization with non-existent owner_user_id
- [ ] Cannot create organization_member with non-existent org_id
- [ ] Cannot create organization_member with non-existent user_id
- [ ] Cannot create project with non-existent org_id
- [ ] Deleting organization cascades to members, projects, invitations
- [ ] Deleting user cascades to memberships

### UUID Generation
- [ ] Users created without explicit id receive valid UUID
- [ ] Organizations created without explicit id receive valid UUID
- [ ] Projects created without explicit id receive valid UUID

### Timestamp Auto-Population
- [ ] `created_at` auto-populates on insert
- [ ] `updated_at` auto-populates on insert
- [ ] `joined_at` auto-populates on member insert

### Seed Script
- [ ] `db:seed` runs without errors
- [ ] Seed data is queryable after running
- [ ] Seed script is idempotent (safe to run multiple times)

---

## File Structure

```
/packages/db/
├── drizzle/                    # Generated migrations
│   └── 0000_initial.sql
├── src/
│   ├── schema/
│   │   ├── index.ts            # Barrel export
│   │   ├── users.ts
│   │   ├── organizations.ts
│   │   ├── organization-members.ts
│   │   ├── projects.ts
│   │   └── invitations.ts
│   ├── client.ts               # DB connection + instance
│   ├── migrate.ts              # Programmatic migration runner
│   └── seed.ts                 # Development seed data
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

## Dependencies

### Production
- `drizzle-orm` – ORM
- `pg` – PostgreSQL driver (node-postgres)

### Development
- `drizzle-kit` – Migration tooling & studio
- `@types/pg` – TypeScript types
- `dotenv` – Environment variable loading

---

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/forgestack

# Optional (for connection pool tuning)
DB_POOL_MIN=2
DB_POOL_MAX=10
```

---

## Notes

- This spec does **not** include RLS policies. See `epic-db/rls-policies.md` (Priority #3)
- The `withTenantContext()` function is stubbed here but fully implemented in the RLS spec
- better-auth may add additional columns to users table – coordinate with auth spec
- All table/column names use snake_case per Postgres conventions

