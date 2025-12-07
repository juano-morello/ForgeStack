# Pattern: Database Queries with RLS

> How to safely query the database in ForgeStack using Drizzle ORM and PostgreSQL Row-Level Security.

## The Golden Rule

**ALL org-scoped queries MUST use `withTenantContext()`**

This ensures Row-Level Security (RLS) policies are enforced at the database level, preventing data leaks between tenants.

## TenantContext

```typescript
import { type TenantContext } from '@forgestack/db';

// TenantContext contains:
interface TenantContext {
  orgId: string;   // Current organization UUID
  userId: string;  // Current user UUID
  role: OrgRole;   // User's role: 'OWNER' | 'MEMBER'
}
```

## Basic Query Patterns

### Select All (with RLS)

```typescript
import { withTenantContext, type TenantContext } from '@forgestack/db';
import { projects } from '@forgestack/db';
import { desc } from 'drizzle-orm';

async findAll(ctx: TenantContext) {
  return withTenantContext(ctx, async (tx) => {
    // RLS automatically filters to ctx.orgId
    return tx.select().from(projects).orderBy(desc(projects.createdAt));
  });
}
```

### Select by ID

```typescript
import { eq } from 'drizzle-orm';

async findById(ctx: TenantContext, id: string) {
  return withTenantContext(ctx, async (tx) => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project ?? null;
  });
}
```

### Insert

```typescript
async create(ctx: TenantContext, dto: CreateProjectDto) {
  return withTenantContext(ctx, async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        ...dto,
        orgId: ctx.orgId, // ALWAYS set orgId from context
      })
      .returning();
    return project;
  });
}
```

### Update

```typescript
import { eq } from 'drizzle-orm';

async update(ctx: TenantContext, id: string, dto: UpdateProjectDto) {
  return withTenantContext(ctx, async (tx) => {
    const [updated] = await tx
      .update(projects)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return updated ?? null;
  });
}
```

### Delete

```typescript
async delete(ctx: TenantContext, id: string) {
  return withTenantContext(ctx, async (tx) => {
    const [deleted] = await tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return deleted ?? null;
  });
}
```

## Advanced Patterns

### Query with Relations

```typescript
import { projects, projectsRelations } from '@forgestack/db';

async findWithOrganization(ctx: TenantContext, id: string) {
  return withTenantContext(ctx, async (tx) => {
    return tx.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        organization: true,
      },
    });
  });
}
```

### Pagination

```typescript
import { count } from 'drizzle-orm';

async findPaginated(ctx: TenantContext, page: number, limit: number) {
  return withTenantContext(ctx, async (tx) => {
    const [items, [{ total }]] = await Promise.all([
      tx
        .select()
        .from(projects)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(projects.createdAt)),
      tx.select({ total: count() }).from(projects),
    ]);
    return { items, total, page, limit };
  });
}
```

### Filtering

```typescript
import { eq, and, ilike } from 'drizzle-orm';

async findFiltered(ctx: TenantContext, filters: { status?: string; search?: string }) {
  return withTenantContext(ctx, async (tx) => {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    if (filters.search) {
      conditions.push(ilike(projects.name, `%${filters.search}%`));
    }
    
    return tx
      .select()
      .from(projects)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  });
}
```

## Service Context (Bypass RLS)

For system operations that need to access data across tenants (e.g., cron jobs, admin operations):

```typescript
import { withServiceContext } from '@forgestack/db';

async systemCleanup() {
  return withServiceContext('Cleanup expired sessions', async (tx) => {
    // RLS is bypassed - use with extreme caution!
    return tx.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  });
}
```

**⚠️ WARNING**: Only use `withServiceContext` when absolutely necessary. Document the reason clearly.

## Common Mistakes

### ❌ Direct Query (Bypasses RLS!)

```typescript
// NEVER DO THIS for org-scoped data
async findAll() {
  return this.db.select().from(projects); // No RLS enforcement!
}
```

### ❌ Forgetting orgId on Insert

```typescript
// WRONG - orgId might not be set
async create(ctx: TenantContext, dto: CreateProjectDto) {
  return withTenantContext(ctx, async (tx) => {
    return tx.insert(projects).values(dto).returning(); // Missing orgId!
  });
}
```

### ✅ Correct Insert

```typescript
async create(ctx: TenantContext, dto: CreateProjectDto) {
  return withTenantContext(ctx, async (tx) => {
    return tx.insert(projects).values({
      ...dto,
      orgId: ctx.orgId, // Always from context
    }).returning();
  });
}
```

## Schema Definition Reference

```typescript
// packages/db/src/schema/projects.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

