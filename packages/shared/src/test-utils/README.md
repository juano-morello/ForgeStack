# Test Utilities

Shared test fixtures and data factories for consistent test data generation across the ForgeStack monorepo.

## Installation

The test utilities are part of the `@forgestack/shared` package:

```typescript
import {
  mockUUID,
  createMockUser,
  createMockOrganization,
  createMockProject,
  createMockMember,
  createMockInvitation,
  createMockApiKey,
  createMockActivity,
  createMockNotification,
  createMockWebhookEndpoint,
  createMockWebhookDelivery,
  createMockTenantContext,
  createMockRequest,
} from '@forgestack/shared/test-utils';
```

## Features

- **No Database Dependencies**: These utilities do NOT import from `@forgestack/db`, making them safe to use in unit tests without triggering database connections.
- **Realistic Mock Data**: All factories generate complete objects with realistic default values.
- **Customizable**: Every factory accepts an optional `overrides` parameter to customize the generated data.
- **Type-Safe**: Full TypeScript support with proper type inference.

## API Reference

### Core Utilities

#### `mockUUID()`

Generates a valid UUID v4 string.

```typescript
const id = mockUUID();
// => "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f7a8"
```

### Entity Factories

#### `createMockUser(overrides?)`

Creates a mock user object.

```typescript
const user = createMockUser();
const customUser = createMockUser({ 
  name: 'John Doe', 
  email: 'john@example.com',
  isSuperAdmin: true 
});
```

#### `createMockOrganization(overrides?)`

Creates a mock organization object.

```typescript
const org = createMockOrganization();
const customOrg = createMockOrganization({ 
  name: 'Acme Corp',
  timezone: 'America/New_York' 
});
```

#### `createMockProject(overrides?)`

Creates a mock project object.

```typescript
const project = createMockProject();
const customProject = createMockProject({ 
  name: 'My Project',
  orgId: 'specific-org-id' 
});
```

#### `createMockMember(overrides?)`

Creates a mock organization member object.

```typescript
const member = createMockMember();
const owner = createMockMember({ role: 'OWNER' });
```

#### `createMockInvitation(overrides?)`

Creates a mock invitation object with a 7-day expiration.

```typescript
const invitation = createMockInvitation();
const customInvite = createMockInvitation({ 
  email: 'newuser@example.com',
  role: 'OWNER' 
});
```

#### `createMockApiKey(overrides?)`

Creates a mock API key object.

```typescript
const apiKey = createMockApiKey();
const customKey = createMockApiKey({ 
  name: 'Production Key',
  scopes: ['read:projects', 'write:projects'] 
});
```

#### `createMockActivity(overrides?)`

Creates a mock activity object.

```typescript
const activity = createMockActivity();
const customActivity = createMockActivity({ 
  type: 'file.uploaded',
  title: 'uploaded a file' 
});
```

#### `createMockNotification(overrides?)`

Creates a mock notification object.

```typescript
const notification = createMockNotification();
const readNotification = createMockNotification({ 
  readAt: new Date() 
});
```

#### `createMockWebhookEndpoint(overrides?)`

Creates a mock webhook endpoint object.

```typescript
const endpoint = createMockWebhookEndpoint();
const customEndpoint = createMockWebhookEndpoint({ 
  url: 'https://myapp.com/webhook',
  events: ['project.created', 'project.updated'] 
});
```

#### `createMockWebhookDelivery(overrides?)`

Creates a mock webhook delivery object.

```typescript
const delivery = createMockWebhookDelivery();
const failedDelivery = createMockWebhookDelivery({ 
  failedAt: new Date(),
  error: 'Connection timeout' 
});
```

### Context Utilities

#### `createMockTenantContext(overrides?)`

Creates a mock tenant context for RLS testing.

```typescript
const context = createMockTenantContext();
const memberContext = createMockTenantContext({ role: 'MEMBER' });
```

#### `createMockRequest(userId?)`

Creates a mock NestJS/Express request object with user and tenant context.

```typescript
const request = createMockRequest();
const customRequest = createMockRequest('specific-user-id');
```

## Usage Examples

### Unit Testing a Service

```typescript
import { createMockOrganization, createMockTenantContext } from '@forgestack/shared/test-utils';

describe('ProjectsService', () => {
  it('should create a project', async () => {
    const org = createMockOrganization();
    const context = createMockTenantContext({ orgId: org.id });
    
    const result = await service.create(context, {
      name: 'Test Project',
      description: 'A test project',
    });
    
    expect(result.orgId).toBe(org.id);
  });
});
```

### Testing with Mock Requests

```typescript
import { createMockRequest } from '@forgestack/shared/test-utils';

describe('ProjectsController', () => {
  it('should list projects', async () => {
    const request = createMockRequest();
    const result = await controller.list(request);
    
    expect(result).toBeDefined();
  });
});
```

