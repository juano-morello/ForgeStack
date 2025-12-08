import { test as base, expect as baseExpect, type Page } from '@playwright/test';

/**
 * Custom Playwright Fixtures
 *
 * Extend the base test with custom fixtures for authentication,
 * API mocking, and other common test utilities.
 */

/**
 * Test user credentials
 * These should match a seeded user in the database or be created dynamically
 */
export const TEST_USER = {
  email: 'admin@forgestack.dev',
  password: 'TestPassword123',
  name: 'Admin User',
};

/**
 * Helper: Create a unique test user
 * Generates unique email for parallel test execution
 */
export function createTestUser(prefix = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `${prefix}-${timestamp}-${random}@forgestack.test`,
    password: 'TestPassword123',
    name: `Test User ${timestamp}`,
  };
}

/**
 * Helper: Login via UI
 * Performs login through the login form
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');

  // Wait for login form to be ready
  await page.waitForSelector('input[name="email"]', { state: 'visible' });

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (either dashboard or onboarding)
  await page.waitForURL(/\/(dashboard|onboarding|projects|organizations)/, {
    timeout: 10000
  });
}

/**
 * Helper: Mock API response
 * Intercepts API calls and returns mock data
 */
export async function mockApiResponse(
  page: Page,
  endpoint: string,
  response: unknown,
  status = 200
): Promise<void> {
  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper: Set authentication cookie directly
 * Bypasses UI login by setting the session cookie
 * Useful for faster test setup when you don't need to test login flow
 */
export async function setAuthCookie(
  page: Page,
  sessionToken: string
): Promise<void> {
  await page.context().addCookies([
    {
      name: 'better-auth.session_token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
  ]);
}

/**
 * Helper: Wait for API call
 * Waits for a specific API endpoint to be called
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
}

// Define custom fixture types
type CustomFixtures = {
  /**
   * Authenticated page fixture
   * Provides a page that is already logged in with a test user
   */
  authenticatedPage: Page;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  /**
   * Authenticated page fixture
   *
   * This fixture:
   * 1. Uses the seeded test user (admin@forgestack.dev)
   * 2. Performs login via the UI
   * 3. Provides an authenticated page context
   *
   * Note: Requires the database to be seeded with the test user.
   * Run: cd packages/db && pnpm db:seed
   */
  authenticatedPage: async ({ page }, use) => {
    // Perform login with seeded test user
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Verify we're authenticated by checking we're not on login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error(
        'Authentication failed: Still on login page. ' +
        'Ensure database is seeded with test user (pnpm db:seed)'
      );
    }

    // Provide the authenticated page to the test
    await use(page);

    // Cleanup: Sign out after test
    // This is optional but helps keep tests isolated
    try {
      // Try to sign out if we're still on an authenticated page
      if (!page.isClosed()) {
        await page.goto('/api/auth/sign-out', {
          waitUntil: 'networkidle',
          timeout: 5000
        }).catch(() => {
          // Ignore errors during cleanup
        });
      }
    } catch {
      // Ignore cleanup errors
    }
  },
});

/**
 * Re-export expect for convenience
 */
export const expect = baseExpect;

