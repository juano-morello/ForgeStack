# NestJS API Skeleton

**Epic:** API  
**Priority:** #4  
**Depends on:** Priority #3 (RLS policies + withTenantContext())  
**Status:** Draft

---

## Overview

This specification defines the setup of the **NestJS API skeleton** in `/apps/api` for ForgeStack. The API serves as the backend layer that authenticates requests, resolves tenant context, and enforces Row-Level Security through the `@forgestack/db` package.

### Key Components

1. **NestJS 10+** with modular architecture
2. **TenantContextGuard** – Extracts user ID from auth, org ID from headers, looks up role, and wraps all requests with `withTenantContext()`
3. **Health check endpoint** at `GET /health`
4. **Base module structure** for future feature modules
5. **Integration with `@forgestack/db`** for database access with RLS enforcement

### Request Flow

```
1. Request arrives with:
   - JWT/session token (Authorization header or cookie)
   - X-Org-Id header (active organization)

2. TenantContextGuard:
   - Validates auth token → extracts userId
   - Reads X-Org-Id header → extracts orgId
   - Queries organization_members → gets role
   - Attaches TenantContext to request

3. Controller/Service:
   - Uses withTenantContext() for all DB operations
   - RLS policies enforce row-level access
```

### Key Principles

- **Guards before controllers** – Context is resolved before route handlers execute
- **Thin controllers** – Controllers only handle HTTP concerns; logic lives in services
- **All org-scoped queries use `withTenantContext()`** – Direct queries without context are blocked
- **Fail-closed** – Missing auth or org header returns 401/403

---

## Acceptance Criteria

### NestJS Application
- [ ] NestJS application bootstrapped in `/apps/api`
- [ ] Uses `@nestjs/platform-express` (Express adapter)
- [ ] Entry point at `src/main.ts`
- [ ] Application listens on port from `PORT` env var (default: 4000)

### Module Structure
- [ ] `AppModule` as root module importing all feature modules
- [ ] `HealthModule` with health check endpoint
- [ ] `CoreModule` with guards, interceptors, and shared providers
- [ ] Clear separation ready for future feature modules (e.g., ProjectsModule)

### TenantContextGuard
- [ ] Global guard applied to all routes (except health check)
- [ ] Extracts user ID from auth token (placeholder for better-auth integration)
- [ ] Extracts org ID from `X-Org-Id` header
- [ ] Queries `organization_members` table to verify membership and get role
- [ ] Returns 401 Unauthorized if auth token is missing/invalid
- [ ] Returns 403 Forbidden if X-Org-Id is missing
- [ ] Returns 403 Forbidden if user is not a member of the organization
- [ ] Attaches `TenantContext` (`{ orgId, userId, role }`) to request object

### Health Check
- [ ] `GET /health` endpoint returns 200 OK
- [ ] Health check bypasses TenantContextGuard (public route)
- [ ] Returns JSON: `{ "status": "ok", "timestamp": "<ISO timestamp>" }`

### Environment Configuration
- [ ] Uses `@nestjs/config` for environment management
- [ ] Environment variables validated on startup using `class-validator`
- [ ] Required env vars: `DATABASE_URL`, `PORT`
- [ ] Optional env vars: `NODE_ENV`, `CORS_ORIGIN`
- [ ] `.env.example` updated with API-specific variables

### Error Handling
- [ ] Global exception filter for consistent error responses
- [ ] Standard error format: `{ "statusCode": number, "message": string, "error": string }`
- [ ] Validation errors return 400 with detailed field errors
- [ ] Internal errors return 500 without leaking stack traces in production

### Request Validation
- [ ] Global `ValidationPipe` with `class-validator` and `class-transformer`
- [ ] DTOs use decorators for validation (`@IsString`, `@IsUUID`, etc.)
- [ ] Whitelist enabled to strip unknown properties
- [ ] Transform enabled to auto-convert types

### API Versioning
- [ ] Global prefix: `/api/v1`
- [ ] Health check accessible at `/api/v1/health`

### CORS Configuration
- [ ] CORS enabled for web app origin
- [ ] Configurable via `CORS_ORIGIN` env var
- [ ] Credentials allowed for cookie-based auth

### Logging
- [ ] Request logging middleware
- [ ] Logs: method, path, status code, response time
- [ ] Uses NestJS built-in logger or Pino for structured logging

---

## Tasks & Subtasks

### 1. Install NestJS Dependencies
- [ ] Add `@nestjs/core`, `@nestjs/common`, `@nestjs/config`
- [ ] Add `@nestjs/platform-express`, `express`
- [ ] Add `class-validator`, `class-transformer`
- [ ] Add `reflect-metadata`, `rxjs`
- [ ] Add dev dependencies: `@nestjs/cli`, `@nestjs/testing`
- [ ] Add `@forgestack/db` as workspace dependency

### 2. Create NestJS Application Structure
- [ ] Create `src/main.ts` with bootstrap function
- [ ] Create `src/app.module.ts` as root module
- [ ] Create `nest-cli.json` for NestJS CLI configuration
- [ ] Update `package.json` with build/dev/start scripts
- [ ] Configure `tsconfig.json` extending base config

### 3. Configure Environment Variables
- [ ] Create `src/config/configuration.ts` for config factory
- [ ] Create `src/config/env.validation.ts` with validation schema
- [ ] Import `ConfigModule.forRoot()` in AppModule
- [ ] Add API env vars to root `.env.example`

