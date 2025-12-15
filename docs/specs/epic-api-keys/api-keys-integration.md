# API Keys Integration

**Epic:** API Keys
**Priority:** TBD
**Depends on:** NestJS API Skeleton, Organization Management
**Status:** Draft

---

## 1. Context

### Why API Keys

API keys enable programmatic access to ForgeStack for:
- **CI/CD Integrations** – Automated deployments and workflows
- **Third-party Integrations** – External tools and services
- **Developer Experience** – CLI tools, SDKs, and scripts
- **Automation** – Scheduled tasks and background processes

### Business Value

- Enhanced developer experience through automation
- Enables ecosystem integrations and third-party tools
- Supports enterprise use cases requiring programmatic access
- Foundation for future webhook and event systems

### Security Approach

- **Hashed storage** – Keys are stored as SHA-256 hashes (never plain text)
- **Timing-safe comparison** – Uses `crypto.timingSafeEqual` to prevent timing attacks during key verification
- **Scoped permissions** – Fine-grained access control per key
- **Scope-based role determination** – API key role is determined by scopes (only admin scopes grant OWNER role)
- **Rate limiting** – Per-key rate limits to prevent abuse
- **Audit logging** – Track key usage and access patterns
- **Revocation** – Instant key invalidation capability

### Key Format

```
fsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
└─┬─┘└┬─┘└──────────────┬───────────────┘
  │   │                  │
  │   │                  └─ 32 random chars (base62)
  │   └─ environment (live/test)
  └─ prefix (forgestack key)
```

- `fsk_` – ForgeStack key prefix
- `live_` / `test_` – Environment indicator
- 32 base62 characters – Cryptographically random identifier

---

## 2. User Stories

### US-1: Create API Key
**As an** org owner,
**I want to** create API keys for programmatic access,
**So that** I can integrate external tools and automate workflows.

### US-2: Define Key Scopes
**As an** org owner,
**I want to** define specific scopes/permissions for each key,
**So that** I can follow the principle of least privilege.

### US-3: Revoke API Key
**As an** org owner,
**I want to** revoke API keys immediately,
**So that** I can respond to security incidents or remove access.

### US-4: Authenticate with API Key
**As a** developer,
**I want to** authenticate API requests using an API key,
**So that** I can access ForgeStack resources programmatically.

### US-5: View Key Usage
**As an** org owner,
**I want to** view API key usage and last-used timestamps,
**So that** I can audit access and identify unused keys.

### US-6: Rotate API Key
**As an** org owner,
**I want to** rotate an API key,
**So that** I can maintain security without reconfiguring integrations.

---

## 3. Acceptance Criteria

### AC-1: Key Creation
- [ ] **AC-1.1:** Only users with OWNER role can create API keys
- [ ] **AC-1.2:** Full key is displayed only once upon creation
- [ ] **AC-1.3:** Keys are stored as SHA-256 hashes in the database
- [ ] **AC-1.4:** Key prefix (first 8 chars) is stored for identification
- [ ] **AC-1.5:** User must provide a descriptive name for the key
- [ ] **AC-1.6:** Key format follows `fsk_{env}_{random32}` pattern

### AC-2: Scope Management
- [ ] **AC-2.1:** Scopes can be assigned during key creation
- [ ] **AC-2.2:** Scopes can be modified after creation
- [ ] **AC-2.3:** Scope validation occurs on every API request
- [ ] **AC-2.4:** Missing required scope returns 403 Forbidden
- [ ] **AC-2.5:** Wildcard scope (`*`) grants full access

### AC-3: Key Revocation
- [ ] **AC-3.1:** Only OWNER role can revoke keys
- [ ] **AC-3.2:** Revoked keys immediately stop working
- [ ] **AC-3.3:** Revoked keys cannot be un-revoked
- [ ] **AC-3.4:** Revocation timestamp is recorded

### AC-4: Authentication
- [ ] **AC-4.1:** API key accepted via `X-API-Key` header
- [ ] **AC-4.2:** API key accepted via `Authorization: Bearer` header
- [ ] **AC-4.3:** Invalid/revoked/expired keys return 401 Unauthorized
- [ ] **AC-4.4:** Org context is set from key's org_id for RLS

### AC-5: Usage Tracking
- [ ] **AC-5.1:** `last_used_at` updated on each authenticated request
- [ ] **AC-5.2:** API key list shows last used timestamp
- [ ] **AC-5.3:** Keys can have optional expiration dates

### AC-6: Key Rotation
- [ ] **AC-6.1:** Rotation generates new key and revokes old
- [ ] **AC-6.2:** New key retains name and scopes from old key
- [ ] **AC-6.3:** New full key is displayed only once

