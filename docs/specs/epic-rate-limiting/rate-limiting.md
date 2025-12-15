# Rate Limiting

**Epic:** Rate Limiting
**Priority:** TBD
**Depends on:** NestJS API Skeleton, Organization Management, API Keys, Stripe Billing (for plan-based limits)
**Status:** Draft

---

## 1. Context

### Why Rate Limiting Is Needed

Rate limiting protects the ForgeStack API from abuse and ensures fair usage across all users by:

- **Abuse Prevention** – Blocking malicious actors from overwhelming the system
- **Fair Usage** – Ensuring no single user monopolizes shared resources
- **Resource Protection** – Preventing accidental overload from buggy client code
- **DDoS Mitigation** – First line of defense against denial-of-service attacks

### Business Value

- **API Reliability** – Consistent performance for all customers
- **Cost Control** – Prevent runaway usage that increases infrastructure costs
- **SLA Compliance** – Maintain response times promised to customers
- **Plan Differentiation** – Higher tiers get higher limits, driving upgrades

### Technical Approach

The rate limiting system uses a **Redis-backed token bucket algorithm** (via `rate-limiter-flexible`) with sliding window support:

- **Token Bucket** – Smooth rate limiting that allows short bursts while enforcing average limits
- **Sliding Window** – More accurate than fixed windows, prevents request clustering at window boundaries
- **Redis Backend** – Distributed rate limiting that works across all API instances
- **Hierarchical Limits** – Per-minute, per-hour, and per-day limits with different granularities

---

## 2. User Stories

### US-1: View Rate Limit Status
**As an** API consumer,
**I want to** see my rate limit status via response headers,
**So that** I can monitor usage and avoid hitting limits.

### US-2: Plan-Based Rate Limits
**As an** organization owner,
**I want to** have rate limits based on my subscription plan,
**So that** I get the capacity I'm paying for.

### US-3: Protect Against Abuse
**As the** system,
**I want to** enforce rate limits on all API requests,
**So that** the API remains stable and available for all users.

### US-4: View Rate Limit Metrics
**As an** admin,
**I want to** view rate limit metrics and violations,
**So that** I can identify abusive patterns and tune limits.

### US-5: Clear Rate Limit Errors
**As an** API consumer,
**I want to** receive clear error messages when rate limited,
**So that** I know how long to wait before retrying.

---

## 3. Acceptance Criteria

### US-1: View Rate Limit Status
- [ ] **AC-1.1:** Every API response includes `X-RateLimit-Limit` header
- [ ] **AC-1.2:** Every API response includes `X-RateLimit-Remaining` header
- [ ] **AC-1.3:** Every API response includes `X-RateLimit-Reset` header (Unix timestamp)
- [ ] **AC-1.4:** Rate limited responses (429) include `Retry-After` header in seconds

### US-2: Plan-Based Rate Limits
- [ ] **AC-2.1:** Free plan organizations get 100 requests/minute
- [ ] **AC-2.2:** Starter plan organizations get 500 requests/minute
- [ ] **AC-2.3:** Pro plan organizations get 2,000 requests/minute
- [ ] **AC-2.4:** Enterprise plan organizations get 10,000 requests/minute
- [ ] **AC-2.5:** Limits are applied per organization, not per user/API key
- [ ] **AC-2.6:** Plan changes take effect within 60 seconds

### US-3: Protect Against Abuse
- [ ] **AC-3.1:** Authenticated requests are rate limited by organization ID
- [ ] **AC-3.2:** Unauthenticated requests are rate limited by IP address
- [ ] **AC-3.3:** Auth endpoints have stricter IP-based limits (brute force protection)
- [ ] **AC-3.4:** Rate limiting works correctly across multiple API instances
- [ ] **AC-3.5:** Rate limit check adds less than 5ms latency

### US-4: View Rate Limit Metrics
- [ ] **AC-4.1:** Rate limit violations are logged with org/IP identification
- [ ] **AC-4.2:** Metrics available for total requests per org/time window (future)
- [ ] **AC-4.3:** Alert triggers when org approaches 80% of limit (future)

