# better-auth Integration

**Epic:** Auth
**Priority:** #5
**Depends on:** Priority #4 (NestJS API Skeleton with TenantContextGuard)
**Status:** Draft

---

## Overview

This specification defines the integration of **better-auth** for authentication in ForgeStack. better-auth is a modern, full-featured authentication library for TypeScript that provides:

- **Email/password authentication** with secure password hashing
- **OAuth provider support** (Google, GitHub, etc. – future enhancement)
- **Session management** with secure cookie-based sessions
- **Next.js App Router integration** via client/server helpers
- **Database adapter for Drizzle ORM** to persist sessions and users

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  /login     │  │  /signup    │  │  Protected Routes       │  │
│  │  page       │  │  page       │  │  (middleware redirects) │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          ▼                                       │
│              ┌───────────────────────┐                          │
│              │  better-auth client   │                          │
│              │  (src/lib/auth.ts)    │                          │
│              └───────────┬───────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │ Session Cookie
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    TenantContextGuard                       │  │
│  │  1. Extract session token from cookie/header                │  │
│  │  2. Verify session with better-auth or validate JWT         │  │
│  │  3. Extract userId from verified session                    │  │
│  │  4. Lookup org membership → get role                        │  │
│  │  5. Attach TenantContext to request                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Database (Postgres)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │    users     │  │   sessions   │  │ organization_members   │  │
│  │  (existing)  │  │ (better-auth)│  │      (existing)        │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Session-based auth** – better-auth manages sessions via secure HTTP-only cookies
- **Server-side validation** – NestJS verifies session before processing requests
- **Unified user table** – better-auth uses existing `users` table (with additional fields if needed)
- **Fail-closed** – Invalid or missing session returns 401 Unauthorized

---

## Acceptance Criteria

### Frontend (Next.js)

- [ ] better-auth client configured in `apps/web/src/lib/auth.ts`
- [ ] Sign up page at `/signup` with email/password form
- [ ] Login page at `/login` with email/password form
- [ ] Protected routes redirect to `/login` if not authenticated
- [ ] Auth state accessible via React context/hooks (`useAuth`)
- [ ] Logout functionality clears session
- [ ] Session persisted via secure HTTP-only cookies
- [ ] Form validation with error messages
- [ ] Loading states during auth operations

### Backend (NestJS)

- [ ] better-auth server configured or auth verification service
- [ ] `TenantContextGuard` updated to verify session token instead of X-User-Id header
- [ ] User ID extracted from verified session
- [ ] Protected endpoints require valid session (401 if missing/invalid)
- [ ] `GET /api/v1/auth/me` endpoint returns current user info
- [ ] Auth routes marked as public (login, signup, session validation)

### Database

- [ ] better-auth session table created (if required by better-auth)
- [ ] better-auth account table created (if required for OAuth – future)
- [ ] `users` table extended with `password_hash` column (or use better-auth users table)
- [ ] Link better-auth users to existing `users` table via email or ID
- [ ] Migration script for new auth-related tables

---

## Tasks & Subtasks

### Frontend Tasks

#### 1. Install better-auth Client Dependencies
- [ ] Add `better-auth` to `apps/web`
- [ ] Verify compatibility with Next.js 16 App Router

#### 2. Create Auth Configuration
- [ ] Create `apps/web/src/lib/auth.ts` with better-auth client config
- [ ] Configure base URL for auth endpoints
- [ ] Set up cookie configuration (secure, httpOnly, sameSite)

#### 3. Create Auth API Route Handler
- [ ] Create `apps/web/src/app/api/auth/[...all]/route.ts`
- [ ] Mount better-auth request handler
- [ ] Configure Drizzle adapter pointing to `@forgestack/db`

#### 4. Create AuthProvider Context Wrapper
- [ ] Create `apps/web/src/providers/auth-provider.tsx`
- [ ] Wrap application in auth provider in root layout
- [ ] Provide session context to child components

#### 5. Create /login Page
- [ ] Create `apps/web/src/app/(auth)/login/page.tsx`
- [ ] Build login form with email/password fields
- [ ] Handle form submission with better-auth client
- [ ] Display validation errors
- [ ] Redirect to dashboard on success
- [ ] Link to signup page

