# Testing Guide for ForgeStack V2

This document describes the testing strategy, tools, and practices used in ForgeStack.

## Overview

ForgeStack uses a comprehensive testing strategy with multiple layers:

| Test Type | Framework | Location | Purpose |
|-----------|-----------|----------|---------|
| **Unit Tests** | Jest/Vitest | `src/**/*.spec.ts`, `src/**/*.test.ts` | Test individual functions/classes in isolation |
| **Integration Tests** | Jest | `apps/api/test/integration/` | Test with real database, RLS policies |
| **E2E Tests** | Playwright | `apps/web/e2e/` | Full user journey tests |

## Coverage Targets

| Package | Target | Current | Framework |
|---------|--------|---------|-----------|
| `apps/api` | >90% | 98.51% | Jest |
| `apps/web` | >80% | 82.3% | Vitest |
| `apps/worker` | >80% | 85%+ | Jest |
| `packages/shared` | >90% | 95%+ | Vitest |
| `packages/sdk` | >95% | 98%+ | Vitest |
| `packages/db` | >80% | 85%+ | Vitest |
| `packages/emails` | >80% | 100% | Vitest |

## Quick Start

```bash
# Run all tests across the monorepo
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run integration tests (requires database)
pnpm test:integration

# Run E2E tests (requires running apps)
pnpm test:e2e
```

## Package-Specific Commands

### API (`apps/api`)

```bash
cd apps/api

# Unit tests
pnpm test                    # Run all unit tests
pnpm test:watch              # Watch mode
pnpm test:cov                # With coverage

# Integration tests (requires PostgreSQL)
pnpm test:integration        # Run integration tests

# E2E tests
pnpm test:e2e                # Run E2E API tests
```

### Web (`apps/web`)

```bash
cd apps/web

# Unit tests
pnpm test                    # Run all unit tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage

# E2E tests (requires running app)
pnpm test:e2e                # Run Playwright tests
pnpm test:e2e:ui             # Playwright UI mode
pnpm test:e2e:debug          # Debug mode
```

### Worker (`apps/worker`)

```bash
cd apps/worker

pnpm test                    # Run all unit tests
pnpm test:watch              # Watch mode
pnpm test:cov                # With coverage
```

### Packages

```bash
# Shared package
cd packages/shared && pnpm test

# SDK package
cd packages/sdk && pnpm test

# Database package
cd packages/db && pnpm test

# Emails package
cd packages/emails && pnpm test
```

## Test Utilities

### Shared Test Factories

Use the shared test utilities from `@forgestack/shared/test-utils`:

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

// Create with defaults
const user = createMockUser();
const org = createMockOrganization();

// Override specific fields
const customOrg = createMockOrganization({
  name: 'My Custom Org',
  ownerId: user.id,
});

// Create tenant context for RLS testing
const ctx = createMockTenantContext({
  orgId: org.id,
  userId: user.id,
  role: 'OWNER',
});
```

## Writing Tests

### API Unit Tests (Jest)

```typescript
// apps/api/src/my-feature/my-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MyFeatureService } from './my-feature.service';
import { MyFeatureRepository } from './my-feature.repository';
import { createMockTenantContext } from '@forgestack/shared/test-utils';

describe('MyFeatureService', () => {
  let service: MyFeatureService;
  let repository: jest.Mocked<MyFeatureRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyFeatureService,
        { provide: MyFeatureRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MyFeatureService>(MyFeatureService);
    repository = module.get(MyFeatureRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const ctx = createMockTenantContext();
      repository.findAll.mockResolvedValue({ items: [], total: 0 });

      const result = await service.findAll(ctx, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(repository.findAll).toHaveBeenCalled();
    });
  });
});
```

### Web Component Tests (Vitest + React Testing Library)

```typescript
// apps/web/src/components/my-component.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<MyComponent title="Click Me" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Hook Tests (Vitest)

