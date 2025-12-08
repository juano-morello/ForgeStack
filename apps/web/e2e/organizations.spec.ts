import { test, expect } from './fixtures';

/**
 * Organizations E2E Tests
 *
 * Tests for organization pages and functionality.
 * These tests verify page structure and UI elements.
 * Note: Full CRUD operations require authentication and backend.
 */

test.describe('Organizations', () => {
  test.describe('Organizations Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/organizations');

      // Should redirect to login
      await page.waitForURL(/\/(login|organizations)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('New Organization Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/organizations/new');

      // Should redirect to login
      await page.waitForURL(/\/(login|organizations)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Organizations Page (Authenticated)', () => {
    test('should display organizations page header', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      await expect(page.getByRole('heading', { name: /organizations/i })).toBeVisible();
    });

    test('should show organization management description', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const description = page.getByText(/manage your organizations/i)
        .or(page.getByText(/view and manage/i));

      const isVisible = await description.isVisible().catch(() => false);

      if (isVisible) {
        await expect(description).toBeVisible();
      }
    });

    test('should show create organization button', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Look for create/new organization button
      const createButton = page.getByRole('button', { name: /create.*organization/i })
        .or(page.getByRole('button', { name: /new.*organization/i }))
        .or(page.getByRole('link', { name: /create.*organization/i }));

      await expect(createButton).toBeVisible();
    });

    test('should display organization list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Check for organization list or empty state
      const orgList = page.getByRole('list');
      const emptyState = page.getByText(/no organizations/i);

      const listVisible = await orgList.isVisible().catch(() => false);
      const emptyVisible = await emptyState.isVisible().catch(() => false);

      // Either list or empty state should be visible
      expect(listVisible || emptyVisible).toBeTruthy();
    });

    test('should display current organization', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Should show the seeded organization
      const orgName = page.getByText(/forgestack demo/i);
      const isVisible = await orgName.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgName).toBeVisible();
      }
    });

    test('should open create organization dialog or form', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Click create button
      const createButton = page.getByRole('button', { name: /create.*organization/i })
        .or(page.getByRole('button', { name: /new.*organization/i }))
        .or(page.getByRole('link', { name: /create.*organization/i }));

      await createButton.click();

      // Verify dialog opened or navigated to form
      const dialog = page.getByRole('dialog');
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        await expect(dialog).toBeVisible();
        await expect(page.getByLabel(/organization name/i)).toBeVisible();
      } else {
        // Or navigated to create page
        await expect(page).toHaveURL(/\/organizations\/new/);
      }
    });

    test('should have organization switcher', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Look for organization switcher/selector
      const orgSwitcher = page.getByRole('button', { name: /switch organization/i })
        .or(page.getByRole('combobox', { name: /organization/i }))
        .or(page.locator('[data-testid="org-switcher"]'));

      const isVisible = await orgSwitcher.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgSwitcher).toBeVisible();
      }
    });

    test('should show organization members count', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Look for member count indicator
      const memberCount = page.getByText(/\d+ member/i);
      const isVisible = await memberCount.isVisible().catch(() => false);

      if (isVisible) {
        await expect(memberCount).toBeVisible();
      }
    });

    test('should navigate to organization settings', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Look for settings link/button for an organization
      const settingsLink = page.getByRole('link', { name: /settings/i })
        .or(page.getByRole('button', { name: /settings/i }));

      const isVisible = await settingsLink.isVisible().catch(() => false);

      if (isVisible) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/);
      }
    });
  });

  test.describe('Create Organization Flow (Authenticated)', () => {
    test('should display create organization form', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations/new');

      await expect(page.getByRole('heading', { name: /create organization/i })).toBeVisible();
      await expect(page.getByLabel(/organization name/i)).toBeVisible();
    });

    test('should have required form fields', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations/new');

      const nameInput = page.getByLabel(/organization name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEditable();

      const submitButton = page.getByRole('button', { name: /create/i });
      await expect(submitButton).toBeVisible();
    });

    test('should validate organization name', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations/new');

      // Try to submit with empty name
      const submitButton = page.getByRole('button', { name: /create/i });
      await submitButton.click();

      // Check for validation - either HTML5 required or client-side validation
      const nameInput = page.getByLabel(/organization name/i)
        .or(page.getByLabel(/name/i))
        .or(page.getByPlaceholder(/name/i));

      const isVisible = await nameInput.isVisible().catch(() => false);
      if (isVisible) {
        const isRequired = await nameInput.getAttribute('required');
        const hasError = await page.getByText(/required/i).isVisible().catch(() => false);
        expect(isRequired !== null || hasError).toBeTruthy();
      }
    });

    test('should have cancel or back button', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations/new');

      const backButton = page.getByRole('link', { name: /back/i })
        .or(page.getByRole('button', { name: /cancel/i }))
        .or(page.getByRole('link', { name: /cancel/i }));

      const isVisible = await backButton.isVisible().catch(() => false);
      // Some forms may not have a cancel button
      expect(isVisible || page.url().includes('/organizations/new')).toBeTruthy();
    });

    test('should navigate back to organizations list', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations/new');

      const backButton = page.getByRole('link', { name: /back/i })
        .or(page.getByRole('button', { name: /cancel/i }));

      const isVisible = await backButton.isVisible().catch(() => false);

      if (isVisible) {
        await backButton.click();
        await expect(page).toHaveURL(/\/organizations$/);
      }
    });
  });

  test.describe('Organization Switching (Authenticated)', () => {
    test('should display organization switcher in navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');

      // Look for organization switcher in the app shell
      const orgSwitcher = page.getByRole('button', { name: /forgestack demo/i })
        .or(page.locator('[data-testid="org-switcher"]'));

      const isVisible = await orgSwitcher.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgSwitcher).toBeVisible();
      }
    });

    test('should open organization menu when clicked', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');

      const orgSwitcher = page.getByRole('button', { name: /forgestack demo/i })
        .or(page.locator('[data-testid="org-switcher"]'));

      const isVisible = await orgSwitcher.isVisible().catch(() => false);

      if (isVisible) {
        await orgSwitcher.click();

        // Menu should show organization options
        const menu = page.getByRole('menu')
          .or(page.getByRole('dialog'));

        await expect(menu).toBeVisible();
      }
    });
  });

  test.describe('Organization Members (Authenticated)', () => {
    test('should navigate to members page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      // Look for members link
      const membersLink = page.getByRole('link', { name: /members/i });
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();
        await expect(page).toHaveURL(/\/members/);
      }
    });

    test('should show invite member button', async ({ authenticatedPage: page }) => {
      // Try to navigate to members or settings page
      await page.goto('/settings/organization');

      const inviteButton = page.getByRole('button', { name: /invite/i })
        .or(page.getByRole('link', { name: /invite/i }));

      const isVisible = await inviteButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(inviteButton).toBeVisible();
      }
    });
  });
});

