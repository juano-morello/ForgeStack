# Monorepo Setup

## Overview

This spec defines the foundational monorepo structure for ForgeStack using **pnpm workspaces** and **Turborepo** for build orchestration. The setup includes **Docker Compose** for local development services (Postgres and Redis), shared TypeScript configuration, and unified linting/formatting across all packages.

This is **Priority #1** in the implementation roadmap and establishes the project skeleton that all subsequent features will build upon.

### Tech Stack
- **pnpm** – Fast, disk-efficient package manager with native workspace support
- **Turborepo** – High-performance build system with caching and parallel execution
- **Docker Compose** – Container orchestration for local development services
- **TypeScript** – Strict type-checking across all packages
- **ESLint + Prettier** – Consistent code quality and formatting

---

## Acceptance Criteria

### Directory Structure
- [ ] Monorepo follows the structure defined in `agents.md`:
  ```
  /apps/api       → NestJS (empty scaffold)
  /apps/web       → Next.js 16 (empty scaffold)
  /apps/worker    → BullMQ worker (empty scaffold)
  /packages/db    → Drizzle ORM (empty scaffold)
  /packages/shared → Shared utilities (empty scaffold)
  /packages/ui    → UI components (empty scaffold)
  /docs           → Documentation
  ```

### pnpm Workspace
- [ ] `pnpm-workspace.yaml` exists at root with proper workspace definitions
- [ ] Each app/package has its own `package.json` with correct name convention (`@forgestack/<name>`)
- [ ] `pnpm install` from root installs all dependencies correctly
- [ ] Internal package references work (e.g., `@forgestack/shared` can be imported)

### Turborepo
- [ ] `turbo.json` exists at root with pipeline configuration
- [ ] `build` pipeline respects package dependencies
- [ ] `lint` pipeline runs across all packages
- [ ] `dev` pipeline supports concurrent development servers
- [ ] `turbo build` executes without errors (even if apps are empty scaffolds)

### Docker Compose
- [ ] `docker-compose.yml` exists at root
- [ ] Postgres 15 service configured with:
  - Port: 5432
  - Database: `forgestack_dev`
  - User/Password: `postgres/postgres`
  - Volume persistence
- [ ] Redis 7 service configured with:
  - Port: 6379
  - Volume persistence
- [ ] `docker compose up -d` starts both services successfully
- [ ] Services are accessible from host machine

### TypeScript Configuration
- [ ] Base `tsconfig.json` at root with shared compiler options
- [ ] Each app/package extends base config with local overrides
- [ ] Strict mode enabled
- [ ] Path aliases configured for internal packages

### ESLint + Prettier
- [ ] Root `.eslintrc.js` with shared rules
- [ ] Root `.prettierrc` with formatting configuration
- [ ] Each package can extend/override as needed
- [ ] `pnpm lint` works from root

### Documentation
- [ ] Root `README.md` with:
  - Project overview
  - Prerequisites (Node.js, pnpm, Docker)
  - Quick start instructions
  - Development commands
  - Project structure explanation

---

## Tasks & Subtasks

### 1. Initialize Monorepo with pnpm Workspaces
- [ ] 1.1 Initialize root `package.json` with `"private": true`
- [ ] 1.2 Create `pnpm-workspace.yaml` defining workspace packages
- [ ] 1.3 Set Node.js version requirement (`.nvmrc` or `engines` field)
- [ ] 1.4 Create `.gitignore` with appropriate patterns

### 2. Configure Turborepo
- [ ] 2.1 Add `turbo` as root dev dependency
- [ ] 2.2 Create `turbo.json` with pipeline definitions:
  - `build`: depends on `^build` (topological)
  - `lint`: no dependencies
  - `dev`: persistent, no cache
  - `test`: depends on `^build`
- [ ] 2.3 Add turbo scripts to root `package.json`

### 3. Create App Scaffolds
- [ ] 3.1 Create `/apps/api/package.json` (NestJS placeholder)
- [ ] 3.2 Create `/apps/web/package.json` (Next.js placeholder)
- [ ] 3.3 Create `/apps/worker/package.json` (BullMQ placeholder)
- [ ] 3.4 Add minimal `src/index.ts` to each app

### 4. Create Package Scaffolds
- [ ] 4.1 Create `/packages/db/package.json` (Drizzle placeholder)
- [ ] 4.2 Create `/packages/shared/package.json` (utilities placeholder)
- [ ] 4.3 Create `/packages/ui/package.json` (components placeholder)
- [ ] 4.4 Add minimal `src/index.ts` to each package with placeholder export

### 5. Set Up Docker Compose
- [ ] 5.1 Create `docker-compose.yml` at root
- [ ] 5.2 Configure Postgres 15 service with volume
- [ ] 5.3 Configure Redis 7 service with volume
- [ ] 5.4 Add healthchecks for both services
- [ ] 5.5 Create `.env.example` with database connection strings

### 6. Configure TypeScript
- [ ] 6.1 Create root `tsconfig.json` with base compiler options
- [ ] 6.2 Create `tsconfig.base.json` for shared settings
- [ ] 6.3 Add `tsconfig.json` to each app/package extending base
- [ ] 6.4 Configure path aliases for internal packages

### 7. Configure ESLint + Prettier
- [ ] 7.1 Add ESLint and Prettier as root dev dependencies
- [ ] 7.2 Create root `.eslintrc.js` with TypeScript support
- [ ] 7.3 Create root `.prettierrc` with formatting rules
- [ ] 7.4 Create `.eslintignore` and `.prettierignore`
- [ ] 7.5 Add lint/format scripts to root `package.json`

### 8. Create Root README.md
- [ ] 8.1 Write project overview section
- [ ] 8.2 Document prerequisites
- [ ] 8.3 Write quick start guide
- [ ] 8.4 Document available commands
- [ ] 8.5 Explain project structure

---

## Test Plan

### Workspace Verification
- [ ] Run `pnpm install` from root → completes without errors
- [ ] Run `pnpm ls` → shows all workspaces correctly
- [ ] Internal dependencies resolve correctly

### Docker Services
- [ ] Run `docker compose up -d` → both containers start
- [ ] Run `docker compose ps` → shows healthy status
- [ ] Connect to Postgres: `psql -h localhost -U postgres -d forgestack_dev`
- [ ] Connect to Redis: `redis-cli ping` → returns `PONG`

### Turborepo Pipeline
- [ ] Run `pnpm turbo build` → executes build for all packages
- [ ] Run `pnpm turbo lint` → lints all packages
- [ ] Verify caching works on subsequent runs

### TypeScript Compilation
- [ ] Run `pnpm turbo build` → TypeScript compiles without errors
- [ ] Verify `.d.ts` files are generated for packages
- [ ] Verify path aliases resolve correctly

### Lint/Format
- [ ] Run `pnpm lint` → completes without errors
- [ ] Run `pnpm format:check` → verifies formatting
- [ ] Run `pnpm format` → applies formatting

---

## Notes

- All apps and packages are **empty scaffolds** at this stage
- Actual implementations (NestJS, Next.js, etc.) will be added in subsequent specs
- This spec focuses purely on infrastructure and tooling setup
- Environment variables should use `.env.local` for local overrides (gitignored)

---

*Spec created following SDD methodology as defined in agents.md*

