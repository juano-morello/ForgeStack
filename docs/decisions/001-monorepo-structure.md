# ADR-001: Monorepo Structure with pnpm Workspaces and Turborepo

## Status
Accepted

## Context

ForgeStack is a full-stack SaaS application with multiple interconnected components:
- Frontend web application (Next.js)
- Backend API (NestJS)
- Background worker (BullMQ)
- Shared database schema and types
- Reusable UI components
- TypeScript SDK for external consumption

We needed to decide on a repository structure that would:
1. Enable code sharing between apps and packages
2. Provide efficient dependency management
3. Support fast, incremental builds
4. Maintain clear boundaries between components
5. Scale as the project grows

## Decision

We chose a **monorepo architecture** using:
- **pnpm workspaces** for dependency management
- **Turborepo** for build orchestration and caching

### Repository Structure

```
ForgeStack/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── worker/       # Background job processor
├── packages/
│   ├── db/           # Database schema, migrations, RLS
│   ├── shared/       # Shared types, constants, utilities
│   ├── sdk/          # TypeScript SDK
│   └── ui/           # UI component library
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Package Naming Convention

All packages use the `@forgestack/` scope:
- `@forgestack/api`
- `@forgestack/web`
- `@forgestack/worker`
- `@forgestack/db`
- `@forgestack/shared`
- `@forgestack/sdk`
- `@forgestack/ui`

### Dependency Management

- **pnpm** provides efficient disk space usage through content-addressable storage
- Workspaces enable internal package references without publishing
- Strict dependency hoisting prevents phantom dependencies
- Lock file ensures reproducible builds

### Build Orchestration

Turborepo configuration (`turbo.json`):
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Consequences

### Positive

1. **Code Sharing**: Packages can be easily shared between apps
   - `@forgestack/shared` provides types and utilities to all apps
   - `@forgestack/db` centralizes database schema
   - `@forgestack/ui` enables consistent UI across web app

2. **Type Safety**: TypeScript types are shared across the entire codebase
   - API and web share the same type definitions
   - SDK is always in sync with API types
   - Compile-time errors catch integration issues

3. **Efficient Builds**: Turborepo caching dramatically speeds up builds
   - Only changed packages are rebuilt
   - Remote caching can be enabled for CI/CD
   - Parallel execution of independent tasks

4. **Simplified Dependency Management**: Single lock file for entire project
   - Consistent versions across all packages
   - Easier to update dependencies
   - Reduced disk space usage

5. **Developer Experience**: Single repository simplifies development
   - One `git clone` to get entire codebase
   - Single `pnpm install` for all dependencies
   - Atomic commits across multiple packages
   - Easier to refactor across boundaries

6. **Testing**: Integration testing is straightforward
   - Can test API and web together
   - Shared test utilities
   - E2E tests can cover entire stack

### Negative

1. **Initial Complexity**: Steeper learning curve for new developers
   - Need to understand workspace concepts
   - Turborepo configuration can be confusing
   - Package interdependencies require careful management

2. **Build Times**: Initial builds can be slow
   - All packages must be built before apps
   - Mitigated by Turborepo caching

3. **CI/CD Complexity**: More complex than single-app repos
   - Need to determine which apps to deploy based on changes
   - Larger repository size
   - Mitigated by Turborepo's remote caching

4. **Versioning**: All packages share the same version
   - Cannot version packages independently
   - Acceptable for internal packages

## Alternatives Considered

### 1. Polyrepo (Multiple Repositories)

**Pros:**
- Clear separation of concerns
- Independent versioning
- Smaller repositories

**Cons:**
- Code duplication
- Difficult to share types
- Complex dependency management
- Harder to make cross-cutting changes
- Multiple repositories to clone and manage

**Rejected because:** The overhead of managing multiple repositories outweighs the benefits for a tightly coupled SaaS application.

### 2. Yarn Workspaces + Lerna

**Pros:**
- Mature ecosystem
- Similar to pnpm workspaces

**Cons:**
- Slower than pnpm
- Lerna is less actively maintained
- No built-in caching like Turborepo

**Rejected because:** pnpm is faster and more efficient, and Turborepo provides superior caching.

### 3. npm Workspaces + Nx

**Pros:**
- npm is built-in to Node.js
- Nx has powerful features

**Cons:**
- npm is slower than pnpm
- Nx has a steeper learning curve
- More opinionated than Turborepo

**Rejected because:** pnpm + Turborepo provides the best balance of performance and simplicity.

## Implementation Notes

### Setting Up a New Package

1. Create package directory:
   ```bash
   mkdir -p packages/new-package
   cd packages/new-package
   ```

2. Initialize package.json:
   ```json
   {
     "name": "@forgestack/new-package",
     "version": "0.0.1",
     "private": true,
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```

3. Add to workspace (automatic with pnpm-workspace.yaml)

4. Reference in other packages:
   ```json
   {
     "dependencies": {
       "@forgestack/new-package": "workspace:*"
     }
   }
   ```

### Adding Dependencies

```bash
# Add to specific package
pnpm add <package> --filter @forgestack/api

# Add to root (dev dependencies)
pnpm add -D <package> -w
```

### Running Commands

```bash
# Run in all packages
pnpm -r <command>

# Run in specific package
pnpm --filter @forgestack/api <command>

# Run with Turborepo
pnpm turbo <command>
```

## References

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Monorepo Best Practices](https://monorepo.tools/)