### US-5: Clear Rate Limit Errors
- [ ] **AC-5.1:** 429 response includes human-readable error message
- [ ] **AC-5.2:** Response includes `retryAfter` field in JSON body
- [ ] **AC-5.3:** Error message indicates which limit was exceeded (minute/hour/day)

---

## 4. Rate Limit Tiers (by Plan)

### 4.1 Free Plan
| Window | Limit |
|--------|-------|
| Per Minute | 100 requests |
| Per Hour | 1,000 requests |
| Per Day | 10,000 requests |

### 4.2 Starter Plan
| Window | Limit |
|--------|-------|
| Per Minute | 500 requests |
| Per Hour | 10,000 requests |
| Per Day | 100,000 requests |

### 4.3 Pro Plan
| Window | Limit |
|--------|-------|
| Per Minute | 2,000 requests |
| Per Hour | 50,000 requests |
| Per Day | 500,000 requests |

### 4.4 Enterprise Plan
| Window | Limit |
|--------|-------|
| Per Minute | 10,000 requests |
| Per Hour | Unlimited (soft limit with alerts) |
| Per Day | Unlimited (soft limit with alerts) |
| Note | Custom limits available on request |

### 4.5 Unauthenticated/IP-Based Limits
| Endpoint Type | Limit |
|---------------|-------|
| Public endpoints | 60 requests/minute per IP |
| Auth endpoints | 20 requests/minute per IP |
| Webhook receivers | Exempt or higher limits |

---

## 5. Rate Limit Keys

Different rate limit keys are used for different scenarios:

| Key Pattern | Description | Usage |
|-------------|-------------|-------|
| `rl:org:{orgId}:min` | Per-org per-minute limit | Authenticated requests |
| `rl:org:{orgId}:hour` | Per-org per-hour limit | Authenticated requests |
| `rl:org:{orgId}:day` | Per-org per-day limit | Authenticated requests |
| `rl:ip:{ip}:min` | Per-IP per-minute limit | Unauthenticated requests |
| `rl:auth:{ip}:min` | Auth endpoint per-IP limit | Login, signup, password reset |
| `rl:key:{keyId}:min` | Per-API-key limit (optional) | Subset of org limit |

### Key Generation Logic

```typescript
function getRateLimitKey(req: Request, context: TenantContext): string {
  // Authenticated request - use org ID
  if (context?.orgId) {
    return `rl:org:${context.orgId}`;
  }

  // API key request - use org from key
  if (req.apiKey?.orgId) {
    return `rl:org:${req.apiKey.orgId}`;
  }

  // Unauthenticated - use IP
  const ip = req.ip || req.headers['x-forwarded-for'];
  return `rl:ip:${ip}`;
}
```

---

## 6. Response Headers

Standard rate limit headers are included in every API response:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in window | `100` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `75` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1701388800` |
| `Retry-After` | Seconds to wait (only on 429 responses) | `45` |

### Header Generation Example

```typescript
function setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
  res.setHeader('X-RateLimit-Limit', info.limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, info.remaining));
  res.setHeader('X-RateLimit-Reset', info.resetTime);

  if (info.remaining <= 0) {
    res.setHeader('Retry-After', info.retryAfter);
  }
}
```

---

## 7. Algorithm

### 7.1 Token Bucket with Sliding Window

The rate limiter uses the `rate-limiter-flexible` library with Redis for distributed rate limiting.

**Token Bucket Benefits:**
- Allows short bursts while maintaining average limits
- Smoother than fixed window (no thundering herd at window boundaries)
- Efficient Redis operations (atomic increment + expire)

**Implementation:**

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiterMinute = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl:min',
  points: 100,        // Number of requests
  duration: 60,       // Per 60 seconds
  blockDuration: 0,   // Don't block, just reject
});

async function checkRateLimit(key: string, points: number = 1): Promise<RateLimitResult> {
  try {
    const result = await rateLimiterMinute.consume(key, points);
    return {
      allowed: true,
      limit: rateLimiterMinute.points,
      remaining: result.remainingPoints,
      resetTime: Math.floor(Date.now() / 1000) + Math.ceil(result.msBeforeNext / 1000),
    };
  } catch (rejRes) {
    return {
      allowed: false,
      limit: rateLimiterMinute.points,
      remaining: 0,
      resetTime: Math.floor(Date.now() / 1000) + Math.ceil(rejRes.msBeforeNext / 1000),
      retryAfter: Math.ceil(rejRes.msBeforeNext / 1000),
    };
  }
}
```

