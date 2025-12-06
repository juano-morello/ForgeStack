# ADR-002: Authentication with better-auth

## Status
Accepted

## Context

ForgeStack requires a robust authentication system that supports:
1. Email/password authentication
2. Session management with secure cookies
3. Email verification
4. Password reset functionality
5. Multi-tenant organization context
6. Integration with Next.js 16 and NestJS
7. Type-safe API
8. Extensibility for future auth methods (OAuth, SSO)

We needed to choose an authentication solution that balances security, developer experience, and flexibility.

## Decision

We chose **[better-auth](https://better-auth.com)** as our authentication library.

### Implementation Details

**Session Management:**
- HTTP-only cookies for session tokens
- Secure, SameSite=Lax cookies
- Automatic session refresh
- Server-side session validation

**Frontend Integration (Next.js):**
```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Usage in components
const { data: session } = useSession();
```

**Backend Integration (NestJS):**
```typescript
// apps/api/src/auth/auth.service.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

**Database Schema:**
- `users` table with email, password hash, verification status
- `sessions` table for active sessions
- `verification_tokens` for email verification
- Managed by better-auth migrations

## Consequences

### Positive

1. **Type Safety**: Full TypeScript support with inferred types
   - Session types are automatically inferred
   - API methods are fully typed
   - Reduces runtime errors

2. **Developer Experience**: Simple, intuitive API
   - Easy to set up and configure
   - Minimal boilerplate
   - Clear documentation

3. **Security**: Built-in security best practices
   - Secure password hashing (bcrypt)
   - HTTP-only cookies prevent XSS
   - CSRF protection
   - Rate limiting on auth endpoints

4. **Flexibility**: Extensible architecture
   - Plugin system for additional auth methods
   - Custom session data
   - Hooks for custom logic

5. **Framework Agnostic**: Works with any framework
   - Next.js integration via React hooks
   - NestJS integration via middleware
   - Can be used with other frameworks

6. **Session Management**: Robust session handling
   - Automatic session refresh
   - Configurable session duration
   - Server-side session validation
   - Session revocation

7. **Multi-Tenancy Support**: Easy to extend with org context
   - Session can store current organization
   - Guards can validate org membership
   - Seamless integration with RLS

### Negative

1. **Newer Library**: Less mature than alternatives
   - Smaller community
   - Fewer third-party integrations
   - Potential for breaking changes

2. **Limited OAuth Support**: OAuth providers require plugins
   - Not as comprehensive as NextAuth
   - May need custom implementation for some providers

3. **Documentation**: Still evolving
   - Some edge cases not well documented
   - Fewer examples and tutorials

4. **Migration Path**: Harder to migrate from other auth solutions
   - Different session format
   - Different database schema
   - Requires custom migration scripts

## Alternatives Considered

### 1. NextAuth.js (Auth.js)

**Pros:**
- Mature, widely adopted
- Extensive OAuth provider support
- Large community
- Well documented

**Cons:**
- Primarily designed for Next.js (harder to use with NestJS)
- Less type-safe
- More complex configuration
- Session format not ideal for multi-tenant apps
- Adapter pattern can be limiting

**Rejected because:** While mature, NextAuth is too Next.js-specific and doesn't integrate as cleanly with our NestJS backend. The session model doesn't align well with our multi-tenant architecture.

### 2. Clerk

**Pros:**
- Fully managed solution
- Beautiful UI components
- Excellent developer experience
- Built-in user management dashboard
- Multi-tenancy support

**Cons:**
- **Vendor lock-in**: Tied to Clerk's service
- **Cost**: Expensive at scale ($25/month + per-user fees)
- **Data ownership**: User data stored on Clerk's servers
- **Customization limits**: Less control over auth flow
- **Privacy concerns**: Third-party service

**Rejected because:** As a template/starter kit, we want to avoid vendor lock-in and give users full control over their authentication system. The cost at scale is also prohibitive for many use cases.

### 3. Passport.js

**Pros:**
- Very mature
- Extensive strategy ecosystem
- Framework agnostic
- Widely used in NestJS

**Cons:**
- Low-level, requires more boilerplate
- No built-in session management
- Callback-based API (not modern)
- No TypeScript-first design
- Manual integration with frontend

**Rejected because:** Too low-level and requires significant boilerplate. The callback-based API feels dated compared to modern alternatives.

### 4. Supabase Auth

**Pros:**
- Integrated with Supabase ecosystem
- Good developer experience
- Built-in RLS integration
- Email templates

**Cons:**
- **Vendor lock-in**: Requires Supabase
- **Limited flexibility**: Opinionated architecture
- **Database coupling**: Tied to Supabase PostgreSQL
- **Cost**: Supabase pricing at scale

**Rejected because:** Requires using Supabase as the database provider, which limits flexibility. We want users to be able to use any PostgreSQL provider.

### 5. Custom JWT Implementation

**Pros:**
- Full control
- No dependencies
- Lightweight

**Cons:**
- **Security risks**: Easy to implement incorrectly
- **Maintenance burden**: Need to handle all edge cases
- **Time investment**: Significant development time
- **Token management**: Complex refresh token logic
- **No email verification**: Need to build from scratch

**Rejected because:** Authentication is too critical to build from scratch. The security risks and maintenance burden outweigh the benefits of full control.

## Implementation Notes

### Setting Up better-auth

1. **Install dependencies:**
   ```bash
   pnpm add better-auth
   pnpm add -D @better-auth/cli
   ```

2. **Configure environment variables:**
   ```bash
   BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Initialize auth instance:**
   ```typescript
   // apps/api/src/auth/auth.ts
   export const auth = betterAuth({
     database: drizzleAdapter(db),
     emailAndPassword: { enabled: true },
     session: {
       expiresIn: 60 * 60 * 24 * 7, // 7 days
       updateAge: 60 * 60 * 24, // 1 day
     },
   });
   ```

4. **Add auth routes:**
   ```typescript
   // apps/api/src/auth/auth.controller.ts
   @All('*')
   async handleAuth(@Req() req: Request, @Res() res: Response) {
     return auth.handler(req, res);
   }
   ```

5. **Frontend integration:**
   ```typescript
   // apps/web/src/lib/auth-client.ts
   export const authClient = createAuthClient({
     baseURL: process.env.NEXT_PUBLIC_APP_URL,
   });
   ```

### Adding OAuth Providers (Future)

```typescript
export const auth = betterAuth({
  // ...
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});
```

## References

- [better-auth Documentation](https://better-auth.com)
- [better-auth GitHub](https://github.com/better-auth/better-auth)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

