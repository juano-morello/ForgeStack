# ForgeStack Code Conventions

This document outlines the coding standards and conventions used throughout ForgeStack.

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| **Controllers** | `{resource}.controller.ts` | `projects.controller.ts` |
| **Services** | `{resource}.service.ts` | `projects.service.ts` |
| **Repositories** | `{resource}.repository.ts` | `projects.repository.ts` |
| **Modules** | `{resource}.module.ts` | `projects.module.ts` |
| **DTOs** | `{action}-{resource}.dto.ts` | `create-project.dto.ts` |
| **Guards** | `{name}.guard.ts` | `tenant-context.guard.ts` |
| **Decorators** | `{name}.decorator.ts` | `current-tenant.decorator.ts` |
| **React Components** | `{component-name}.tsx` | `project-card.tsx` |
| **React Hooks** | `use-{name}.ts` | `use-projects.ts` |
| **Tests** | `{file}.spec.ts` (Jest) or `{file}.test.ts` (Vitest) | `projects.service.spec.ts` |
| **Storybook** | `{component}.stories.tsx` | `project-card.stories.tsx` |
| **Schema** | `{table-name}.ts` (singular or plural) | `projects.ts`, `users.ts` |

### TypeScript

```typescript
// Classes: PascalCase
class ProjectsService {}
class TenantContextGuard {}

// Interfaces/Types: PascalCase
interface TenantContext {}
type OrgRole = 'OWNER' | 'MEMBER';

// Functions/Methods: camelCase
function createProject() {}
async function findById(id: string) {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const QUEUE_NAMES = { ... };

// Variables: camelCase
const projectName = 'My Project';
let isLoading = false;

// Enums: PascalCase with SCREAMING_SNAKE_CASE values
enum OrgRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}
```

### Database

```typescript
// Table names: snake_case, plural
'users', 'organizations', 'organization_members', 'api_keys'

// Column names: snake_case
'created_at', 'updated_at', 'org_id', 'user_id'

// Foreign keys: {referenced_table_singular}_id
'org_id', 'user_id', 'project_id'
```

## File Structure

### API Module Structure

```
apps/api/src/{module}/
├── {module}.module.ts        # NestJS module definition
├── {module}.controller.ts    # HTTP endpoints
├── {module}.service.ts       # Business logic
├── {module}.repository.ts    # Database queries
├── {module}.controller.spec.ts
├── {module}.service.spec.ts
└── dto/
    ├── index.ts              # Barrel export
    ├── create-{resource}.dto.ts
    ├── update-{resource}.dto.ts
    └── query-{resource}.dto.ts
```

### React Component Structure

```
apps/web/src/components/{feature}/
├── {component}.tsx           # Component implementation
├── {component}.test.tsx      # Unit tests
└── {component}.stories.tsx   # Storybook stories
```

## Import Order

Imports should be ordered as follows (with blank lines between groups):

```typescript
// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

// 3. Monorepo packages (@forgestack/*)
import { withTenantContext, projects } from '@forgestack/db';
import { QUEUE_NAMES } from '@forgestack/shared';

// 4. Relative imports (parent directories first)
import { TenantContext } from '../core/types';
import { CreateProjectDto } from './dto/create-project.dto';
```

## TypeScript Guidelines

### Strict Mode

All packages use TypeScript strict mode. Avoid `any` types:

```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: ProjectInput) {}
function process(data: unknown) { /* with type guards */ }
```

### Type Exports

Export types from schema files and re-export from index:

```typescript
// packages/db/src/schema/projects.ts
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// packages/db/src/index.ts
export type { Project, NewProject } from './schema/projects';
```