#### 6. Create /signup Page
- [ ] Create `apps/web/src/app/(auth)/signup/page.tsx`
- [ ] Build signup form with email/password fields
- [ ] Handle form submission with better-auth client
- [ ] Display validation errors
- [ ] Redirect to dashboard on success
- [ ] Link to login page

#### 7. Create Auth Proxy for Protected Routes
- [ ] Create `apps/web/src/proxy.ts` (Next.js 16 renamed middleware to proxy)
- [ ] Check for valid session on protected routes
- [ ] Redirect to `/login` if not authenticated
- [ ] Allow public routes (login, signup, landing page)
- [ ] Configure route matchers for protected paths

#### 8. Add Logout Functionality
- [ ] Create logout action/button component
- [ ] Call better-auth signOut on click
- [ ] Clear local session state
- [ ] Redirect to login page

#### 9. Create useAuth Hook
- [ ] Create `apps/web/src/hooks/use-auth.ts`
- [ ] Expose current user, session, and loading state
- [ ] Expose login, signup, logout methods
- [ ] Handle auth state changes

### Backend Tasks

#### 1. Install Auth Dependencies
- [ ] Add `better-auth` to `apps/api` (for session verification)
- [ ] Or add JWT verification library if using JWT-based approach

#### 2. Create Auth Verification Service
- [ ] Create `apps/api/src/auth/auth.service.ts`
- [ ] Implement session verification method
- [ ] Query better-auth sessions table or verify JWT
- [ ] Return user ID from valid session

#### 3. Update TenantContextGuard
- [ ] Remove placeholder X-User-Id header extraction
- [ ] Extract session token from cookie or Authorization header
- [ ] Call auth service to verify session
- [ ] Extract userId from verified session
- [ ] Keep existing org membership lookup logic
- [ ] Return 401 for invalid/expired sessions

#### 4. Create Auth Module
- [ ] Create `apps/api/src/auth/auth.module.ts`
- [ ] Create `apps/api/src/auth/auth.controller.ts`
- [ ] Implement `GET /api/v1/auth/me` endpoint
- [ ] Mark auth endpoints as public where appropriate

#### 5. Handle Auth Errors
- [ ] Return 401 Unauthorized for missing session
- [ ] Return 401 Unauthorized for invalid/expired session
- [ ] Include helpful error messages
- [ ] Log auth failures for monitoring

### Shared/Infrastructure Tasks

#### 1. Update Environment Variables
- [ ] Add `BETTER_AUTH_SECRET` to `.env.example`
- [ ] Add `BETTER_AUTH_URL` (base URL for auth)
- [ ] Add `NEXTAUTH_URL` if required by better-auth
- [ ] Document required auth environment variables

#### 2. Database Schema Updates
- [ ] Create migration for better-auth tables (sessions, accounts, etc.)
- [ ] Extend `users` table with `password_hash` if needed
- [ ] Or create separate better-auth users table linked by email
- [ ] Run migration in development environment

#### 3. Configure CORS for Credentials
- [ ] Update NestJS CORS config to allow credentials
- [ ] Set `credentials: true` in CORS options
- [ ] Ensure `Access-Control-Allow-Credentials` header is sent
- [ ] Verify cookie transmission works cross-origin (if needed)

#### 4. Test End-to-End Auth Flow
- [ ] Test signup creates user in database
- [ ] Test login creates session
- [ ] Test protected API routes with session cookie
- [ ] Test logout clears session
- [ ] Test session expiration behavior

---

## Test Plan

### Frontend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Signup form renders correctly | All fields and submit button visible |
| Signup form validates empty email | Shows email required error |
| Signup form validates invalid email format | Shows invalid email error |
| Signup form validates empty password | Shows password required error |
| Signup form validates short password | Shows password length error |
| Login form renders correctly | All fields and submit button visible |
| Login form validates empty fields | Shows required field errors |
| useAuth hook returns null when not authenticated | `user` is null, `isAuthenticated` is false |
| useAuth hook returns user when authenticated | `user` object present, `isAuthenticated` is true |
| Logout clears session state | `user` becomes null after logout |

