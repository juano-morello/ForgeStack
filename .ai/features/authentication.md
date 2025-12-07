# Authentication Feature

ForgeStack uses [better-auth](https://better-auth.com) for authentication with email/password login.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  auth-client.ts          │  middleware.ts                   ││
│  │  - signIn, signUp        │  - Route protection              ││
│  │  - signOut, useSession   │  - Session cookie check          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  /api/auth/*  (Next.js API routes)                          ││
│  │  - Handles all auth operations                               ││
│  │  - Uses better-auth server                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Session Cookie
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (NestJS)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  TenantContextGuard                                          ││
│  │  1. Extract session token from cookie                        ││
│  │  2. Verify with better-auth via HTTP                         ││
│  │  3. Attach userId to request                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/auth.ts` | better-auth server configuration |
| `apps/web/src/lib/auth-client.ts` | Client-side auth methods |
| `apps/web/src/middleware.ts` | Route protection middleware |
| `apps/web/src/app/api/auth/[...all]/route.ts` | Auth API routes |
| `apps/api/src/auth/auth.service.ts` | Session verification service |
| `apps/api/src/core/guards/tenant-context.guard.ts` | Auth guard |

## Frontend Usage

### Check Session Status

```typescript
import { useSession } from '@/lib/auth-client';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <Loading />;
  if (!session) return <LoginPrompt />;
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Sign In

```typescript
import { signIn } from '@/lib/auth-client';

async function handleLogin(email: string, password: string) {
  const result = await signIn.email({
    email,
    password,
    callbackURL: '/dashboard',
  });
  
  if (result.error) {
    // Handle error
  }
}
```

### Sign Up

```typescript
import { signUp } from '@/lib/auth-client';

async function handleSignup(name: string, email: string, password: string) {
  const result = await signUp.email({
    name,
    email,
    password,
    callbackURL: '/onboarding',
  });
}
```

### Sign Out

```typescript
import { signOut } from '@/lib/auth-client';

async function handleLogout() {
  await signOut({ fetchOptions: { onSuccess: () => router.push('/login') } });
}
```

## Backend Usage

### Accessing Current User

```typescript
// In any controller with TenantContextGuard
@Get('me')
getMe(@CurrentTenant() ctx: TenantContext) {
  return { userId: ctx.userId };
}
```

### Public Routes (No Auth Required)

```typescript
import { Public } from '../core/decorators/public.decorator';

@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### Auth Required, No Org Context

```typescript
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';

@NoOrgRequired()
@Get('organizations')
listMyOrgs(@Req() req: RequestWithUser) {
  // User is authenticated but no X-Org-Id header needed
  return this.service.findByUser(req.user.id);
}
```

## Session Cookie

- **Cookie name:** `better-auth.session_token`
- **Duration:** 7 days (configurable)
- **Refresh:** Automatically refreshed after 1 day of activity

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `sessions` | Active sessions |
| `accounts` | OAuth accounts (future) |
| `verifications` | Email verification tokens |

## Protected Routes (Frontend)

Routes are protected in `middleware.ts`:

```typescript
// Public routes (no auth required)
const publicRoutes = ['/', '/login', '/signup', '/invitations/decline'];
const publicPrefixes = ['/api/auth', '/_next', '/favicon.ico'];

// Everything else requires session cookie
```