### 7.2 Multiple Window Enforcement

Rate limits are checked across multiple windows (minute, hour, day). A request is rejected if ANY window limit is exceeded:

```typescript
async function checkAllLimits(key: string, limits: PlanLimits): Promise<RateLimitResult> {
  // Check minute limit (most likely to trigger first)
  const minuteResult = await rateLimiterMinute.get(key);
  if (minuteResult && minuteResult.consumedPoints >= limits.minute) {
    return { allowed: false, window: 'minute', ...minuteResult };
  }

  // Check hour limit
  const hourResult = await rateLimiterHour.get(key);
  if (hourResult && hourResult.consumedPoints >= limits.hour) {
    return { allowed: false, window: 'hour', ...hourResult };
  }

  // Check day limit
  const dayResult = await rateLimiterDay.get(key);
  if (dayResult && dayResult.consumedPoints >= limits.day) {
    return { allowed: false, window: 'day', ...dayResult };
  }

  // All checks passed - consume from all windows
  await Promise.all([
    rateLimiterMinute.consume(key),
    rateLimiterHour.consume(key),
    rateLimiterDay.consume(key),
  ]);

  return { allowed: true, ...minuteResult };
}
```

---

## 8. Implementation Approach

### 8.1 NestJS Guard

The `RateLimitGuard` is a NestJS guard that enforces rate limits on all protected endpoints.

```typescript
// apps/api/src/rate-limiting/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from '../rate-limit.service';
import { TooManyRequestsException } from '../exceptions/too-many-requests.exception';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check for rate limit skip decorator
    const skipRateLimit = this.reflector.get<boolean>('skipRateLimit', context.getHandler());
    if (skipRateLimit) {
      return true;
    }

    // Get rate limit key (org, API key, or IP)
    const key = this.rateLimitService.getKey(request);

    // Get plan-based limits
    const limits = await this.rateLimitService.getLimits(request);

    // Check rate limit
    const result = await this.rateLimitService.check(key, limits);

    // Set response headers
    this.rateLimitService.setHeaders(response, result);

    if (!result.allowed) {
      throw new TooManyRequestsException(result);
    }

    return true;
  }
}
```

### 8.2 @RateLimit() Decorator

Custom decorator for per-endpoint rate limit overrides:

```typescript
// apps/api/src/rate-limiting/decorators/rate-limit.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  points?: number;      // Requests allowed
  duration?: number;    // Window in seconds
  keyPrefix?: string;   // Custom key prefix
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata('rateLimit', options);

export const SkipRateLimit = () => SetMetadata('skipRateLimit', true);
```

### 8.3 Usage Examples

```typescript
@Controller('projects')
export class ProjectsController {
  // Uses default plan-based limits
  @Get()
  findAll() { }

  // Custom endpoint-specific limit (100 per minute regardless of plan)
  @Post('bulk-import')
  @RateLimit({ points: 10, duration: 60 })
  bulkImport(@Body() dto: BulkImportDto) { }

  // Skip rate limiting (e.g., health check)
  @Get('health')
  @SkipRateLimit()
  health() { }
}
```

---

## 9. Endpoint Categories

Different endpoint types have different rate limiting behavior:

### 9.1 Standard API Endpoints
- Use organization-based limits
- Limits based on subscription plan
- Headers included in all responses

### 9.2 Authentication Endpoints
- Use IP-based limits (prevents brute force)
- Stricter limits: 20 requests/minute per IP
- Endpoints: `/auth/login`, `/auth/signup`, `/auth/forgot-password`

### 9.3 Public Endpoints
- Use IP-based limits
- Default: 60 requests/minute per IP
- Endpoints: Health check, public docs, etc.

### 9.4 Webhook Receivers
- Higher limits or exempt
- Special key pattern if needed
- Important: Don't rate limit incoming webhooks from trusted sources (e.g., Stripe)

### 9.5 Admin Endpoints
- Standard org-based limits
- Consider higher limits for admin operations

---

## 10. Error Response

