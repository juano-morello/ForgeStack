# API Keys Feature

ForgeStack provides API key management for programmatic access to the API.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Client                           │
│  curl -H "X-API-Key: fsk_live_abc123..." https://api.example.com│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TenantContextGuard                            │
│  1. Check for X-API-Key header                                   │
│  2. Hash key and lookup in database                              │
│  3. Verify key is not expired/revoked                            │
│  4. Extract orgId and scopes from key                            │
│  5. Create TenantContext with API key permissions                │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Endpoint                                  │
│  - Request processed with org context from API key               │
│  - Scopes checked for permission                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/api-keys/api-keys.controller.ts` | CRUD endpoints |
| `apps/api/src/api-keys/api-keys.service.ts` | Key generation & validation |
| `apps/api/src/api-keys/api-keys.repository.ts` | Database operations |
| `apps/api/src/core/guards/api-key.guard.ts` | API key authentication |
| `apps/web/src/hooks/use-api-keys.ts` | Frontend hook |
| `packages/db/src/schema/api-keys.ts` | Database schema |

## Database Schema

```typescript
// packages/db/src/schema/api-keys.ts
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),    // "fsk_live_xxx" (visible)
  keyHash: text('key_hash').notNull(),        // SHA-256 hash (for lookup)
  scopes: text('scopes').array().notNull(),   // ['read', 'write']
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

## API Key Format

```
fsk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
│   │    └─────────────────────────────────── Random 32-char suffix
│   └──────────────────────────────────────── Environment (live/test)
└──────────────────────────────────────────── Prefix (forgestack key)
```

## Scopes

| Scope | Permissions |
|-------|-------------|
| `read` | GET requests only |
| `write` | GET, POST, PATCH, DELETE |
| `admin` | All operations including settings |

## API Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| `GET` | `/api-keys` | List API keys | `api_keys:read` |
| `POST` | `/api-keys` | Create API key | `api_keys:create` |
| `GET` | `/api-keys/:id` | Get API key details | `api_keys:read` |
| `PATCH` | `/api-keys/:id` | Update API key | `api_keys:update` |
| `DELETE` | `/api-keys/:id` | Revoke API key | `api_keys:delete` |
| `POST` | `/api-keys/:id/rotate` | Rotate API key | `api_keys:update` |

## Frontend Usage

### useApiKeys Hook

```typescript
import { useApiKeys } from '@/hooks/use-api-keys';

function ApiKeysPage() {
  const { 
    apiKeys, 
    isLoading, 
    createKey, 
    revokeKey,
    rotateKey,
  } = useApiKeys({ orgId: currentOrg.id });

  const handleCreate = async () => {
    const { key } = await createKey({
      name: 'Production API Key',
      scopes: ['read', 'write'],
      expiresAt: null, // Never expires
    });
    
    // Show key to user (only time it's visible!)
    alert(`Your API key: ${key}`);
  };
}
```

## Backend Usage

### Creating an API Key

```typescript
// In ApiKeysService
async create(ctx: TenantContext, dto: CreateApiKeyDto) {
  // Generate random key
  const rawKey = `fsk_live_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 12) + '...';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Store hashed key
  const apiKey = await this.repository.create(ctx, {
    name: dto.name,
    keyPrefix,
    keyHash,
    scopes: dto.scopes,
    expiresAt: dto.expiresAt,
  });

  // Return raw key (only time it's available!)
  return { ...apiKey, key: rawKey };
}
```

### Validating an API Key

```typescript
// In ApiKeyGuard
async validateApiKey(rawKey: string): Promise<TenantContext | null> {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  
  const apiKey = await this.repository.findByHash(keyHash);
  
  if (!apiKey) return null;
  if (apiKey.revokedAt) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used timestamp (async, non-blocking)
  this.repository.updateLastUsed(apiKey.id);

  return {
    orgId: apiKey.orgId,
    userId: apiKey.createdBy,
    role: 'MEMBER', // API keys have limited permissions
    scopes: apiKey.scopes,
  };
}
```

## Security Considerations

1. **Key is shown only once** - After creation, only the prefix is stored
2. **Keys are hashed** - SHA-256 hash stored, not the raw key
3. **Scoped permissions** - Keys can have limited scopes
4. **Expiration** - Keys can have optional expiration dates
5. **Revocation** - Keys can be revoked immediately
6. **Rotation** - Keys can be rotated without downtime
7. **Audit logging** - All key operations are logged

