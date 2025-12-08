# Playwright E2E Tests

This directory contains end-to-end tests for the ForgeStack web application using Playwright.

## Prerequisites

Before running E2E tests, ensure:

1. **Database is running and seeded** with test data:
   ```bash
   cd packages/db
   pnpm db:migrate  # Apply migrations
   pnpm db:seed     # Seed test data
   ```

2. **Playwright browsers are installed**:
   ```bash
   pnpm exec playwright install
   ```

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e e2e/auth.spec.ts

# Run tests with different reporter
pnpm test:e2e --reporter=list
pnpm test:e2e --reporter=html

# Run only authenticated tests
pnpm test:e2e --grep "Authenticated"

# Run only unauthenticated tests
pnpm test:e2e --grep "Unauthenticated"
```

## Test Structure

### Test Files

- **`auth.spec.ts`** - Authentication page tests (login, signup, form validation)
- **`dashboard.spec.ts`** - Dashboard page tests (authenticated user flows)
- **`navigation.spec.ts`** - Navigation and routing tests (home page, protected routes, redirects)
- **`organizations.spec.ts`** - Organization management tests (create, switch, members)
- **`projects.spec.ts`** - Project management tests (CRUD operations, search)
- **`settings.spec.ts`** - Settings page tests (profile, organization, account)
- **`billing.spec.ts`** - Billing and subscription tests (plans, invoices, usage tracking, Stripe integration)
- **`admin.spec.ts`** - Admin and impersonation tests (super-admin features, user management, audit logs)
- **`ai-chat.spec.ts`** - AI Chat feature tests (streaming, message handling)
- **`api-keys.spec.ts`** - API Keys and Webhooks tests (key management, webhook endpoints, deliveries)
- **`notifications.spec.ts`** - Notifications, Activities, and Audit Logs tests (notification center, activity feed, audit log viewing)
- **`members.spec.ts`** - Team member management tests (invitations, roles, permissions)
- **`docs.spec.ts`** - Documentation site tests
- **`fixtures.ts`** - Custom test fixtures and helpers

### Test Coverage

Current tests cover:
- ✅ Page rendering and content verification
- ✅ Form validation (HTML5 validation)
- ✅ Navigation between pages
- ✅ Protected route redirects
- ✅ Page metadata (titles)
- ✅ Authenticated user flows
- ✅ Dashboard navigation
- ✅ Organization management
- ✅ Project management
- ✅ Settings management
- ✅ User profile updates
- ✅ Billing and subscription management
- ✅ Usage tracking and limits
- ✅ Invoice management
- ✅ Stripe integration (checkout and portal)
- ✅ Super-admin features (user management, organizations, audit logs)
- ✅ Feature flags management
- ✅ Impersonation banner detection
- ✅ AI Chat functionality
- ✅ API Keys management (creation, revocation, rotation)
- ✅ Webhooks management (endpoints, events, deliveries)
- ✅ Notifications center (notification list, settings, preferences)
- ✅ Activity feed (activity tracking, filtering)
- ✅ Audit logs (log viewing, filtering, export)

Future enhancements:
- 🔲 Full CRUD operations with API integration
- 🔲 File upload tests
- 🔲 Advanced error handling scenarios
- 🔲 Multi-organization switching
- 🔲 Member invitation flows

## Authentication Fixtures

The test suite includes custom fixtures for authenticated testing:

### `authenticatedPage` Fixture

Provides a page that is already logged in with the seeded test user:

```typescript
test('should access protected page', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

**Test User Credentials:**
- Email: `admin@forgestack.dev`
- Password: `TestPassword123!`
- Organization: `ForgeStack Demo`

### Helper Functions

The `fixtures.ts` file provides several helper functions:

#### `createTestUser(prefix?)`
Creates a unique test user for parallel test execution:

```typescript
import { createTestUser } from './fixtures';

const user = createTestUser('mytest');
// Returns: { email: 'mytest-{timestamp}-{random}@forgestack.test', password: '...', name: '...' }
```

#### `loginAs(page, email, password)`
Performs login via the UI:

```typescript
import { loginAs } from './fixtures';

await loginAs(page, 'user@example.com', 'password123');
```

#### `mockApiResponse(page, endpoint, response, status?)`
Mocks API responses for testing:

```typescript
import { mockApiResponse } from './fixtures';

await mockApiResponse(page, '**/api/v1/projects', { projects: [] });
```

#### `setAuthCookie(page, sessionToken)`
Sets authentication cookie directly (faster than UI login):

```typescript
import { setAuthCookie } from './fixtures';

await setAuthCookie(page, 'session-token-here');
```

#### `waitForApiCall(page, urlPattern)`
Waits for a specific API call:

```typescript
import { waitForApiCall } from './fixtures';

await waitForApiCall(page, '/api/v1/projects');
```

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of `apps/web`.

Key settings:
- **Base URL**: `http://localhost:3000`
- **Test directory**: `./e2e`
- **Browser**: Chromium (can be extended to Firefox, WebKit)
- **Web server**: Automatically starts Next.js dev server before tests
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI (sequential), parallel locally

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from './fixtures';

test('should render page', async ({ page }) => {
  await page.goto('/your-page');
  await expect(page.getByText('Your Content')).toBeVisible();
});
```

### Authenticated Test Example

```typescript
import { test, expect } from './fixtures';

test('should access dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
```

### Test Organization

Use `test.describe()` blocks to group related tests:

```typescript
test.describe('Feature Name', () => {
  test.describe('Unauthenticated', () => {
    test('should redirect to login', async ({ page }) => {
      // Test unauthenticated access
    });
  });

  test.describe('Authenticated', () => {
    test('should show content', async ({ authenticatedPage: page }) => {
      // Test authenticated access
    });
  });
});
```

### Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements**: Use `toBeVisible()` instead of checking existence
3. **Test user flows**: Focus on what users actually do, not implementation details
4. **Keep tests independent**: Each test should be able to run in isolation
5. **Use fixtures**: Use `authenticatedPage` for authenticated tests
6. **Handle optional elements**: Use `.catch(() => false)` for elements that may not exist
7. **Descriptive test names**: Use clear, descriptive test names that explain what is being tested
8. **Group related tests**: Use `test.describe()` to organize tests logically

## CI/CD Integration

Tests are configured to run in CI with:
- **Retries**: 2 attempts on failure
- **Workers**: 1 (sequential execution to avoid conflicts)
- **Reporter**: HTML report generated in `playwright-report/`
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

### Running in CI

Ensure the following environment variables are set:
- `DATABASE_URL` - Connection string for test database
- `NEXT_PUBLIC_APP_URL` - Application URL (default: http://localhost:3000)

## Troubleshooting

### Tests failing locally

1. **Database not seeded**: Run `cd packages/db && pnpm db:seed`
2. **Dev server not running**: Let Playwright start it automatically or run `pnpm dev` manually
3. **Browsers not installed**: Run `pnpm exec playwright install`
4. **Authentication failing**: Verify test user exists in database with correct credentials
5. **Debug mode**: Run `pnpm test:e2e:debug` to see what's happening step-by-step

### Common Issues

**"Authentication failed: Still on login page"**
- The test user doesn't exist in the database
- Run `cd packages/db && pnpm db:seed` to create the test user
- Verify credentials match `TEST_USER` in `fixtures.ts`

**"Timeout waiting for URL"**
- The application might be slow to start
- Increase timeout in test or wait for server to be fully ready
- Check console for errors in the application

**"Element not found"**
- UI might have changed
- Update selectors to match current UI
- Use `page.pause()` in debug mode to inspect the page

### Viewing Test Reports

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

### Updating snapshots

If you have visual regression tests:
```bash
pnpm test:e2e --update-snapshots
```

## Test Data Management

### Seeded Test Data

The database seed script (`packages/db/src/seed.ts`) creates:
- **Super Admin**: `superadmin@forgestack.dev`
- **Test User**: `admin@forgestack.dev` (used by E2E tests)
- **Test Organization**: `ForgeStack Demo`
- **Sample Projects**: Website Redesign, Mobile App, API Integration

### Resetting Test Data

To reset the database and reseed:

```bash
cd packages/db
pnpm db:reset  # Drops and recreates database
pnpm db:migrate
pnpm db:seed
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [ForgeStack Documentation](../../docs/README.md)

