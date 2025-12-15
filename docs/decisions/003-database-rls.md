# ADR-003: PostgreSQL Row-Level Security for Multi-Tenancy

## Status
Accepted

## Context

ForgeStack is a multi-tenant SaaS application where:
1. Multiple organizations share the same database
2. Data must be strictly isolated between organizations
3. Users can belong to multiple organizations
4. Security is critical - data leaks are unacceptable
5. Performance must remain high despite isolation
6. Developers should not need to manually filter by organization

We needed to choose a multi-tenancy strategy that provides strong security guarantees while maintaining developer productivity.

## Decision

We chose **PostgreSQL Row-Level Security (RLS)** as our multi-tenancy isolation mechanism.

### Implementation Approach

**1. Session Variables for Context:**
```sql
-- Set organization context at the start of each transaction
SET LOCAL app.current_org_id = 'org-uuid';
SET LOCAL app.current_user_id = 'user-uuid';
SET LOCAL app.current_role = 'owner';
```

**2. RLS Policies on Tables:**
```sql
-- Enable RLS on org-scoped tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to filter by organization
CREATE POLICY projects_org_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);
```

**3. Application-Level Context Management:**
```typescript
// packages/db/src/context.ts
export async function withTenantContext<T>(
  ctx: TenantContext,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set session variables
    await tx.execute(sql`SET LOCAL app.current_org_id = ${ctx.orgId}`);
    await tx.execute(sql`SET LOCAL app.current_user_id = ${ctx.userId}`);
    await tx.execute(sql`SET LOCAL app.current_role = ${ctx.role}`);
    
    // Execute query - RLS automatically filters
    return callback(tx);
  });
}
```

**4. Guard Integration:**
```typescript
// apps/api/src/core/guards/tenant-context.guard.ts
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];
    
    // Validate user has access to org
    // Set tenant context on request
    request.tenantContext = { orgId, userId, role };
    
    return true;
  }
}
```

### Tables with RLS

All organization-scoped tables have RLS enabled:
- `projects`
- `organization_members`
- `invitations`
- `api_keys`
- `webhook_endpoints`
- `webhook_deliveries`
- `files`
- `activities`
- `notifications`
- `audit_logs`
- `feature_flags` (org overrides)
- `usage_records`
- `customers`
- `subscriptions`

### Tables without RLS

Global tables that are not org-scoped:
- `users` (users can belong to multiple orgs)
- `organizations` (filtered by membership)
- `roles` (system roles + org-specific roles)
- `permissions` (global permission definitions)
- `plans` (global subscription plans)
- `platform_audit_logs` (super admin only)

## Consequences

### Positive

1. **Security by Default**: Impossible to accidentally query wrong org's data
   - RLS is enforced at the database level
   - Even if application code has bugs, data is protected
   - SQL injection cannot bypass RLS
   - Defense in depth

2. **Developer Productivity**: No manual filtering required
   ```typescript
   // This automatically filters by organization!
   const projects = await tx.select().from(projects);
   ```

3. **Performance**: Efficient query execution
   - PostgreSQL optimizes RLS policies
   - Indexes work with RLS
   - No application-level filtering overhead

4. **Auditability**: Clear security model
   - Policies are visible in database schema
   - Easy to audit and verify
   - Compliance-friendly

5. **Consistency**: Same isolation across all queries
   - SELECT, INSERT, UPDATE, DELETE all filtered
   - No way to bypass isolation
   - Works with ORMs and raw SQL

6. **Testing**: Easy to test isolation
   - Can verify RLS policies in integration tests
   - Simulate different org contexts
   - Catch isolation bugs early

### Negative

1. **Complexity**: Additional setup required
   - Need to set session variables for each transaction
   - RLS policies must be carefully written
   - Debugging can be harder

2. **Performance Overhead**: Small overhead from RLS checks
   - Negligible in most cases
   - Can be optimized with proper indexes

3. **Migration Challenges**: Existing data requires careful migration
   - Must ensure all rows have organization_id
   - Backfilling can be complex

4. **Limited ORM Support**: Not all ORMs handle RLS well
   - Drizzle works well with raw SQL
   - Some ORMs may bypass RLS

5. **Transaction Requirement**: Must use transactions
   - Every query needs transaction context
   - Can't use simple queries without context
   - More boilerplate

## Alternatives Considered

### 1. Application-Level Filtering

**Approach:** Add `WHERE organization_id = ?` to every query

**Pros:**
- Simple to understand
- No database-specific features
- Works with any database

