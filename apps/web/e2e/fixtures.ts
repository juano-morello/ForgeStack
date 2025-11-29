import { test as base } from '@playwright/test';

/**
 * Custom Playwright Fixtures
 *
 * Extend the base test with custom fixtures for authentication,
 * API mocking, and other common test utilities.
 */

// Define custom fixture types
type CustomFixtures = {
  // Add custom fixtures here as needed
  // Example: authenticatedPage: Page;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  // Add custom fixture implementations here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   // Set up authentication
  //   await page.goto('/login');
  //   // ... perform login
  //   await use(page);
  // },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';