### Frontend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Signup with valid credentials | User created, redirected to dashboard |
| Signup with existing email | Shows "email already exists" error |
| Login with valid credentials | Session created, redirected to dashboard |
| Login with invalid credentials | Shows "invalid credentials" error |
| Access protected route without auth | Redirected to /login |
| Access protected route with valid session | Page renders normally |
| Logout from authenticated state | Session cleared, redirected to /login |

### Backend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| AuthService.verifySession with valid token | Returns user ID |
| AuthService.verifySession with invalid token | Throws UnauthorizedException |
| AuthService.verifySession with expired token | Throws UnauthorizedException |
| TenantContextGuard with valid session cookie | Allows request, extracts userId |
| TenantContextGuard without session | Returns 401 Unauthorized |
| TenantContextGuard with invalid session | Returns 401 Unauthorized |
| GET /auth/me with valid session | Returns current user info |
| GET /auth/me without session | Returns 401 Unauthorized |

### Backend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Protected endpoint with valid session + valid org | Returns 200, context attached |
| Protected endpoint with valid session + invalid org | Returns 403 Forbidden |
| Protected endpoint without session | Returns 401 Unauthorized |
| /auth/me returns user matching session | User data matches authenticated user |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Complete signup flow | Navigate to /signup → Fill form → Submit | User created, redirected to dashboard |
| Complete login flow | Navigate to /login → Fill form → Submit | Session created, dashboard accessible |
| Protected route redirect | Navigate to /dashboard without auth | Redirected to /login |
| Full auth lifecycle | Signup → Logout → Login → Access protected route → Logout | All transitions work correctly |
| Session persistence | Login → Close browser → Reopen | Session still valid (if not expired) |

---

## Implementation Notes

### Frontend Project Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── ...protected routes...
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts
│   └── layout.tsx
├── components/
│   └── auth/
│       ├── login-form.tsx
│       ├── signup-form.tsx
│       └── logout-button.tsx
├── hooks/
│   └── use-auth.ts
├── lib/
│   └── auth.ts           # better-auth client config
├── providers/
│   └── auth-provider.tsx
└── middleware.ts
```

### Backend Project Structure

```
apps/api/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
│       └── user-response.dto.ts
├── core/
│   └── guards/
│       └── tenant-context.guard.ts  # Updated for session verification
└── ...
```

### better-auth Client Configuration

```typescript
// apps/web/src/lib/auth.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### better-auth Server Configuration

```typescript
// apps/web/src/lib/auth-server.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@forgestack/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### Updated TenantContextGuard Pattern

```typescript
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Extract and verify session
    const sessionToken = this.extractSessionToken(request);
    if (!sessionToken) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.authService.verifySession(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const userId = session.userId;

    // Rest of guard logic (org verification) remains the same...
  }

  private extractSessionToken(request: any): string | undefined {
    // Check cookie first (better-auth default)
    const cookieToken = request.cookies?.['better-auth.session_token'];
    if (cookieToken) return cookieToken;

    // Fallback to Authorization header
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }
}
```

### Environment Variables

```env
# Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Existing vars
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgestack_dev
CORS_ORIGIN=http://localhost:3000
```

---

## Security Considerations

1. **Password hashing** – better-auth uses bcrypt/argon2 by default; never store plaintext passwords
2. **Session tokens** – Stored in HTTP-only, Secure cookies; not accessible via JavaScript
3. **CSRF protection** – better-auth includes CSRF protection for mutations
4. **Session expiration** – Sessions expire after configured duration; implement refresh logic
5. **Rate limiting** – Consider rate limiting auth endpoints (future enhancement)
6. **Secure cookies** – Use `Secure` flag in production (HTTPS only)
7. **SameSite cookies** – Use `Lax` or `Strict` to prevent CSRF
8. **Input validation** – Validate email format and password strength on frontend and backend

---

## Dependencies

- **better-auth** – Core authentication library
- **@forgestack/db** – Database layer with Drizzle ORM
- **Priority #4** (NestJS API Skeleton) must be complete
- **React Hook Form** or similar for form handling (optional)
- **Zod** for schema validation (optional, better-auth may include)

---

## Future Enhancements (Out of Scope for v1)

- OAuth providers (Google, GitHub)
- Magic link / passwordless login
- Two-factor authentication (2FA)
- Password reset flow
- Email verification
- Account linking
- Session management UI (view/revoke sessions)
- Remember me functionality

---

*End of spec*