### 10.1 HTTP 429 Response Format

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. You have made too many requests in the current minute window.",
  "retryAfter": 45,
  "limit": {
    "window": "minute",
    "max": 100,
    "remaining": 0,
    "resetAt": "2024-12-01T10:30:00Z"
  }
}
```

### 10.2 Exception Class

```typescript
// apps/api/src/rate-limiting/exceptions/too-many-requests.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(result: RateLimitResult) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        limit: {
          window: result.window,
          max: result.limit,
          remaining: result.remaining,
          resetAt: new Date(result.resetTime * 1000).toISOString(),
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
```

---

## 11. Configuration

### 11.1 TypeScript Configuration Interface

```typescript
// apps/api/src/rate-limiting/rate-limit.config.ts
export interface RateLimitConfig {
  enabled: boolean;
  defaultLimits: {
    free: { minute: number; hour: number; day: number };
    starter: { minute: number; hour: number; day: number };
    pro: { minute: number; hour: number; day: number };
    enterprise: { minute: number; hour: number | null; day: number | null };
  };
  ipLimits: {
    default: { minute: number };
    auth: { minute: number };
  };
  redis: {
    url: string;
    keyPrefix: string;
  };
  failOpen: boolean; // Allow requests if Redis is down
}

export const defaultRateLimitConfig: RateLimitConfig = {
  enabled: true,
  defaultLimits: {
    free: { minute: 100, hour: 1000, day: 10000 },
    starter: { minute: 500, hour: 10000, day: 100000 },
    pro: { minute: 2000, hour: 50000, day: 500000 },
    enterprise: { minute: 10000, hour: null, day: null },
  },
  ipLimits: {
    default: { minute: 60 },
    auth: { minute: 20 },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'rl:',
  },
  failOpen: true,
};
```

### 11.2 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_ENABLED` | Enable/disable rate limiting | `true` |
| `RATE_LIMIT_FAIL_OPEN` | Allow requests if Redis is unavailable (development) | `true` |
| `RATE_LIMIT_FAIL_OPEN_PRODUCTION` | Allow requests if Redis is unavailable in production | `false` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

```bash
# .env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_FAIL_OPEN=true
RATE_LIMIT_FAIL_OPEN_PRODUCTION=false  # Defaults to fail-closed in production for security
REDIS_URL=redis://localhost:6379
```

> **Note:** In production (`NODE_ENV=production`), the rate limiter defaults to **fail-closed** behavior for security. This means if Redis is unavailable, requests will be rejected. Set `RATE_LIMIT_FAIL_OPEN_PRODUCTION=true` to override this (not recommended).



---

## 12. Tasks

### 12.1 Backend Tasks (apps/api)

#### 12.1.1 Create Rate Limiting Module
- [ ] Create `apps/api/src/rate-limiting/rate-limiting.module.ts`
- [ ] Import Redis module and configuration
- [ ] Register RateLimitService, guards, and interceptors
- [ ] Export for use in other modules

#### 12.1.2 Implement Rate Limit Service
- [ ] Create `apps/api/src/rate-limiting/rate-limit.service.ts`
- [ ] Initialize `rate-limiter-flexible` with Redis
- [ ] Implement `getKey(request)` – extracts rate limit key
- [ ] Implement `getLimits(request)` – gets plan-based limits
- [ ] Implement `check(key, limits)` – checks against all windows
- [ ] Implement `setHeaders(response, result)` – sets rate limit headers
- [ ] Handle Redis connection failures gracefully

#### 12.1.3 Create Rate Limit Guard
- [ ] Create `apps/api/src/rate-limiting/guards/rate-limit.guard.ts`
- [ ] Implement `canActivate()` method
- [ ] Check for skip decorator
- [ ] Apply rate limit headers
- [ ] Throw `TooManyRequestsException` when exceeded

#### 12.1.4 Create Rate Limit Interceptor
- [ ] Create `apps/api/src/rate-limiting/interceptors/rate-limit-headers.interceptor.ts`
- [ ] Add rate limit headers to all responses (even when guard is not triggered)

#### 12.1.5 Create Decorators
- [ ] Create `@RateLimit()` decorator for custom limits
- [ ] Create `@SkipRateLimit()` decorator for exemptions

