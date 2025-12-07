# Multi-Tenancy Feature

ForgeStack implements multi-tenancy using PostgreSQL Row-Level Security (RLS) with organization-based data isolation.

## Architecture

```
Request with X-Org-Id header
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TenantContextGuard                            │
│  1. Verify session → get userId                                  │
│  2. Extract X-Org-Id header → get orgId                         │
│  3. Lookup organization_members → get role                       │
│  4. Attach TenantContext to request                              │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                 │
│  withTenantContext(ctx, async (tx) => {                         │
│    // All queries automatically filtered by RLS                  │
│    return tx.select().from(projects);                           │
│  });                                                             │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL RLS                                │
│  SET app.current_org_id = 'org-uuid';                           │
│  SET app.current_user_id = 'user-uuid';                         │
│  SET app.current_role = 'OWNER';                                │
│                                                                  │
│  Policy: org_id = current_setting('app.current_org_id')::uuid   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/db/src/context.ts` | `withTenantContext()` function |
| `apps/api/src/core/guards/tenant-context.guard.ts` | Extracts tenant context |
| `apps/api/src/core/decorators/tenant-context.decorator.ts` | `@CurrentTenant()` |
| `packages/db/drizzle/*.sql` | RLS policy migrations |

## TenantContext Type

```typescript
interface TenantContext {
  orgId: string;    // Current organization UUID
  userId: string;   // Current user ID
  role: OrgRole;    // 'OWNER' | 'MEMBER'
}
```

## Using withTenantContext

**CRITICAL:** All org-scoped database queries MUST use `withTenantContext()`.

```typescript
import { withTenantContext, projects, eq } from '@forgestack/db';

// In a service method
async findAll(ctx: TenantContext): Promise<Project[]> {
  return withTenantContext(ctx, async (tx) => {
    // RLS automatically filters to current org
    return tx.select().from(projects);
  });
}

async findById(ctx: TenantContext, id: string): Promise<Project | null> {
  return withTenantContext(ctx, async (tx) => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || null;
  });
}

async create(ctx: TenantContext, data: CreateProjectDto): Promise<Project> {
  return withTenantContext(ctx, async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        orgId: ctx.orgId,  // Always set orgId from context
        name: data.name,
        description: data.description,
      })
      .returning();
    return project;
  });
}
```

## Service Context (No RLS)

For operations that need to bypass RLS (e.g., worker jobs, cross-org queries):

```typescript
import { withServiceContext } from '@forgestack/db';

// In worker handler
async function processJob(orgId: string) {
  return withServiceContext(async (tx) => {
    // No RLS - can access any org's data
    return tx.select().from(projects).where(eq(projects.orgId, orgId));
  });
}
```

## Frontend: Organization Context

```typescript
import { useOrgContext } from '@/components/providers/org-provider';

function MyComponent() {
  const { currentOrg, organizations, switchOrg, isLoading } = useOrgContext();
  
  // currentOrg.id is sent as X-Org-Id header automatically
}
```

## API Client: Sending Org Header

```typescript
// apps/web/src/lib/api-client.ts
const response = await fetch(`${API_URL}${endpoint}`, {
  headers: {
    'Content-Type': 'application/json',
    'X-Org-Id': currentOrgId,  // Set from OrgContext
  },
  credentials: 'include',  // Include session cookie
});
```

## RLS-Enabled Tables

| Table | RLS Policy |
|-------|------------|
| `projects` | `org_id = current_org_id` |
| `api_keys` | `org_id = current_org_id` |
| `webhook_endpoints` | `org_id = current_org_id` |
| `webhook_deliveries` | `org_id = current_org_id` |
| `audit_logs` | `org_id = current_org_id` |
| `activities` | `org_id = current_org_id` |
| `files` | `org_id = current_org_id` |
| `notifications` | `org_id = current_org_id` |
| `usage_records` | `org_id = current_org_id` |

## Common Patterns

### Controller with Tenant Context

```typescript
@Controller('projects')
export class ProjectsController {
  @Get()
  findAll(@CurrentTenant() ctx: TenantContext) {
    return this.service.findAll(ctx);
  }
  
  @Post()
  create(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateProjectDto) {
    return this.service.create(ctx, dto);
  }
}
```

### Repository Pattern

```typescript
@Injectable()
export class ProjectsRepository {
  async findAll(ctx: TenantContext): Promise<Project[]> {
    return withTenantContext(ctx, (tx) => tx.select().from(projects));
  }
}
```