---

## 4. Database Schema

### api_keys Table

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,          -- First 8 chars (e.g., "fsk_live_")
  key_hash TEXT NOT NULL,            -- SHA-256 hash of full key
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,            -- NULL means no expiration
  revoked_at TIMESTAMPTZ,            -- NULL means active
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
```

### Drizzle Schema Definition

```typescript
// packages/db/src/schema/api-keys.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: text('scopes').array().notNull().default([]),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see API keys for their current org
CREATE POLICY api_keys_org_isolation ON api_keys
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

---

## 5. Scopes Definition

### Available Scopes

| Scope | Description |
|-------|-------------|
| `projects:read` | Read project data |
| `projects:write` | Create, update, delete projects |
| `members:read` | View organization members |
| `members:write` | Invite, update, remove members |
| `billing:read` | View billing information |
| `billing:write` | Manage billing settings |
| `files:read` | Download files |
| `files:write` | Upload files |
| `api-keys:read` | List API keys (excluding hashes) |
| `api-keys:write` | Create, revoke, rotate API keys |
| `*` | Full access (all scopes) |

### Scope Hierarchy

- `*` (wildcard) includes all scopes
- Write scopes implicitly include their read counterparts
  - `projects:write` includes `projects:read`
  - `members:write` includes `members:read`

### Scope Validation Logic

```typescript
function hasRequiredScope(keyScopes: string[], requiredScope: string): boolean {
  // Wildcard grants all access
  if (keyScopes.includes('*')) return true;

  // Direct match
  if (keyScopes.includes(requiredScope)) return true;

  // Write implies read
  if (requiredScope.endsWith(':read')) {
    const writeScope = requiredScope.replace(':read', ':write');
    if (keyScopes.includes(writeScope)) return true;
  }

  return false;
}
```

---

## 6. API Endpoints