```typescript
// apps/web/src/hooks/use-my-hook.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMyHook } from './use-my-hook';
import * as api from '@/lib/api/my-api';

vi.mock('@/lib/api/my-api');

describe('useMyHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data on mount', async () => {
    vi.mocked(api.fetchData).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useMyHook());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.fetchData).toHaveBeenCalled();
  });
});
```

### Worker Handler Tests (Jest)

```typescript
// apps/worker/src/handlers/__tests__/my-handler.spec.ts
import { handleMyJob } from '../my-handler.handler';
import { Job } from 'bullmq';

// Mock dependencies
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn((_, cb) => cb({})),
}));

describe('handleMyJob', () => {
  const createMockJob = (data: unknown): Job => ({
    data,
    id: 'job-123',
    name: 'my-job',
  } as Job);

  it('should process job successfully', async () => {
    const job = createMockJob({ userId: 'user-123' });
    await expect(handleMyJob(job)).resolves.not.toThrow();
  });
});
```

## Integration Tests

Integration tests run against a real PostgreSQL database:

```bash
# Start test database
docker compose -f docker-compose.test.yml up -d

# Run integration tests
cd apps/api && pnpm test:integration
```

### RLS Policy Testing

```typescript
// apps/api/test/integration/rls.integration.spec.ts
describe('RLS Policies', () => {
  it('should isolate data between organizations', async () => {
    // Create org1 with data
    const org1 = await createTestOrg();
    await createProject(org1.id, 'Project 1');

    // Create org2
    const org2 = await createTestOrg();

    // Query from org2 context should not see org1 data
    const projects = await queryProjectsAsOrg(org2.id);
    expect(projects).toHaveLength(0);
  });
});
```

## E2E Tests (Playwright)

```typescript
// apps/web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

## CI/CD Pipeline

Tests run automatically on every push and PR via GitHub Actions:

```yaml
# .github/workflows/ci.yml
jobs:
  test-api:      # API unit + integration tests
  test-web:      # Web unit tests
  test-db:       # Database package tests
  test-worker:   # Worker handler tests (14 handlers)
  test-shared:   # Shared package tests
  test-sdk:      # SDK client tests
  test-emails:   # Email template tests
```

Coverage reports are uploaded to Codecov with package-specific flags.

## E2E Test Coverage

The Playwright E2E test suite covers all major user flows:

| Test File | Coverage |
|-----------|----------|
| `auth.spec.ts` | Login, signup, logout, password reset |
| `navigation.spec.ts` | Routing, redirects, protected routes |
| `dashboard.spec.ts` | Dashboard stats, quick actions |
| `organizations.spec.ts` | Create, switch, invite, members |
| `projects.spec.ts` | CRUD operations, search |
| `settings.spec.ts` | Profile, email, password changes |
| `api-keys.spec.ts` | API key CRUD, copy, rotate |
| `webhooks.spec.ts` | Webhook endpoint management |
| `billing.spec.ts` | Subscription, invoices, portal |
| `admin.spec.ts` | Impersonation, audit logs |
| `ai-chat.spec.ts` | AI chat, streaming, usage |
| `notifications.spec.ts` | Notification center, preferences |
| `docs.spec.ts` | Documentation site navigation |

**Run E2E tests:**

```bash
cd apps/web
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e:ui           # Playwright UI mode
pnpm test:e2e:debug        # Debug mode with inspector
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Services**: Always mock APIs, databases in unit tests
3. **Use Factories**: Use shared test utilities for consistent data
4. **Descriptive Names**: Use clear, descriptive test names
5. **AAA Pattern**: Arrange, Act, Assert
6. **Coverage Goals**: Aim for high coverage but prioritize meaningful tests

## Debugging Tests

```bash
# Run single test file
cd apps/api && pnpm test -- --testPathPattern="my-feature"

# Run with debugger
cd apps/api && pnpm test:debug

# Playwright debug mode
cd apps/web && pnpm test:e2e:debug
```

