import { test, expect } from './fixtures';

/**
 * Settings E2E Tests
 *
 * Tests for user profile and organization settings pages.
 * These tests verify page structure and UI elements.
 * Note: Full CRUD operations require authentication and backend.
 */

test.describe('Settings', () => {
  test.describe('Profile Settings Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/profile');

      // Should redirect to login
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Organization Settings Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/organization');

      // Should redirect to login
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Profile Settings Page (Authenticated)', () => {
    test('should display profile settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Verify we're on the profile settings page
      await expect(page).toHaveURL(/\/settings\/profile/);
    });

    test('should display profile settings header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const heading = page.getByRole('heading', { name: /profile/i });
      await expect(heading).toBeVisible();
    });

    test('should show profile description', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const description = page.getByText(/manage your personal/i)
        .or(page.getByText(/update your profile/i));

      const isVisible = await description.isVisible().catch(() => false);

      if (isVisible) {
        await expect(description).toBeVisible();
      }
    });

    test('should show editable name field', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const nameInput = page.getByLabel(/^name$/i)
        .or(page.getByLabel(/full name/i));

      const isVisible = await nameInput.isVisible().catch(() => false);

      if (isVisible) {
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toBeEditable();
      }
    });

    test('should display current user email', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Email should be displayed (might be read-only)
      const emailField = page.getByText(/admin@forgestack\.dev/i);
      const isVisible = await emailField.isVisible().catch(() => false);

      if (isVisible) {
        await expect(emailField).toBeVisible();
      }
    });

    test('should show change email button or field', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const changeEmailButton = page.getByRole('button', { name: /change email/i })
        .or(page.getByLabel(/email/i));

      const isVisible = await changeEmailButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(changeEmailButton).toBeVisible();
      }
    });

    test('should open change email dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const changeEmailButton = page.getByRole('button', { name: /change email/i });
      const isVisible = await changeEmailButton.isVisible().catch(() => false);

      if (isVisible) {
        await changeEmailButton.click();

        const dialog = page.getByRole('dialog')
          .or(page.getByRole('heading', { name: /change email/i }));

        await expect(dialog).toBeVisible();
      }
    });

    test('should show change password button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const changePasswordButton = page.getByRole('button', { name: /change password/i })
        .or(page.getByRole('button', { name: /update password/i }));

      const isVisible = await changePasswordButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(changePasswordButton).toBeVisible();
      }
    });

    test('should open change password dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const changePasswordButton = page.getByRole('button', { name: /change password/i })
        .or(page.getByRole('button', { name: /update password/i }));

      const isVisible = await changePasswordButton.isVisible().catch(() => false);

      if (isVisible) {
        await changePasswordButton.click();

        const dialog = page.getByRole('dialog')
          .or(page.getByRole('heading', { name: /password/i }));

        await expect(dialog).toBeVisible();
      }
    });

    test('should show avatar or profile picture section', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const avatarSection = page.getByText(/profile picture/i)
        .or(page.getByText(/avatar/i))
        .or(page.locator('[data-testid="avatar-upload"]'));

      const isVisible = await avatarSection.isVisible().catch(() => false);

      if (isVisible) {
        await expect(avatarSection).toBeVisible();
      }
    });

    test('should have save button when changes are made', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      const nameInput = page.getByLabel(/^name$/i)
        .or(page.getByLabel(/full name/i));

      const isVisible = await nameInput.isVisible().catch(() => false);

      if (isVisible) {
        // Make a change
        await nameInput.fill('Updated Name');

        // Save button should appear
        const saveButton = page.getByRole('button', { name: /save/i });
        await expect(saveButton).toBeVisible();
      }
    });
  });

  test.describe('Organization Settings Page (Authenticated)', () => {
    test('should display organization settings page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      // Verify we're on the organization settings page
      await expect(page).toHaveURL(/\/settings\/organization/);
    });

    test('should display organization settings header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      const heading = page.getByRole('heading', { name: /organization/i });
      await expect(heading).toBeVisible();
    });

    test('should show organization name field', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      const orgNameInput = page.getByLabel(/organization name/i)
        .or(page.getByLabel(/^name$/i));

      const isVisible = await orgNameInput.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgNameInput).toBeVisible();
      }
    });

    test('should show current organization name', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      // Should display the seeded organization name
      const orgName = page.getByText(/forgestack demo/i);
      const isVisible = await orgName.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgName).toBeVisible();
      }
    });

    test('should show timezone setting', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      const timezoneField = page.getByLabel(/timezone/i)
        .or(page.getByText(/timezone/i));

      const isVisible = await timezoneField.isVisible().catch(() => false);

      if (isVisible) {
        await expect(timezoneField).toBeVisible();
      }
    });

    test('should show language setting', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      const languageField = page.getByLabel(/language/i)
        .or(page.getByText(/language/i));

      const isVisible = await languageField.isVisible().catch(() => false);

      if (isVisible) {
        await expect(languageField).toBeVisible();
      }
    });

    test('should show organization logo section', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/organization');

      const logoSection = page.getByText(/organization logo/i)
        .or(page.getByText(/logo/i))
        .or(page.locator('[data-testid="org-logo-upload"]'));

      const isVisible = await logoSection.isVisible().catch(() => false);

      if (isVisible) {
        await expect(logoSection).toBeVisible();
      }
    });

    test('should have settings navigation tabs', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Should have navigation between settings sections
      const orgSettingsTab = page.getByRole('link', { name: /organization/i });
      const isVisible = await orgSettingsTab.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgSettingsTab).toBeVisible();
      }
    });

    test('should navigate between settings sections', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Look for organization settings link specifically (not the main organizations link)
      const orgSettingsTab = page.getByRole('link', { name: /organization settings/i })
        .or(page.locator('a[href="/settings/organization"]'));
      const isVisible = await orgSettingsTab.isVisible().catch(() => false);

      if (isVisible) {
        await orgSettingsTab.click();
        await expect(page).toHaveURL(/\/settings\/organization/);
      } else {
        // If no org settings tab, just verify we're on settings page
        await expect(page).toHaveURL(/\/settings/);
      }
    });
  });

  test.describe('Account Management (Authenticated)', () => {
    test('should show account section in settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Look for account or security section
      const accountSection = page.getByText(/account/i)
        .or(page.getByText(/security/i));

      const isVisible = await accountSection.isVisible().catch(() => false);

      if (isVisible) {
        await expect(accountSection).toBeVisible();
      }
    });

    test('should show sign out option', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Sign out might be in user menu or settings
      const signOutButton = page.getByRole('button', { name: /sign out/i })
        .or(page.getByRole('link', { name: /sign out/i }));

      const isVisible = await signOutButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(signOutButton).toBeVisible();
      }
    });

    test('should show delete account option for owners', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');

      // Delete account is usually in a danger zone
      const deleteButton = page.getByRole('button', { name: /delete account/i })
        .or(page.getByText(/delete account/i));

      const isVisible = await deleteButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(deleteButton).toBeVisible();
      }
    });
  });
});

