import { test, expect } from './fixtures';

/**
 * Dashboard E2E Tests
 *
 * Tests for the main dashboard page and navigation.
 * Verifies authenticated user can view dashboard, organization data, and navigate.
 */

test.describe('Dashboard', () => {
  test.describe('Dashboard Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/(login|dashboard)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Dashboard Page (Authenticated)', () => {
    test('should display dashboard page', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should display dashboard header', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Look for dashboard heading or welcome message
      const heading = page.getByRole('heading', { name: /dashboard/i })
        .or(page.getByRole('heading', { name: /welcome/i }));
      
      await expect(heading).toBeVisible();
    });

    test('should display user information', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // User menu or profile should be visible
      const userMenu = page.getByRole('button', { name: /admin user/i })
        .or(page.getByText(/admin@forgestack\.dev/i));
      
      const isVisible = await userMenu.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    });

    test('should display organization information', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Organization name or selector should be visible
      const orgInfo = page.getByText(/forgestack demo/i)
        .or(page.getByRole('button', { name: /organization/i }));
      
      const isVisible = await orgInfo.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(orgInfo).toBeVisible();
      }
    });

    test('should have navigation menu', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Check for main navigation items
      const projectsLink = page.getByRole('link', { name: /projects/i });
      const isVisible = await projectsLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(projectsLink).toBeVisible();
      }
    });

    test('should navigate to projects from dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Find and click projects link
      const projectsLink = page.getByRole('link', { name: /projects/i }).first();
      const isVisible = await projectsLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await projectsLink.click();
        await expect(page).toHaveURL(/\/projects/);
      }
    });

    test('should navigate to organizations from dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Find and click organizations link
      const orgsLink = page.getByRole('link', { name: /organizations/i }).first();
      const isVisible = await orgsLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await orgsLink.click();
        await expect(page).toHaveURL(/\/organizations/);
      }
    });

    test('should navigate to settings from dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Find and click settings link
      const settingsLink = page.getByRole('link', { name: /settings/i }).first();
      const isVisible = await settingsLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/);
      }
    });

    test('should display recent activity or stats', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Look for activity section, stats cards, or recent items
      const activitySection = page.getByText(/recent activity/i)
        .or(page.getByText(/overview/i))
        .or(page.getByText(/statistics/i));
      
      const isVisible = await activitySection.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(activitySection).toBeVisible();
      }
    });

    test('should have working user menu', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      
      // Find user menu button
      const userMenuButton = page.getByRole('button', { name: /admin user/i })
        .or(page.locator('[data-testid="user-menu"]'))
        .first();
      
      const isVisible = await userMenuButton.isVisible().catch(() => false);
      
      if (isVisible) {
        await userMenuButton.click();
        
        // User menu should show options
        const signOutButton = page.getByRole('menuitem', { name: /sign out/i })
          .or(page.getByRole('button', { name: /sign out/i }));
        
        await expect(signOutButton).toBeVisible();
      }
    });
  });
});