#### 12.1.6 Create Exception
- [ ] Create `apps/api/src/rate-limiting/exceptions/too-many-requests.exception.ts`
- [ ] Include all required fields (retryAfter, window, etc.)

#### 12.1.7 Apply Global Rate Limiting
- [ ] Register `RateLimitGuard` globally or per-module
- [ ] Configure auth endpoints with IP-based limits
- [ ] Mark webhook endpoints with `@SkipRateLimit()`

### 12.2 Configuration Tasks

#### 12.2.1 Define Plan-Based Limits
- [ ] Create `apps/api/src/rate-limiting/rate-limit.config.ts`
- [ ] Define limits for each plan tier
- [ ] Make configurable via environment variables

#### 12.2.2 Redis Configuration
- [ ] Ensure Redis connection is configured
- [ ] Add rate limit key prefix configuration
- [ ] Configure connection pooling if needed

### 12.3 Integration Tasks

#### 12.3.1 Plan Lookup Integration
- [ ] Create method to get org's current plan
- [ ] Cache plan data to avoid DB lookups per request
- [ ] Handle plan changes within configured TTL

#### 12.3.2 Monitoring Integration (Optional/Future)
- [ ] Add Prometheus metrics for rate limit hits
- [ ] Create alerts for excessive rate limiting
- [ ] Dashboard for rate limit statistics


---

## 13. Test Plan

### 13.1 Unit Tests

#### Rate Limit Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `getKey()` returns org key for authenticated request | `rl:org:{orgId}` |
| `getKey()` returns IP key for unauthenticated request | `rl:ip:{ip}` |
| `getLimits()` returns correct limits for Free plan | `{ minute: 100, hour: 1000, day: 10000 }` |
| `getLimits()` returns correct limits for Pro plan | `{ minute: 2000, hour: 50000, day: 500000 }` |
| `check()` allows request under limit | `{ allowed: true, remaining: N }` |
| `check()` rejects request over limit | `{ allowed: false, retryAfter: N }` |
| `setHeaders()` sets all rate limit headers | Headers present in response |

#### Rate Limit Guard Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Guard allows request under limit | `canActivate()` returns `true` |
| Guard throws 429 when limit exceeded | `TooManyRequestsException` thrown |
| Guard skips when `@SkipRateLimit()` present | `canActivate()` returns `true` immediately |
| Guard uses custom limits from `@RateLimit()` decorator | Custom limits applied |

#### Exception Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `TooManyRequestsException` has correct status | `429` |
| Exception includes `retryAfter` | Present and positive integer |
| Exception includes limit details | `window`, `max`, `resetAt` present |

### 13.2 Integration Tests

#### API Endpoint Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Request with valid auth includes rate limit headers | All 3 headers present |
| Rate limit exceeded returns 429 | 429 status with proper body |
| Different orgs have separate limits | Org A at limit doesn't affect Org B |
| IP-based limit applies to unauthenticated requests | 429 after exceeding IP limit |
| Auth endpoints use stricter IP limits | 429 after 20 requests/min |

#### Redis Integration Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Rate limit persists across API instances | Same count from different pods |
| Rate limit expires after window | Counter resets after TTL |
| Redis unavailable with `failOpen=true` | Request allowed |
| Redis unavailable with `failOpen=false` | Request rejected |

#### Plan-Based Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Free plan org limited at 100/min | 429 on 101st request |
| Pro plan org allowed 2000/min | No 429 at 100 requests |
| Plan upgrade increases limit | Higher limit after upgrade |

### 13.3 E2E Tests

```gherkin
Scenario: Rate limit enforcement
  Given I am authenticated as an org on the Free plan
  When I make 100 requests to GET /api/v1/projects
  Then all requests should succeed
  And X-RateLimit-Remaining should decrease from 99 to 0

  When I make the 101st request
  Then I should receive 429 Too Many Requests
  And the response should include Retry-After header
  And the response should include a helpful error message

  When I wait until the window resets
  And I make another request
  Then the request should succeed
  And X-RateLimit-Remaining should be 99
```

```gherkin
Scenario: Plan-based rate limits
  Given I am authenticated as an org on the Free plan (100/min)
  When I make 100 requests in one minute
  Then the 101st request should return 429

  When I upgrade to the Pro plan (2000/min)
  And I wait for plan change to propagate (< 60 seconds)
  And I make another request
  Then the request should succeed
```