### 4. Create TenantContextGuard
- [ ] Create `src/core/guards/tenant-context.guard.ts`
- [ ] Create `src/core/decorators/public.decorator.ts` for public routes
- [ ] Create `src/core/decorators/tenant-context.decorator.ts` to access context
- [ ] Implement auth token extraction (placeholder for better-auth)
- [ ] Implement X-Org-Id header extraction
- [ ] Implement organization membership lookup using `@forgestack/db`
- [ ] Register as global guard in AppModule

### 5. Create HealthModule
- [ ] Create `src/health/health.module.ts`
- [ ] Create `src/health/health.controller.ts`
- [ ] Mark health endpoint as public (bypasses guard)
- [ ] Return status with timestamp

### 6. Set Up Global Pipes, Filters, Interceptors
- [ ] Create `src/core/filters/http-exception.filter.ts`
- [ ] Create `src/core/interceptors/logging.interceptor.ts`
- [ ] Configure global `ValidationPipe` in `main.ts`
- [ ] Register global exception filter
- [ ] Register global logging interceptor

### 7. Configure CORS and API Prefix
- [ ] Configure global prefix `/api/v1` in `main.ts`
- [ ] Enable CORS with configurable origin
- [ ] Allow credentials for cookie-based auth
- [ ] Configure allowed methods and headers

### 8. Add Request Logging Middleware
- [ ] Create `src/core/middleware/logger.middleware.ts`
- [ ] Log request method, path, status, and duration
- [ ] Apply middleware globally in AppModule

---

## Test Plan

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `TenantContextGuard` with valid token and header | Allows request, attaches context |
| `TenantContextGuard` without auth token | Returns 401 Unauthorized |
| `TenantContextGuard` without X-Org-Id header | Returns 403 Forbidden |
| `TenantContextGuard` with invalid org membership | Returns 403 Forbidden |
| `@Public()` decorated route | Bypasses guard |
| `ValidationPipe` with invalid DTO | Returns 400 with validation errors |
| `HttpExceptionFilter` formats errors | Returns consistent error format |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /api/v1/health` | Returns 200 with `{ status: "ok" }` |
| Request with valid auth + valid org | Returns 200, context available |
| Request with valid auth + wrong org | Returns 403 Forbidden |
| Request without `X-Org-Id` header | Returns 403 Forbidden |
| Request without auth token | Returns 401 Unauthorized |
| CORS preflight from allowed origin | Returns 200 with CORS headers |
| CORS preflight from blocked origin | Returns 403 or no CORS headers |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Health check | `curl /api/v1/health` | 200 OK |
| Authenticated request | Send valid token + X-Org-Id | 200 OK |
| Missing auth | Omit Authorization header | 401 |
| Missing org | Omit X-Org-Id header | 403 |
| Non-member org | Send org ID user doesn't belong to | 403 |

---

## Implementation Notes

### Project Structure

```
apps/api/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── config/
│   │   ├── configuration.ts       # Config factory
│   │   └── env.validation.ts      # Env validation
│   ├── core/
│   │   ├── core.module.ts         # Core providers
│   │   ├── guards/
│   │   │   └── tenant-context.guard.ts
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   └── tenant-context.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── middleware/
│   │       └── logger.middleware.ts
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### TenantContextGuard Implementation Pattern

```typescript
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('DB') private db: typeof import('@forgestack/db'),
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Extract user ID from auth (placeholder for better-auth)
    const userId = this.extractUserId(request);
    if (!userId) throw new UnauthorizedException('Authentication required');

    // Extract org ID from header
    const orgId = request.headers['x-org-id'];
    if (!orgId) throw new ForbiddenException('X-Org-Id header required');

    // Lookup membership and role
    const membership = await this.lookupMembership(userId, orgId);
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    // Attach context to request
    request.tenantContext = {
      orgId,
      userId,
      role: membership.role,
    };

    return true;
  }
}
```

### Using TenantContext in Services

```typescript
@Injectable()
export class ProjectsService {
  constructor(@Inject('DB') private db: typeof import('@forgestack/db')) {}

  async findAll(ctx: TenantContext) {
    return this.db.withTenantContext(ctx, async (tx) => {
      return tx.select().from(projects);
    });
  }
}
```

### Environment Variables

```env
# API Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (shared with other apps)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgestack_dev
```

---

## Dependencies

- **NestJS 10+** – Backend framework
- **@nestjs/config** – Environment configuration
- **class-validator** – DTO validation
- **@forgestack/db** – Database layer with RLS
- **Priority #3** (RLS policies + withTenantContext()) must be complete

---

## Security Considerations

1. **Never trust client-provided org ID** – Always verify membership before setting context
2. **Guard runs before all routes** – Except explicitly public routes
3. **Use withTenantContext() for all queries** – Never bypass RLS from API routes
4. **Validate environment on startup** – Fail fast if required vars missing
5. **Don't leak stack traces** – Exception filter sanitizes errors in production
6. **Rate limiting** – Consider adding rate limiting (future enhancement)

---

## Future Enhancements (Out of Scope)

- OpenAPI/Swagger documentation (`@nestjs/swagger`)
- Rate limiting (`@nestjs/throttler`)
- Caching layer
- WebSocket support
- GraphQL alternative

---

*End of spec*

