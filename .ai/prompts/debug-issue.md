# Debug Issue Prompt Template

## Prompt

```
I'm experiencing an issue: [ISSUE_DESCRIPTION]

Context:
- Location: [FILE_OR_FEATURE]
- Error message: [ERROR_MESSAGE]
- Expected behavior: [EXPECTED]
- Actual behavior: [ACTUAL]
- Steps to reproduce: [STEPS]

Please help debug following ForgeStack patterns.
```

## Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ISSUE_DESCRIPTION` | Brief summary | `Projects not loading for certain orgs` |
| `FILE_OR_FEATURE` | Where it occurs | `apps/api/src/projects/`, `dashboard page` |
| `ERROR_MESSAGE` | Exact error | `TypeError: Cannot read property...` |
| `EXPECTED` | What should happen | `Projects list should load` |
| `ACTUAL` | What actually happens | `Empty list with no error` |
| `STEPS` | How to reproduce | `1. Login, 2. Switch org, 3. Go to projects` |

## Common ForgeStack Issues

### 1. RLS/Tenant Context Issues

**Symptoms:**
- Empty data when data exists
- "Not a member of this organization" error
- Cross-tenant data leakage

**Check:**
```typescript
// Is withTenantContext being used?
await withTenantContext(ctx, async (tx) => {
  return tx.select().from(projects);
});

// Is orgId being passed correctly?
const ctx: TenantContext = {
  orgId: request.tenantContext.orgId, // from header
  userId: request.tenantContext.userId,
  role: request.tenantContext.role,
};
```

### 2. Authentication Issues

**Symptoms:**
- 401 Unauthorized errors
- Session not persisting
- Redirect loops

**Check:**
```typescript
// Is route marked @Public() if needed?
@Public()
@Get('health')
healthCheck() {}

// Is session cookie being sent?
// Check: better-auth.session_token cookie
// Check: X-Org-Id header for org context
```

### 3. API Connection Issues

**Symptoms:**
- CORS errors
- Network failures
- Wrong URL

**Check:**
```typescript
// Environment variables
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
CORS_ORIGIN="http://localhost:3000"

// API client configuration
const response = await apiClient('/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### 4. Type Errors

**Symptoms:**
- TypeScript compilation errors
- Runtime type mismatches

**Check:**
```typescript
// Are you importing from the right place?
import { OrgRole } from '@forgestack/shared'; // ✅
import { OrgRole } from '@forgestack/db';     // Also valid

// Are types exported from index.ts?
// Check packages/*/src/index.ts
```

### 5. Build/Turbo Cache Issues

**Symptoms:**
- Old code running after changes
- "Module not found" after adding exports

**Fix:**
```bash
# Clean all build artifacts
pnpm clean

# Rebuild
pnpm build

# For persistent issues
rm -rf node_modules/.cache
pnpm install
```

## Debugging Checklist

### API Issues
- [ ] Check server logs: `docker compose logs -f api`
- [ ] Verify environment variables in `.env`
- [ ] Test endpoint with curl/Postman
- [ ] Check TenantContext is attached to request
- [ ] Verify RLS policies in database

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify API URL in network tab
- [ ] Check session cookie exists
- [ ] Verify X-Org-Id header is sent
- [ ] Check React Query/SWR cache

### Database Issues
- [ ] Check connection: `cd packages/db && pnpm db:studio`
- [ ] Verify RLS is enabled on table
- [ ] Check session variables are set
- [ ] Test query directly with SQL

## Example Debug Request

```
I'm experiencing an issue: API keys not appearing in the list even though they exist in the database.

Context:
- Location: apps/web/src/app/(protected)/settings/api-keys/page.tsx
- Error message: No error, just empty list
- Expected behavior: Should show 3 API keys I created
- Actual behavior: Shows "No API keys yet" empty state
- Steps to reproduce: 1. Login, 2. Go to Settings > API Keys

Please help debug following ForgeStack patterns.
```

## Log Locations

| Service | Log Command |
|---------|-------------|
| API | `docker compose logs -f api` or terminal output |
| Worker | `docker compose logs -f worker` or terminal output |
| PostgreSQL | `docker compose logs -f postgres` |
| Redis | `docker compose logs -f redis` |
| Web (dev) | Browser console + terminal output |