```gherkin
Scenario: Auth endpoint brute force protection
  Given I am not authenticated
  When I make 20 POST requests to /api/v1/auth/login
  Then all requests should be processed

  When I make the 21st request
  Then I should receive 429 Too Many Requests
  And this should apply regardless of my organization
```

---

## 14. Security Considerations

1. **Consistent Rate Limit Keys** – Use canonical forms for org IDs and IPs to prevent bypasses
2. **IP Spoofing Prevention** – Trust `X-Forwarded-For` only from known proxies/load balancers
3. **Redis Security** – Use authenticated Redis connection, TLS in production
4. **Fail-Open vs Fail-Closed** – Default to fail-open for availability, but document risk
5. **Logging Violations** – Log rate limit violations for security monitoring
6. **No Timing Attacks** – Rate limit check should be constant time regardless of result
7. **Key Collision Prevention** – Use proper namespacing in Redis keys
8. **Enumeration Protection** – IP-based limits on unauthenticated endpoints prevent user enumeration

---

## 15. Performance Considerations

1. **Redis Latency** – Rate limit checks should add <5ms latency
2. **Connection Pooling** – Use Redis connection pool to avoid connection overhead
3. **Pipelining** – Use Redis pipeline for multiple window checks in single round-trip
4. **Caching Plan Data** – Cache org plan for short TTL to avoid DB lookup per request
5. **Async Header Generation** – Don't block response for header generation
6. **Hot Key Protection** – Consider local caching for extremely hot org IDs
7. **Memory Usage** – Monitor Redis memory for rate limit keys
8. **Key Expiration** – Ensure TTLs are set to prevent unbounded Redis growth

---

## 16. Libraries

### Recommended: `rate-limiter-flexible`

```bash
npm install rate-limiter-flexible
```

**Why `rate-limiter-flexible`:**
- Mature and well-maintained
- Supports multiple backends (Redis, Memory, Mongo, etc.)
- Sliding window and token bucket algorithms
- Built-in handling for Redis failures
- TypeScript support
- Used in production by many projects

### Alternative: `@nestjs/throttler`

Simpler but less flexible:
- Good for basic use cases
- Doesn't support multiple windows easily
- Less control over failure behavior

### Custom Implementation

For more control, implement directly with Redis:
- `INCR` + `EXPIRE` for simple counter
- Lua scripts for atomic multi-window checks
- More complexity but full control

---

## 17. Project Structure

```
apps/api/src/
├── rate-limiting/
│   ├── rate-limiting.module.ts
│   ├── rate-limit.service.ts
│   ├── rate-limit.config.ts
│   ├── guards/
│   │   └── rate-limit.guard.ts
│   ├── interceptors/
│   │   └── rate-limit-headers.interceptor.ts
│   ├── decorators/
│   │   ├── rate-limit.decorator.ts
│   │   └── skip-rate-limit.decorator.ts
│   ├── exceptions/
│   │   └── too-many-requests.exception.ts
│   └── interfaces/
│       ├── rate-limit-config.interface.ts
│       └── rate-limit-result.interface.ts
```

---

## 18. Constraints

1. **Redis Required** – Rate limiting requires Redis for distributed operation
2. **Less Than 5ms Overhead** – Rate limit check must not significantly impact latency
3. **Works with Existing Auth** – Must integrate with session auth and API key auth
4. **Graceful Degradation** – Must handle Redis unavailability without crashing
5. **Plan Integration** – Must read org plan from billing/subscription data
6. **No Database Writes** – Rate limiting is read-only from API perspective (Redis only)

---

## 19. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `rate-limiter-flexible` | `^5.x` | Rate limiting library |
| `ioredis` | existing | Redis client |

### No Frontend Dependencies
Rate limiting is entirely backend; frontend only sees response headers.

---

## 20. Future Enhancements (Out of Scope)

- Per-endpoint customizable limits via admin UI
- Rate limit analytics dashboard
- Webhook for rate limit events
- Burst credits system (save unused requests)
- Rate limit exemptions for specific orgs
- Geographic-based rate limiting
- Cost-based rate limiting (expensive endpoints cost more "points")

---

*End of spec*