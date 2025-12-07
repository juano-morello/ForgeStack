# Troubleshooting Guide

Common issues and solutions for ForgeStack development.

## Build & Compilation

### "Module not found" after adding exports

**Cause:** Turborepo cache or missing barrel export.

**Solution:**
```bash
pnpm clean
pnpm build
```

If persists, check `packages/*/src/index.ts` for missing exports.

### TypeScript errors in IDE but build passes

**Cause:** IDE using stale type information.

**Solution:**
1. Restart TypeScript server (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")
2. Run `pnpm build` to regenerate types

### "Cannot find module '@forgestack/...'"

**Cause:** Package not built or symlink issue.

**Solution:**
```bash
pnpm install
pnpm build --filter=@forgestack/db --filter=@forgestack/shared
```

---

## Database & RLS

### Empty data when records exist

**Cause:** RLS filtering out records due to missing/wrong tenant context.

**Check:**
1. Is `withTenantContext()` being used?
2. Is `orgId` correct in the context?
3. Is the user a member of the organization?

```typescript
// Debug: Log the context
console.log('TenantContext:', ctx);

// Verify membership
const member = await db.select().from(organizationMembers)
  .where(and(
    eq(organizationMembers.orgId, ctx.orgId),
    eq(organizationMembers.userId, ctx.userId)
  ));
```

### "permission denied for table"

**Cause:** RLS policy blocking access.

**Solution:**
1. Check RLS policies: `cd packages/db && pnpm db:studio`
2. Verify session variables are set correctly
3. For service operations, use `withServiceContext()` instead

### Database connection refused

**Cause:** PostgreSQL not running.

**Solution:**
```bash
docker compose up -d postgres
# Wait a few seconds, then:
docker compose logs postgres
```

---

## Authentication

### 401 Unauthorized on all requests

**Causes:**
1. Session cookie not being sent
2. Session expired
3. CORS blocking cookies

**Check:**
```typescript
// Browser DevTools → Application → Cookies
// Look for: better-auth.session_token

// Check CORS settings
CORS_ORIGIN="http://localhost:3000"
```

### Redirect loop on login

**Cause:** Middleware redirecting authenticated users to login.

**Check:**
1. Session cookie exists
2. `middleware.ts` public routes list
3. Auth server URL configuration

### "Not a member of this organization"

**Cause:** User trying to access org they don't belong to.

**Check:**
1. X-Org-Id header value
2. User's organization memberships
3. Organization exists and isn't suspended

---

## API Issues

### CORS errors

**Cause:** API not allowing frontend origin.

**Solution:**
```bash
# .env
CORS_ORIGIN="http://localhost:3000"
```

For multiple origins:
```bash
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

### 500 Internal Server Error

**Debug steps:**
1. Check API logs: `docker compose logs -f api` or terminal
2. Look for stack trace
3. Check environment variables

### Request body not parsed

**Cause:** Missing Content-Type header or raw body needed.

**Solution:**
```typescript
// For JSON
headers: { 'Content-Type': 'application/json' }

// For webhooks needing raw body
@Post('webhook')
async handleWebhook(@Req() req: RawBodyRequest<Request>) {
  const rawBody = req.rawBody;
}
```

---

## Worker/Queue Issues

### Jobs not processing

**Causes:**
1. Worker not running
2. Redis not connected
3. Queue name mismatch

**Check:**
```bash
# Is worker running?
docker compose logs -f worker

# Is Redis running?
docker compose logs redis

# Check queue names match
# packages/shared/src/queues.ts
```

### Jobs failing silently

**Solution:** Add error handling and logging:
```typescript
export async function handleJob(job: Job) {
  try {
    // ... job logic
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Job failed');
    throw error; // Re-throw to trigger retry
  }
}
```

---

## Frontend Issues

### Hydration mismatch

**Cause:** Server and client rendering different content.

**Solution:**
1. Use `'use client'` for components with browser APIs
2. Check for `typeof window !== 'undefined'` guards
3. Ensure consistent data between server and client

### API data not updating

**Cause:** SWR/React Query cache.

**Solution:**
```typescript
// Force refetch
mutate('/api/projects');

// Or use revalidation
const { data, mutate } = useSWR('/api/projects');
await mutate(); // Revalidate
```

### Environment variables undefined

**Cause:** Missing `NEXT_PUBLIC_` prefix for client-side vars.

**Solution:**
```bash
# Server-side only
DATABASE_URL="..."

# Available in browser
NEXT_PUBLIC_API_URL="..."
```

---

## Testing

### Tests failing with "Cannot find module"

**Solution:**
```bash
pnpm build
pnpm test
```

### Integration tests failing

**Cause:** Database not available or not seeded.

**Solution:**
```bash
docker compose up -d postgres
cd packages/db && pnpm db:push
cd apps/api && pnpm test:integration
```

### E2E tests timing out

**Cause:** App not running or slow startup.

**Solution:**
```bash
# Start app first
pnpm dev

# In another terminal
cd apps/web && pnpm e2e
```

---

## Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Stale cache | `pnpm clean && pnpm build` |
| DB connection | `docker compose up -d` |
| Type errors | Restart TS server |
| Missing env vars | Check `.env` file |
| CORS errors | Check `CORS_ORIGIN` |
| Auth issues | Clear cookies, re-login |

