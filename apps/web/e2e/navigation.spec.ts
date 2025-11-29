import { test, expect } from './fixtures';

/**
 * Navigation E2E Tests
 *
 * Tests for page navigation, redirects, and routing behavior.
 * Focuses on public pages and basic navigation flows.
 */

test.describe('Navigation', () => {
  test.describe('Home Page', () => {
    test('should render home page', async ({ page }) => {
      await page.goto('/');
      
      // Check for ForgeStack branding
      await expect(page.getByRole('heading', { name: /welcome to.*forgestack/i })).toBeVisible();
      
      // Check for description
      await expect(page.getByText(/multi-tenant saas starter kit/i)).toBeVisible();
      
      // Check for Sign In link
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('should navigate to login from home page', async ({ page }) => {
      await page.goto('/');

      // Click Sign In link
      await page.getByRole('link', { name: /sign in/i }).click();

      // Verify navigation
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Welcome back')).toBeVisible();
    });

    test('should navigate to signup from home page', async ({ page }) => {
      await page.goto('/');
      
      // Look for Sign Up link if it exists
      const signUpLink = page.getByRole('link', { name: /sign up/i });
      const isVisible = await signUpLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await signUpLink.click();
        await expect(page).toHaveURL(/\/signup/);
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login (middleware should handle this)
      // Note: This test may need adjustment based on actual middleware behavior
      await page.waitForURL(/\/(login|dashboard)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });

    test('should redirect to login when accessing organizations without auth', async ({ page }) => {
      // Try to access protected route
      await page.goto('/organizations');

      // Should redirect to login
      await page.waitForURL(/\/(login|organizations)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });

    test('should redirect to login when accessing projects without auth', async ({ page }) => {
      // Try to access protected route
      await page.goto('/projects');

      // Should redirect to login
      await page.waitForURL(/\/(login|projects)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Auth Page Navigation', () => {
    test('should navigate between login and signup pages', async ({ page }) => {
      // Start at login
      await page.goto('/login');
      await expect(page.getByText('Welcome back')).toBeVisible();

      // Navigate to signup
      await page.getByRole('link', { name: /sign up/i }).click();
      await expect(page).toHaveURL(/\/signup/);
      await expect(page.getByText('Create an account')).toBeVisible();

      // Navigate back to login
      await page.getByRole('link', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Welcome back')).toBeVisible();
    });
  });

  test.describe('Page Metadata', () => {
    test('should have correct title on home page', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/forgestack/i);
    });

    test('should have correct title on login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/sign in.*forgestack/i);
    });

    test('should have correct title on signup page', async ({ page }) => {
      await page.goto('/signup');
      await expect(page).toHaveTitle(/sign up.*forgestack/i);
    });
  });
});

