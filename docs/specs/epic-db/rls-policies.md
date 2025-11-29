# RLS Policies + withTenantContext()

**Epic:** Database  
**Priority:** #3  
**Depends on:** Priority #2 (Drizzle schema + base migrations)  
**Status:** Draft

---

## Overview

This specification defines the implementation of **Row-Level Security (RLS)** policies in Postgres for multi-tenant data isolation in ForgeStack. RLS ensures that database-level access control is enforced regardless of the application layer, providing defense-in-depth security for tenant data.

Additionally, this spec defines the `withTenantContext()` utility function that must wrap all org-scoped database operations. This function sets PostgreSQL session variables (`app.current_org_id`, `app.current_user_id`, `app.current_role`) that RLS policies use to determine row visibility and modification rights.

### Key Principles

- **RLS is the source of truth** – Application code cannot bypass tenant isolation
- **All org-scoped queries must use `withTenantContext()`** – Direct queries without context are blocked
- **Session variables are transaction-scoped** – Using `SET LOCAL` ensures context doesn't leak between requests
- **Fail-closed** – If no context is set, no rows are visible

---

## Acceptance Criteria

### RLS Enablement
- [ ] RLS is enabled on all org-scoped tables:
  - `organizations`
  - `organization_members`
  - `projects`
- [ ] RLS policies are enforced for ALL operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] Default-deny policy: if no context is set, zero rows are returned

### Session Variables
- [ ] `app.current_org_id` (UUID) – The active organization ID
- [ ] `app.current_user_id` (UUID) – The authenticated user ID
- [ ] `app.current_role` (TEXT) – The user's role in the current org (`OWNER` | `MEMBER`)

### RLS Policies
- [ ] **organizations table:**
  - Users can SELECT organizations where they are a member
  - Only OWNER can UPDATE organization details
  - Only OWNER can DELETE an organization
- [ ] **organization_members table:**
  - Users can SELECT members of their current org
  - Only OWNER can INSERT new members
  - Only OWNER can DELETE members (except cannot delete self if only owner)
  - OWNER can UPDATE member roles
- [ ] **projects table:**
  - Users can SELECT projects belonging to their current org
  - OWNER and MEMBER can INSERT new projects
  - OWNER and MEMBER can UPDATE projects in their org
  - Only OWNER can DELETE projects

### withTenantContext() Function
- [ ] Located in `packages/db/src/context.ts`
- [ ] Accepts parameters: `{ orgId: string, userId: string, role: 'OWNER' | 'MEMBER' }`
- [ ] Wraps database operations in a transaction
- [ ] Sets `LOCAL` session variables before executing callback
- [ ] Returns the result of the callback function
- [ ] Properly handles errors and rolls back transaction on failure
- [ ] TypeScript types exported for TenantContext

### System Bypass
- [ ] Service accounts can bypass RLS using a separate connection pool
- [ ] Bypass mechanism uses `SET LOCAL app.bypass_rls = 'true'` with superuser policy
- [ ] All bypass operations are logged/auditable
- [ ] Bypass is NEVER exposed to user-facing API routes

---

## Tasks & Subtasks

### 1. Create Migration to Enable RLS on Tables
- [ ] Create migration file `XXXX_enable_rls.sql`
- [ ] Enable RLS on `organizations` table
- [ ] Enable RLS on `organization_members` table
- [ ] Enable RLS on `projects` table
- [ ] Force RLS for table owners (FORCE ROW LEVEL SECURITY)

### 2. Create RLS Policies for Organizations Table
- [ ] Create SELECT policy: user must be member of org
- [ ] Create UPDATE policy: user must be OWNER
- [ ] Create DELETE policy: user must be OWNER
- [ ] Create INSERT policy: any authenticated user can create org (they become owner)

### 3. Create RLS Policies for Organization Members Table
- [ ] Create SELECT policy: user must be member of same org
- [ ] Create INSERT policy: user must be OWNER of org
- [ ] Create UPDATE policy: user must be OWNER of org
- [ ] Create DELETE policy: user must be OWNER of org

### 4. Create RLS Policies for Projects Table
- [ ] Create SELECT policy: user must be member of project's org
- [ ] Create INSERT policy: user must be member of org (OWNER or MEMBER)
- [ ] Create UPDATE policy: user must be member of org (OWNER or MEMBER)
- [ ] Create DELETE policy: user must be OWNER of org

