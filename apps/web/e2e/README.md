# Playwright E2E Tests

This directory contains end-to-end tests for the ForgeStack web application using Playwright.

## Setup

Playwright is already installed and configured. To install browsers:

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
```

## Test Structure

### Current Test Files

- **`auth.spec.ts`** - Authentication page tests (login, signup, form validation)
- **`navigation.spec.ts`** - Navigation and routing tests (home page, protected routes, redirects)
- **`organizations.spec.ts`** - Organization page tests (unauthenticated access)
- **`projects.spec.ts`** - Project page tests (unauthenticated access)
- **`fixtures.ts`** - Custom test fixtures and helpers

### Test Coverage

Current tests focus on:
- ✅ Page rendering and content verification
- ✅ Form validation (HTML5 validation)
- ✅ Navigation between pages
- ✅ Protected route redirects
- ✅ Page metadata (titles)

Future tests should cover:
- 🔲 Authenticated user flows
- 🔲 CRUD operations (create, read, update, delete)
- 🔲 API integration tests
- 🔲 Error handling

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of `apps/web`.

Key settings:
- **Base URL**: `http://localhost:3000`
- **Test directory**: `./e2e`
- **Browser**: Chromium (can be extended to Firefox, WebKit)
- **Web server**: Automatically starts Next.js dev server before tests

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from './fixtures';

test('should render page', async ({ page }) => {
  await page.goto('/your-page');
  await expect(page.getByText('Your Content')).toBeVisible();
});
```

### Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements**: Use `toBeVisible()` instead of checking existence
3. **Test user flows**: Focus on what users actually do
4. **Keep tests independent**: Each test should be able to run in isolation
5. **Use fixtures**: Extend `fixtures.ts` for common setup (e.g., authentication)

## CI/CD Integration

Tests are configured to run in CI with:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Reporter: HTML report generated in `playwright-report/`

## Troubleshooting

### Tests failing locally

1. Make sure the dev server is running or let Playwright start it
2. Check that browsers are installed: `pnpm exec playwright install`
3. Run in debug mode to see what's happening: `pnpm test:e2e:debug`

### Updating snapshots

If you have visual regression tests:
```bash
pnpm test:e2e --update-snapshots
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)

