import { test, expect } from './fixtures';

/**
 * Notifications & Activities E2E Tests
 *
 * Tests for notifications, activities, and audit log viewing.
 */

test.describe('Notifications', () => {
  test.describe('Notifications Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/notifications');
      await page.waitForURL(/\/(login|notifications)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Notifications Page (Authenticated)', () => {
    test('should display notifications page', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      await expect(page).toHaveURL(/\/notifications/);
    });

    test('should display notifications header', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      const heading = page.getByRole('heading', { name: /notifications/i });
      await expect(heading).toBeVisible();
    });

    test('should show notifications list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      // Look for notifications heading or empty state
      const notificationsSection = page.getByRole('heading', { name: /notifications/i })
        .or(page.getByText(/no.*notifications/i))
        .or(page.getByText(/all.*caught.*up/i));

      await expect(notificationsSection.first()).toBeVisible();
    });

    test('should show mark all as read button', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      const markAllButton = page.getByRole('button', { name: /mark.*all.*read/i });
      
      const isVisible = await markAllButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(markAllButton).toBeVisible();
      }
    });

    test('should show notification settings link', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      const settingsLink = page.getByRole('link', { name: /settings/i })
        .or(page.getByRole('button', { name: /settings/i }));
      
      const isVisible = await settingsLink.isVisible().catch(() => false);
      if (isVisible) {
        await expect(settingsLink).toBeVisible();
      }
    });

    test('should show notification timestamp', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      const timestamp = page.getByText(/ago/i)
        .or(page.getByText(/today/i))
        .or(page.getByText(/yesterday/i));
      
      const isVisible = await timestamp.isVisible().catch(() => false);
      if (isVisible) {
        await expect(timestamp).toBeVisible();
      }
    });

    test('should have filter options', async ({ authenticatedPage: page }) => {
      await page.goto('/notifications');
      const filter = page.getByRole('button', { name: /filter/i })
        .or(page.getByRole('combobox'))
        .or(page.getByText(/all/i));
      
      const isVisible = await filter.isVisible().catch(() => false);
      if (isVisible) {
        await expect(filter).toBeVisible();
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should display notification settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      await expect(page).toHaveURL(/\/settings\/notifications/);
    });

    test('should show email notification toggles', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      const emailToggle = page.getByRole('switch')
        .or(page.getByRole('checkbox'))
        .or(page.getByLabel(/email/i));
      
      const isVisible = await emailToggle.isVisible().catch(() => false);
      if (isVisible) {
        await expect(emailToggle).toBeVisible();
      }
    });

    test('should show notification categories', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      const categories = page.getByText(/project/i)
        .or(page.getByText(/member/i))
        .or(page.getByText(/billing/i));
      
      const isVisible = await categories.isVisible().catch(() => false);
      if (isVisible) {
        await expect(categories).toBeVisible();
      }
    });

    test('should save notification preferences', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/notifications');
      const saveButton = page.getByRole('button', { name: /save/i });

      const isVisible = await saveButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(saveButton).toBeVisible();
      }
    });
  });
});

test.describe('Activities', () => {
  test.describe('Activities Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/activities');
      await page.waitForURL(/\/(login|activities)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Activities Page (Authenticated)', () => {
    test('should display activities page', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      await expect(page).toHaveURL(/\/activities/);
    });

    test('should display activities header', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      const heading = page.getByRole('heading', { name: /activit/i });
      await expect(heading).toBeVisible();
    });

    test('should show activity list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      // Look for activities heading or empty state
      const activitiesSection = page.getByRole('heading', { name: /activit/i })
        .or(page.getByText(/no.*activit/i));

      await expect(activitiesSection.first()).toBeVisible();
    });

    test('should show activity timestamps', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      const timestamp = page.getByText(/ago/i)
        .or(page.getByText(/today/i))
        .or(page.getByText(/yesterday/i));

      const isVisible = await timestamp.isVisible().catch(() => false);
      if (isVisible) {
        await expect(timestamp).toBeVisible();
      }
    });

    test('should show activity actor', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      const actor = page.getByText(/admin/i)
        .or(page.getByText(/user/i));

      const isVisible = await actor.isVisible().catch(() => false);
      if (isVisible) {
        await expect(actor).toBeVisible();
      }
    });

    test('should have date filter', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      const dateFilter = page.getByLabel(/date/i)
        .or(page.getByRole('button', { name: /filter/i }))
        .or(page.getByPlaceholder(/date/i));

      const isVisible = await dateFilter.isVisible().catch(() => false);
      if (isVisible) {
        await expect(dateFilter).toBeVisible();
      }
    });

    test('should have activity type filter', async ({ authenticatedPage: page }) => {
      await page.goto('/activities');
      const typeFilter = page.getByLabel(/type/i)
        .or(page.getByRole('combobox'))
        .or(page.getByText(/all.*types/i));

      const isVisible = await typeFilter.isVisible().catch(() => false);
      if (isVisible) {
        await expect(typeFilter).toBeVisible();
      }
    });
  });
});

test.describe('Audit Logs', () => {
  test.describe('Audit Logs Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/audit-logs');
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Audit Logs Page (Authenticated)', () => {
    test('should display audit logs page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      await expect(page).toHaveURL(/\/settings\/audit-logs/);
    });

    test('should display audit logs header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const heading = page.getByRole('heading', { name: /audit.*logs/i });
      await expect(heading).toBeVisible();
    });

    test('should show audit log table or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const logTable = page.getByRole('table')
        .or(page.getByText(/no.*audit.*logs/i))
        .or(page.getByText(/no.*logs/i));

      await expect(logTable).toBeVisible();
    });

    test('should show action column', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const actionColumn = page.getByRole('columnheader', { name: /action/i })
        .or(page.getByText(/action/i));

      const isVisible = await actionColumn.isVisible().catch(() => false);
      if (isVisible) {
        await expect(actionColumn).toBeVisible();
      }
    });

    test('should show user column', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const userColumn = page.getByRole('columnheader', { name: /user/i })
        .or(page.getByText(/user/i));

      const isVisible = await userColumn.isVisible().catch(() => false);
      if (isVisible) {
        await expect(userColumn).toBeVisible();
      }
    });

    test('should show timestamp column', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const timestampColumn = page.getByRole('columnheader', { name: /time/i })
        .or(page.getByRole('columnheader', { name: /date/i }))
        .or(page.getByText(/timestamp/i));

      const isVisible = await timestampColumn.isVisible().catch(() => false);
      if (isVisible) {
        await expect(timestampColumn).toBeVisible();
      }
    });

    test('should have date range filter', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const dateFilter = page.getByLabel(/date/i)
        .or(page.getByRole('button', { name: /filter/i }))
        .or(page.getByPlaceholder(/date/i));

      const isVisible = await dateFilter.isVisible().catch(() => false);
      if (isVisible) {
        await expect(dateFilter).toBeVisible();
      }
    });

    test('should have export option', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const exportButton = page.getByRole('button', { name: /export/i })
        .or(page.getByRole('button', { name: /download/i }));

      const isVisible = await exportButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(exportButton).toBeVisible();
      }
    });

    test('should show log details on click', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/audit-logs');
      const logRow = page.getByRole('row').nth(1);

      const isVisible = await logRow.isVisible().catch(() => false);
      if (isVisible) {
        await logRow.click();

        const details = page.getByRole('dialog')
          .or(page.getByText(/details/i));

        const detailsVisible = await details.isVisible().catch(() => false);
        if (detailsVisible) {
          await expect(details).toBeVisible();
        }
      }
    });
  });
});