### 5. Implement withTenantContext() Utility Function
- [ ] Create `packages/db/src/context.ts`
- [ ] Implement `withTenantContext<T>(ctx: TenantContext, fn: (tx: Transaction) => Promise<T>): Promise<T>`
- [ ] Use `db.transaction()` to wrap operations
- [ ] Execute `SET LOCAL` statements for all three session variables
- [ ] Handle async callback execution
- [ ] Ensure proper error propagation and transaction rollback

### 6. Create TypeScript Types for Tenant Context
- [ ] Create `packages/db/src/types/tenant-context.ts`
- [ ] Define `TenantContext` interface
- [ ] Define `OrgRole` enum/type (`OWNER` | `MEMBER`)
- [ ] Export types from `packages/db` index

### 7. Add Integration Tests for RLS Enforcement
- [ ] Test: SELECT returns empty when no context set
- [ ] Test: SELECT returns rows when valid context set
- [ ] Test: Cross-org access blocked (user A cannot see user B's org data)
- [ ] Test: OWNER can perform all operations
- [ ] Test: MEMBER cannot delete projects
- [ ] Test: MEMBER cannot manage organization members
- [ ] Test: Transaction rollback clears session variables

### 8. Document RLS Bypass for Service Accounts
- [ ] Create `withServiceContext()` function for system operations
- [ ] Document when bypass is appropriate (migrations, admin tasks, workers)
- [ ] Add bypass audit logging mechanism
- [ ] Write usage guidelines in code comments

---

## Test Plan

### Unit Tests (packages/db)
| Test Case | Expected Result |
|-----------|-----------------|
| `withTenantContext` sets session variables | Variables accessible via `current_setting()` |
| `withTenantContext` returns callback result | Returned value matches callback return |
| `withTenantContext` rolls back on error | Transaction aborted, changes not persisted |
| Invalid context throws error | Rejects with validation error |

### Integration Tests (RLS Enforcement)
| Test Case | Expected Result |
|-----------|-----------------|
| SELECT without context | Returns 0 rows |
| SELECT with valid context | Returns only current org's rows |
| User queries different org's projects | Returns 0 rows |
| OWNER deletes project | Success |
| MEMBER deletes project | Permission denied error |
| OWNER adds organization member | Success |
| MEMBER adds organization member | Permission denied error |
| Direct SQL bypass attempt (no context) | Returns 0 rows |
| Concurrent requests have isolated context | Each sees only own org data |
| Transaction rollback clears context | Subsequent query has no context |

### Edge Cases
| Test Case | Expected Result |
|-----------|-----------------|
| User removed from org mid-session | Next query returns 0 rows |
| Org deleted while user active | Next query returns 0 rows |
| Empty orgId provided | Validation error before query |
| SQL injection in orgId | Parameterized query prevents injection |

---

## Implementation Notes

### Session Variable Pattern
```sql
-- Set context at start of transaction
SET LOCAL app.current_org_id = '<org_uuid>';
SET LOCAL app.current_user_id = '<user_uuid>';
SET LOCAL app.current_role = '<role>';

-- All subsequent queries in this transaction respect RLS
SELECT * FROM projects; -- Only returns projects for current_org_id
```

### Example RLS Policy
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    org_id::text = current_setting('app.current_org_id', true)
  );

-- DELETE policy (OWNER only)
CREATE POLICY projects_delete_policy ON projects
  FOR DELETE
  USING (
    org_id::text = current_setting('app.current_org_id', true)
    AND current_setting('app.current_role', true) = 'OWNER'
  );
```

### withTenantContext() Signature
```typescript
interface TenantContext {
  orgId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
}

async function withTenantContext<T>(
  ctx: TenantContext,
  fn: (tx: Transaction) => Promise<T>
): Promise<T>;
```

---

## Dependencies

- **Drizzle ORM** with PostgreSQL driver (pg-node)
- **PostgreSQL 15+** (RLS support)
- Priority #2 (Drizzle schema) must be complete

---

## Security Considerations

1. **Never log session variable values** – They contain sensitive context
2. **Validate UUIDs** – Ensure orgId/userId are valid UUIDs before setting
3. **Audit bypass usage** – All service context operations must be traceable
4. **Test RLS in CI** – Integration tests must verify isolation on every PR
5. **No RLS bypass in API routes** – Only workers and admin scripts may bypass

---

*End of spec*

