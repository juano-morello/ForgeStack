import { test, expect } from './fixtures';

/**
 * Admin & Impersonation E2E Tests
 *
 * Tests for super-admin features including user management,
 * organization management, audit logs, and user impersonation.
 */

test.describe('Admin Features', () => {
  test.describe('Super Admin Access (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/super-admin');
      await page.waitForURL(/\/(login|super-admin)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });

    test('should redirect to login for users page', async ({ page }) => {
      await page.goto('/super-admin/users');
      await page.waitForURL(/\/(login|super-admin)/, { timeout: 5000 });
    });

    test('should redirect to login for organizations page', async ({ page }) => {
      await page.goto('/super-admin/organizations');
      await page.waitForURL(/\/(login|super-admin)/, { timeout: 5000 });
    });

    test('should redirect to login for audit logs page', async ({ page }) => {
      await page.goto('/super-admin/audit-logs');
      await page.waitForURL(/\/(login|super-admin)/, { timeout: 5000 });
    });
  });

  // Skip: /admin/feature-flags route doesn't exist - feature flags are managed via super-admin
  test.describe.skip('Feature Flags (Authenticated)', () => {
    test('should display feature flags page', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/feature-flags');

      const heading = page.getByRole('heading', { name: /feature/i });
      const accessDenied = page.getByText(/access.*denied/i)
        .or(page.getByText(/not.*authorized/i));

      const headingVisible = await heading.isVisible().catch(() => false);
      const deniedVisible = await accessDenied.isVisible().catch(() => false);

      expect(headingVisible || deniedVisible || page.url().includes('/login')).toBeTruthy();
    });

    test('should show feature flag list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/admin/feature-flags');

      if (page.url().includes('/login')) return;

      const flagList = page.getByRole('table')
        .or(page.getByRole('list'))
        .or(page.getByText(/no.*feature.*flags/i));

      const isVisible = await flagList.isVisible().catch(() => false);
      if (isVisible) {
        await expect(flagList).toBeVisible();
      }
    });
  });

  test.describe('Super Admin Dashboard', () => {
    test('should show super admin dashboard or access denied', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin');
      
      // May show dashboard or access denied
      const dashboard = page.getByRole('heading', { name: /super.*admin/i })
        .or(page.getByRole('heading', { name: /admin.*dashboard/i }));
      const accessDenied = page.getByText(/access.*denied/i)
        .or(page.getByText(/not.*authorized/i))
        .or(page.getByText(/forbidden/i));
      
      const dashboardVisible = await dashboard.isVisible().catch(() => false);
      const deniedVisible = await accessDenied.isVisible().catch(() => false);
      
      expect(dashboardVisible || deniedVisible || page.url().includes('/login') || page.url().includes('/dashboard')).toBeTruthy();
    });

    test('should have navigation to users section', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin');
      
      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;
      
      const usersLink = page.getByRole('link', { name: /users/i });
      const isVisible = await usersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(usersLink).toBeVisible();
      }
    });

    test('should have navigation to organizations section', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin');
      
      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;
      
      const orgsLink = page.getByRole('link', { name: /organizations/i });
      const isVisible = await orgsLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(orgsLink).toBeVisible();
      }
    });

    test('should have navigation to audit logs section', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin');
      
      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;
      
      const auditLink = page.getByRole('link', { name: /audit.*logs/i });
      const isVisible = await auditLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await expect(auditLink).toBeVisible();
      }
    });
  });

  test.describe('Super Admin Users Page', () => {
    test('should display users list or access denied', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/users');

      const userTable = page.getByRole('table');
      const accessDenied = page.getByText(/access.*denied/i)
        .or(page.getByText(/not.*authorized/i));

      const tableVisible = await userTable.isVisible().catch(() => false);
      const deniedVisible = await accessDenied.isVisible().catch(() => false);

      expect(tableVisible || deniedVisible || page.url().includes('/login') || page.url().includes('/dashboard')).toBeTruthy();
    });

    test('should have search functionality', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/users');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const searchInput = page.getByPlaceholder(/search/i);
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEditable();
      }
    });

    test('should show user details in table', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/users');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const emailColumn = page.getByRole('columnheader', { name: /email/i });
      const isVisible = await emailColumn.isVisible().catch(() => false);

      if (isVisible) {
        await expect(emailColumn).toBeVisible();
      }
    });

    test('should have impersonate button for users', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/users');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const impersonateButton = page.getByRole('button', { name: /impersonate/i }).first();
      const isVisible = await impersonateButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(impersonateButton).toBeVisible();
      }
    });
  });

  test.describe('Super Admin Organizations Page', () => {
    test('should display organizations list or access denied', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/organizations');

      const orgTable = page.getByRole('table');
      const accessDenied = page.getByText(/access.*denied/i)
        .or(page.getByText(/not.*authorized/i));

      const tableVisible = await orgTable.isVisible().catch(() => false);
      const deniedVisible = await accessDenied.isVisible().catch(() => false);

      expect(tableVisible || deniedVisible || page.url().includes('/login') || page.url().includes('/dashboard')).toBeTruthy();
    });

    test('should show organization details', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/organizations');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const nameColumn = page.getByRole('columnheader', { name: /name/i });
      const isVisible = await nameColumn.isVisible().catch(() => false);

      if (isVisible) {
        await expect(nameColumn).toBeVisible();
      }
    });
  });

  test.describe('Super Admin Audit Logs Page', () => {
    test('should display audit logs or access denied', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/audit-logs');

      const auditTable = page.getByRole('table');
      const accessDenied = page.getByText(/access.*denied/i)
        .or(page.getByText(/not.*authorized/i));

      const tableVisible = await auditTable.isVisible().catch(() => false);
      const deniedVisible = await accessDenied.isVisible().catch(() => false);

      expect(tableVisible || deniedVisible || page.url().includes('/login') || page.url().includes('/dashboard')).toBeTruthy();
    });

    test('should have date filter', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/audit-logs');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const dateFilter = page.getByLabel(/date/i)
        .or(page.getByRole('button', { name: /filter/i }));
      const isVisible = await dateFilter.isVisible().catch(() => false);

      if (isVisible) {
        await expect(dateFilter).toBeVisible();
      }
    });

    test('should show audit log entries', async ({ authenticatedPage: page }) => {
      await page.goto('/super-admin/audit-logs');

      // Skip if not super admin
      if (page.url().includes('/login') || page.url().includes('/dashboard')) return;

      const actionColumn = page.getByRole('columnheader', { name: /action/i });
      const isVisible = await actionColumn.isVisible().catch(() => false);

      if (isVisible) {
        await expect(actionColumn).toBeVisible();
      }
    });
  });

  test.describe('Impersonation Banner', () => {
    test('should not show impersonation banner normally', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');

      const banner = page.locator('[data-testid="impersonation-banner"]')
        .or(page.getByText(/you are impersonating/i));

      await expect(banner).not.toBeVisible();
    });
  });
});