**Cons:**
- **Error-prone**: Easy to forget filter
- **Security risk**: One missed filter = data leak
- **Maintenance burden**: Every query needs manual filtering
- **Code duplication**: Filter logic repeated everywhere

**Rejected because:** Too risky. A single forgotten WHERE clause could leak data across organizations.

### 2. Separate Databases per Tenant

**Approach:** Each organization gets its own database

**Pros:**
- Complete isolation
- Easy to backup/restore per tenant
- Can scale tenants independently

**Cons:**
- **Operational complexity**: Managing thousands of databases
- **Cost**: More expensive infrastructure
- **Schema migrations**: Must run on every database
- **Cross-tenant queries**: Impossible or very complex
- **Connection pooling**: Difficult to manage

**Rejected because:** Doesn't scale well for a SaaS with many small tenants. Operational overhead is too high.

### 3. Separate Schemas per Tenant

**Approach:** Each organization gets its own PostgreSQL schema

**Pros:**
- Better isolation than RLS
- Easier than separate databases
- Can use same connection pool

**Cons:**
- **Schema migrations**: Must run on every schema
- **Connection management**: Need to switch schemas
- **Limited scalability**: PostgreSQL has schema limits
- **Backup complexity**: Harder to backup/restore

**Rejected because:** Middle ground that doesn't provide enough benefits over RLS. Still has significant operational complexity.

### 4. Discriminator Column with Views

**Approach:** Use views with WHERE clauses for each tenant

**Pros:**
- Simpler than RLS
- Works with older PostgreSQL versions

**Cons:**
- **View management**: Need views for every table
- **Performance**: Views can be slower
- **Flexibility**: Hard to handle complex queries
- **Security**: Views can be bypassed

**Rejected because:** RLS provides the same benefits with better performance and security.

### 5. Application-Level Middleware

**Approach:** Middleware intercepts queries and adds filters

**Pros:**
- Framework-agnostic
- Can work with any database

**Cons:**
- **Complexity**: Hard to implement correctly
- **Performance**: Additional overhead
- **Bypass risk**: Can be circumvented
- **ORM compatibility**: May not work with all ORMs

**Rejected because:** More complex than RLS with worse security guarantees.

## Implementation Notes

### Creating RLS Policies

```sql
-- 1. Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for SELECT
CREATE POLICY table_name_org_isolation ON table_name
  FOR SELECT
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);

-- 3. Create policy for INSERT
CREATE POLICY table_name_org_insert ON table_name
  FOR INSERT
  WITH CHECK (organization_id = current_setting('app.current_org_id', true)::uuid);

-- 4. Create policy for UPDATE
CREATE POLICY table_name_org_update ON table_name
  FOR UPDATE
  USING (organization_id = current_setting('app.current_org_id', true)::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org_id', true)::uuid);

-- 5. Create policy for DELETE
CREATE POLICY table_name_org_delete ON table_name
  FOR DELETE
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);
```

### Testing RLS Policies

```typescript
describe('RLS Policies', () => {
  it('should isolate projects by organization', async () => {
    // Create projects in different orgs
    const org1Project = await createProject(org1Context);
    const org2Project = await createProject(org2Context);
    
    // Query with org1 context
    const org1Projects = await withTenantContext(org1Context, async (tx) => {
      return tx.select().from(projects);
    });
    
    // Should only see org1 project
    expect(org1Projects).toHaveLength(1);
    expect(org1Projects[0].id).toBe(org1Project.id);
  });
});
```

### Bypassing RLS (Admin Queries)

```typescript
// For super admin queries that need to see all data
export async function withServiceContext<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Disable RLS for this transaction
    await tx.execute(sql`SET LOCAL row_security = off`);
    return callback(tx);
  });
}
```

### RLS Bypass Audit Table

To maintain security visibility when RLS is bypassed, all bypass operations are logged to the `rls_bypass_audit` table:

```sql
CREATE TABLE rls_bypass_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,           -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,          -- Table being accessed
  user_id UUID,                      -- User performing the operation (if known)
  reason TEXT NOT NULL,              -- Why RLS was bypassed
  query_context JSONB,               -- Additional context (e.g., affected IDs)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rls_bypass_audit_created_at ON rls_bypass_audit(created_at);
CREATE INDEX idx_rls_bypass_audit_user_id ON rls_bypass_audit(user_id);
```

This table is used by `withServiceContext()` to log all RLS bypass operations for security auditing and compliance purposes.

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenancy with RLS](https://www.citusdata.com/blog/2018/02/13/using-postgresql-row-level-security/)
- [RLS Performance Considerations](https://www.postgresql.org/docs/current/sql-createpolicy.html)

