# Migration Guide: Moving to Shared Test Utilities

This guide helps you migrate from local test utilities (`apps/api/test/test-utils.ts`) to the shared test utilities package (`@forgestack/shared/test-utils`).

## Why Migrate?

The shared test utilities provide:
- **Consistency**: Same test data across all packages (api, worker, web)
- **Maintainability**: Single source of truth for test fixtures
- **Reusability**: No need to duplicate mock factories in each package
- **Type Safety**: Centralized type definitions for test data

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import {
  mockUUID,
  createMockOrganization,
  createMockProject,
  createMockTenantContext,
  createMockRequest,
} from '../../test/test-utils';
```

**After:**
```typescript
import {
  mockUUID,
  createMockOrganization,
  createMockProject,
  createMockTenantContext,
  createMockRequest,
} from '@forgestack/shared/test-utils';
```

### 2. Available Factories

All factories from `apps/api/test/test-utils.ts` are now available in the shared package:

| Old Location | New Location | Status |
|-------------|--------------|--------|
| `mockUUID()` | `@forgestack/shared/test-utils` | ✅ Available |
| `createMockOrganization()` | `@forgestack/shared/test-utils` | ✅ Available |
| `createMockProject()` | `@forgestack/shared/test-utils` | ✅ Available |
| `createMockInvitation()` | `@forgestack/shared/test-utils` | ✅ Available |
| `createMockTenantContext()` | `@forgestack/shared/test-utils` | ✅ Available |
| `createMockRequest()` | `@forgestack/shared/test-utils` | ✅ Available |

### 3. New Factories Available

The shared package includes additional factories not in the original:

- `createMockUser()` - Create mock user data
- `createMockMember()` - Create mock organization member data
- `createMockApiKey()` - Create mock API key data
- `createMockActivity()` - Create mock activity data
- `createMockNotification()` - Create mock notification data
- `createMockWebhookEndpoint()` - Create mock webhook endpoint data
- `createMockWebhookDelivery()` - Create mock webhook delivery data

### 4. NestJS-Specific Utilities

Some utilities remain in `apps/api/test/test-utils.ts` because they depend on NestJS:

- `createTestModule()` - Creates a NestJS test module
- `mockDbContextHelpers` - Mocks for database context functions
- `resetDbMocks()` - Resets database mocks

These should **NOT** be migrated as they have NestJS dependencies.

## Example Migration

### Before

```typescript
// apps/api/src/projects/projects.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import {
  createMockProject,
  createMockTenantContext,
  mockUUID,
} from '../../test/test-utils';

describe('ProjectsService', () => {
  it('should create a project', async () => {
    const context = createMockTenantContext();
    const project = createMockProject({ orgId: context.orgId });
    // ... test logic
  });
});
```

### After

```typescript
// apps/api/src/projects/projects.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import {
  createMockProject,
  createMockTenantContext,
  mockUUID,
} from '@forgestack/shared/test-utils';

describe('ProjectsService', () => {
  it('should create a project', async () => {
    const context = createMockTenantContext();
    const project = createMockProject({ orgId: context.orgId });
    // ... test logic
  });
});
```

## Configuration

The Jest configuration has been updated to support the new import path:

```javascript
// jest.config.js
moduleNameMapper: {
  '^@forgestack/shared/test-utils$': '<rootDir>/../../../packages/shared/src/test-utils/index.ts',
  '^@forgestack/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
}
```

## Gradual Migration

You can migrate gradually:
1. Start with new test files using `@forgestack/shared/test-utils`
2. Update existing tests as you modify them
3. Both import paths will work during the transition

## Future Deprecation

Once all tests are migrated, the following will be removed from `apps/api/test/test-utils.ts`:
- `mockUUID()`
- `createMockOrganization()`
- `createMockProject()`
- `createMockInvitation()`
- `createMockTenantContext()`
- `createMockRequest()`

Only NestJS-specific utilities will remain.

## Questions?

See the [README](./README.md) for full API documentation and examples.