### Base Path: `/api/v1/api-keys`

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/api-keys` | Create new API key | OWNER |
| GET | `/api-keys` | List all API keys | OWNER |
| GET | `/api-keys/:id` | Get API key details | OWNER |
| PATCH | `/api-keys/:id` | Update key name/scopes | OWNER |
| DELETE | `/api-keys/:id` | Revoke API key | OWNER |
| POST | `/api-keys/:id/rotate` | Rotate API key | OWNER |

### Request/Response Examples

#### POST /api-keys – Create Key

**Request:**
```json
{
  "name": "CI/CD Pipeline",
  "scopes": ["projects:read", "files:write"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "CI/CD Pipeline",
  "keyPrefix": "fsk_live_",
  "key": "fsk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "scopes": ["projects:read", "files:write"],
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

> ⚠️ **Note:** The `key` field is only returned once at creation. Store it securely.

#### GET /api-keys – List Keys

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "CI/CD Pipeline",
      "keyPrefix": "fsk_live_",
      "scopes": ["projects:read", "files:write"],
      "lastUsedAt": "2024-01-20T14:22:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "revokedAt": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### DELETE /api-keys/:id – Revoke Key

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "revokedAt": "2024-01-25T09:00:00Z",
  "message": "API key has been revoked"
}
```

#### POST /api-keys/:id/rotate – Rotate Key

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "CI/CD Pipeline",
  "keyPrefix": "fsk_live_",
  "key": "fsk_live_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4",
  "scopes": ["projects:read", "files:write"],
  "previousKeyId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-25T09:00:00Z"
}
```


---

## 7. Authentication Guard

### ApiKeyGuard Implementation

The `ApiKeyGuard` is a NestJS guard that authenticates requests using API keys.

#### Authentication Flow

```
1. Extract API key from headers
   - Check X-API-Key header
   - OR check Authorization: Bearer header

2. Hash the provided key (SHA-256)

3. Look up key_hash in database

4. Validate key status:
   - Key exists? → 401 if not
   - Key revoked? → 401 if revoked_at is set
   - Key expired? → 401 if expires_at < now()

5. Validate scopes:
   - Get required scopes from @RequireScopes() decorator
   - Check key.scopes contains required scopes
   - Return 403 if missing required scopes

6. Set context for RLS:
   - Set org_id from key record
   - Attach api key metadata to request

7. Update last_used_at timestamp (async, non-blocking)
```

#### Guard Implementation

```typescript
// apps/api/src/auth/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Hash and lookup
    const keyHash = this.hashKey(apiKey);
    const keyRecord = await this.apiKeysService.findByHash(keyHash);

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check revocation
    if (keyRecord.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Validate scopes
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler()) || [];
    for (const scope of requiredScopes) {
      if (!this.hasScope(keyRecord.scopes, scope)) {
        throw new ForbiddenException(`Missing required scope: ${scope}`);
      }
    }

    // Set context for RLS
    request.apiKey = keyRecord;
    request.orgId = keyRecord.orgId;
    request.authType = 'api_key';

    // Update last_used_at asynchronously
    this.apiKeysService.updateLastUsed(keyRecord.id).catch(() => {});

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check X-API-Key header
    const xApiKey = request.headers['x-api-key'];
    if (xApiKey) return xApiKey;

    // Check Authorization: Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Only treat as API key if it has the fsk_ prefix
      if (token.startsWith('fsk_')) return token;
    }

    return null;
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Timing-safe comparison to prevent timing attacks.
   * Uses crypto.timingSafeEqual for constant-time comparison.
   */
  private timingSafeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  private hasScope(keyScopes: string[], requiredScope: string): boolean {
    if (keyScopes.includes('*')) return true;
    if (keyScopes.includes(requiredScope)) return true;

    // Write implies read
    if (requiredScope.endsWith(':read')) {
      const writeScope = requiredScope.replace(':read', ':write');
      if (keyScopes.includes(writeScope)) return true;
    }

    return false;
  }
}
```

#### @RequireScopes Decorator

```typescript
// apps/api/src/auth/decorators/require-scopes.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequireScopes = (...scopes: string[]) => SetMetadata('scopes', scopes);
```

#### Usage Example

```typescript
@Controller('projects')
export class ProjectsController {
  @Get()
  @UseGuards(ApiKeyGuard)
  @RequireScopes('projects:read')
  findAll() {
    // Only accessible with API key having projects:read scope
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @RequireScopes('projects:write')
  create(@Body() dto: CreateProjectDto) {
    // Only accessible with API key having projects:write scope
  }
}
```

### Hybrid Authentication

Support both session-based and API key authentication:

```typescript
// apps/api/src/auth/guards/hybrid-auth.guard.ts
@Injectable()
export class HybridAuthGuard implements CanActivate {
  constructor(
    private sessionGuard: TenantContextGuard,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if API key is present
    const hasApiKey = request.headers['x-api-key'] ||
      request.headers['authorization']?.startsWith('Bearer fsk_');

    if (hasApiKey) {
      return this.apiKeyGuard.canActivate(context);
    }

    // Fall back to session-based auth
    return this.sessionGuard.canActivate(context);
  }
}
```

---

## 8. Frontend Components

### Pages

#### API Keys Settings Page
**Path:** `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx`

- Display list of API keys with:
  - Name
  - Key prefix (masked)
  - Scopes (as badges)
  - Last used timestamp
  - Created date
  - Status (active/revoked/expired)
- "Create API Key" button
- Actions per key: Edit, Rotate, Revoke

### Components

#### ApiKeysList Component
```typescript
// apps/web/src/components/api-keys/api-keys-list.tsx
interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
```

#### CreateApiKeyModal Component
- Form fields:
  - Name (required)
  - Scopes (multi-select checkboxes)
  - Expiration date (optional date picker)
- On submit: Show generated key with copy button
- Warning: "This key will only be shown once"

#### ApiKeyDisplay Component
- Shows the full key immediately after creation
- Copy to clipboard button
- Visual warning about one-time display

#### ScopeBadges Component
- Display scopes as colored badges
- Tooltip with scope description

#### RevokeConfirmDialog Component
- Confirmation dialog with key name
- Warning about immediate revocation
- Confirm/Cancel buttons

### Hooks

#### useApiKeys Hook
```typescript
// apps/web/src/hooks/use-api-keys.ts
export function useApiKeys() {
  // List API keys
  // Create API key
  // Revoke API key
  // Rotate API key
  // Update API key
}
```

---

## 9. Tasks

### Backend Tasks (apps/api)

#### 9.1 Create ApiKeys Module
- [ ] Create `apps/api/src/api-keys/api-keys.module.ts`
- [ ] Register service, controller, and guard
- [ ] Import required dependencies

#### 9.2 Implement Key Hashing Utility
- [ ] Create `apps/api/src/api-keys/utils/key-hash.util.ts`
- [ ] Implement `generateApiKey()` – generates `fsk_{env}_{random32}`
- [ ] Implement `hashApiKey()` – SHA-256 hash
- [ ] Implement `extractPrefix()` – extracts first 8 chars

#### 9.3 Create ApiKeys Service
- [ ] Create `apps/api/src/api-keys/api-keys.service.ts`
- [ ] Implement `create(ctx, dto)` – generates key, stores hash
- [ ] Implement `findAll(ctx)` – lists keys for org (no hashes)
- [ ] Implement `findOne(ctx, id)` – get single key details
- [ ] Implement `findByHash(hash)` – lookup by key hash
- [ ] Implement `update(ctx, id, dto)` – update name/scopes
- [ ] Implement `revoke(ctx, id)` – sets revoked_at
- [ ] Implement `rotate(ctx, id)` – creates new key, revokes old
- [ ] Implement `updateLastUsed(id)` – updates last_used_at

#### 9.4 Create ApiKeys Controller
- [ ] Create `apps/api/src/api-keys/api-keys.controller.ts`
- [ ] Implement `POST /api-keys` endpoint
- [ ] Implement `GET /api-keys` endpoint
- [ ] Implement `GET /api-keys/:id` endpoint
- [ ] Implement `PATCH /api-keys/:id` endpoint
- [ ] Implement `DELETE /api-keys/:id` endpoint
- [ ] Implement `POST /api-keys/:id/rotate` endpoint
- [ ] Apply `@Roles('OWNER')` guard to all endpoints

#### 9.5 Create DTOs
- [ ] Create `apps/api/src/api-keys/dto/create-api-key.dto.ts`
- [ ] Create `apps/api/src/api-keys/dto/update-api-key.dto.ts`
- [ ] Add validation decorators (class-validator)

#### 9.6 Implement ApiKeyGuard
- [ ] Create `apps/api/src/auth/guards/api-key.guard.ts`
- [ ] Implement key extraction from headers
- [ ] Implement key validation logic
- [ ] Implement scope checking

#### 9.7 Create Decorators
- [ ] Create `@RequireScopes()` decorator
- [ ] Create `@ApiKeyAuth()` decorator (combines guard + metadata)

#### 9.8 Integrate with Auth Flow
- [ ] Create `HybridAuthGuard` for session + API key support
- [ ] Update relevant controllers to use hybrid auth

### Database Tasks (packages/db)

#### 9.9 Create api_keys Table
- [ ] Create migration file `XXXX_add_api_keys_table.ts`
- [ ] Add api_keys table schema
- [ ] Add indexes for org_id, key_hash, key_prefix

#### 9.10 Add RLS Policies
- [ ] Enable RLS on api_keys table
- [ ] Create org isolation policy

#### 9.11 Add Drizzle Schema
- [ ] Create `packages/db/src/schema/api-keys.ts`
- [ ] Export from schema index

### Frontend Tasks (apps/web)

#### 9.12 Create API Keys Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx`
- [ ] Add to settings navigation

#### 9.13 Create Components
- [ ] Create `apps/web/src/components/api-keys/api-keys-list.tsx`
- [ ] Create `apps/web/src/components/api-keys/create-api-key-modal.tsx`
- [ ] Create `apps/web/src/components/api-keys/api-key-display.tsx`
- [ ] Create `apps/web/src/components/api-keys/scope-selector.tsx`
- [ ] Create `apps/web/src/components/api-keys/scope-badges.tsx`
- [ ] Create `apps/web/src/components/api-keys/revoke-confirm-dialog.tsx`

#### 9.14 Create Hooks
- [ ] Create `apps/web/src/hooks/use-api-keys.ts`

---

## 10. Test Plan

### Unit Tests

#### Key Utilities
| Test Case | Expected Result |
|-----------|-----------------|
| `generateApiKey()` returns correct format | Matches `fsk_{env}_[a-zA-Z0-9]{32}` |
| `hashApiKey()` produces consistent hash | Same input → same output |
| `hashApiKey()` produces different hashes | Different inputs → different outputs |
| `extractPrefix()` extracts first 8 chars | Returns `fsk_live_` or `fsk_test_` |

#### Scope Validation
| Test Case | Expected Result |
|-----------|-----------------|
| Wildcard scope grants all access | `['*']` passes any scope check |
| Direct scope match | `['projects:read']` passes `projects:read` |
| Write implies read | `['projects:write']` passes `projects:read` |
| Missing scope fails | `['projects:read']` fails `members:read` |

#### ApiKeyGuard
| Test Case | Expected Result |
|-----------|-----------------|
| Valid key in X-API-Key header | Allows request |
| Valid key in Authorization Bearer | Allows request |
| Missing API key | Returns 401 |
| Invalid API key | Returns 401 |
| Revoked API key | Returns 401 |
| Expired API key | Returns 401 |
| Missing required scope | Returns 403 |

### Integration Tests

#### API Key Lifecycle
| Test Case | Expected Result |
|-----------|-----------------|
| Create API key as OWNER | 201, returns full key once |
| Create API key as MEMBER | 403 Forbidden |
| List API keys | Returns keys without hashes |
| Update key name | 200, name updated |
| Update key scopes | 200, scopes updated |
| Revoke key | 200, revoked_at set |
| Rotate key | 200, new key created, old revoked |
| Use revoked key | 401 Unauthorized |

#### Cross-Org Isolation
| Test Case | Expected Result |
|-----------|-----------------|
| List keys from other org | Returns empty (RLS) |
| Revoke key from other org | 404 Not Found (RLS) |
| Use key for wrong org | 403 (org mismatch) |

### E2E Tests

#### Complete Key Lifecycle
```gherkin
Scenario: Create and use API key
  Given I am logged in as an org OWNER
  When I navigate to Settings > API Keys
  And I click "Create API Key"
  And I enter name "Test Key"
  And I select scopes "projects:read"
  And I click "Create"
  Then I should see the full API key
  And I should be able to copy it

  When I make a GET request to /api/v1/projects
  With header X-API-Key: {the-key}
  Then I should receive 200 OK

  When I navigate back to API Keys
  Then I should see "Test Key" in the list
  And I should see the last used timestamp updated

  When I click "Revoke" on "Test Key"
  And I confirm revocation
  Then the key should show as revoked

  When I make a GET request to /api/v1/projects
  With header X-API-Key: {the-key}
  Then I should receive 401 Unauthorized
```

#### Scope Enforcement
```gherkin
Scenario: Scope enforcement
  Given I have an API key with scope "projects:read"

  When I GET /api/v1/projects
  Then I should receive 200 OK

  When I POST /api/v1/projects
  Then I should receive 403 Forbidden
  With message "Missing required scope: projects:write"
```

---

## 11. Security Considerations

1. **Hashed Storage** – Never store plain text keys; use SHA-256 hashes
2. **One-Time Display** – Full key shown only at creation, never retrievable again
3. **Key Prefix** – Allows identification without revealing full key
4. **Rate Limiting** – Implement per-key rate limits to prevent abuse
5. **Audit Logging** – Log all key usage for security audits
6. **Secure Generation** – Use cryptographically secure random for key generation
7. **TLS Required** – Keys must only be transmitted over HTTPS
8. **Revocation** – Immediate invalidation capability for security incidents
9. **Expiration** – Support optional key expiration for time-limited access
10. **Org Isolation** – RLS ensures keys cannot access other organizations' data

---

## 12. Project Structure

```
apps/api/src/
├── api-keys/
│   ├── api-keys.module.ts
│   ├── api-keys.controller.ts
│   ├── api-keys.service.ts
│   ├── dto/
│   │   ├── create-api-key.dto.ts
│   │   └── update-api-key.dto.ts
│   └── utils/
│       └── key-hash.util.ts
├── auth/
│   ├── guards/
│   │   ├── api-key.guard.ts
│   │   └── hybrid-auth.guard.ts
│   └── decorators/
│       └── require-scopes.decorator.ts

packages/db/src/
├── schema/
│   └── api-keys.ts
└── migrations/
    └── XXXX_add_api_keys_table.ts

apps/web/src/
├── app/(dashboard)/
│   └── settings/
│       └── api-keys/
│           └── page.tsx
├── components/
│   └── api-keys/
│       ├── api-keys-list.tsx
│       ├── create-api-key-modal.tsx
│       ├── api-key-display.tsx
│       ├── scope-selector.tsx
│       ├── scope-badges.tsx
│       └── revoke-confirm-dialog.tsx
└── hooks/
    └── use-api-keys.ts
```

---

## 13. Constraints

1. **RLS Required** – All api_keys records MUST include org_id for RLS
2. **withTenantContext()** – Use for all DB operations in ApiKeysService
3. **Hash-Only Storage** – Keys MUST be hashed before storage
4. **One-Time Display** – Full key shown only once at creation
5. **No Un-Revoke** – Revoked keys cannot be reactivated
6. **OWNER Only** – Only OWNER role can manage API keys
7. **Prefix Format** – Keys must follow `fsk_{env}_{random32}` format

---

## 14. Environment Variables

```bash
# No new environment variables required
# API keys are generated server-side using Node.js crypto
```

---

## 15. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `crypto` | built-in | SHA-256 hashing, random generation |
| `@nestjs/common` | existing | Guards, decorators |
| `class-validator` | existing | DTO validation |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hot-toast` | existing | Success/error notifications |
| `@radix-ui/react-dialog` | existing | Modal dialogs |
| `date-fns` | existing | Date formatting |

---

*End of spec*

