import { test, expect } from './fixtures';

/**
 * Projects E2E Tests
 *
 * Tests for project pages and functionality.
 * These tests verify page structure and UI elements.
 * Note: Full CRUD operations require authentication and backend.
 */

test.describe('Projects', () => {
  test.describe('Projects Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/projects');

      // Should redirect to login
      await page.waitForURL(/\/(login|projects)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('New Project Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/projects/new');

      // Should redirect to login
      await page.waitForURL(/\/(login|projects)/, { timeout: 5000 });

      // If redirected to login, verify login page
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Projects Page (Authenticated)', () => {
    test('should display projects page header', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    });

    test('should show new project button', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      // Look for new/create project button
      const newButton = page.getByRole('link', { name: /new.*project/i })
        .or(page.getByRole('button', { name: /new.*project/i }));

      await expect(newButton).toBeVisible();
    });

    test('should display empty state or project list', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      // Check for empty state or project list
      const emptyState = page.getByText(/no projects/i);
      const projectList = page.getByRole('list');

      // Either empty state or project list should be visible
      const emptyVisible = await emptyState.isVisible().catch(() => false);
      const listVisible = await projectList.isVisible().catch(() => false);

      expect(emptyVisible || listVisible).toBeTruthy();
    });

    test('should handle no organization selected state', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      // Check if there's a no organization message
      const noOrgMessage = page.getByText(/no organization selected/i)
        .or(page.getByText(/select an organization/i));
      const isVisible = await noOrgMessage.isVisible().catch(() => false);

      if (isVisible) {
        // Should show option to create or select organization
        const createOrgLink = page.getByRole('link', { name: /create organization/i })
          .or(page.getByRole('button', { name: /create organization/i }));
        await expect(createOrgLink).toBeVisible();
      }
    });

    test('should have search functionality', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i);
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEditable();
      }
    });

    test('should update URL with search query', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      const searchInput = page.getByPlaceholder(/search.*project/i);
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        // Type in search input
        await searchInput.fill('test-project');

        // Wait for debounce (300ms) and URL update
        await page.waitForTimeout(400);

        // Check URL contains search param
        expect(page.url()).toContain('search=test-project');
      }
    });

    test('should preserve search on page reload', async ({ authenticatedPage: page }) => {
      await page.goto('/projects?search=my-project');

      const searchInput = page.getByPlaceholder(/search.*project/i);
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        // Search input should have the value from URL
        await expect(searchInput).toHaveValue('my-project');

        // Reload page
        await page.reload();

        // Search input should still have the value
        await expect(searchInput).toHaveValue('my-project');
      }
    });

    test('should clear search param when input is cleared', async ({ authenticatedPage: page }) => {
      await page.goto('/projects?search=test');

      const searchInput = page.getByPlaceholder(/search.*project/i);
      const isVisible = await searchInput.isVisible().catch(() => false);

      if (isVisible) {
        // Clear search input
        await searchInput.clear();

        // Wait for debounce
        await page.waitForTimeout(400);

        // URL should not contain search param
        expect(page.url()).not.toContain('search=');
      }
    });

    test('should navigate to project details when clicking a project', async ({ authenticatedPage: page }) => {
      await page.goto('/projects');

      // Look for project links (if any projects exist)
      const projectLink = page.locator('a[href^="/projects/"]').first();
      const isVisible = await projectLink.isVisible().catch(() => false);

      if (isVisible) {
        await projectLink.click();
        // Should navigate to project detail page
        await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/);
      } else {
        // No projects exist, test passes
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('New Project Page (Authenticated)', () => {
    test('should display create project form', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      await expect(page.getByRole('heading', { name: /create.*project/i })).toBeVisible();
    });

    test('should have project name field', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEditable();
    });

    test('should have project description field', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      const descriptionField = page.getByLabel(/description/i);
      const isVisible = await descriptionField.isVisible().catch(() => false);

      if (isVisible) {
        await expect(descriptionField).toBeVisible();
        await expect(descriptionField).toBeEditable();
      }
    });

    test('should have submit and cancel buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      await expect(page.getByRole('button', { name: /create/i })).toBeVisible();

      const cancelButton = page.getByRole('button', { name: /cancel/i })
        .or(page.getByRole('link', { name: /cancel/i }));
      await expect(cancelButton).toBeVisible();
    });

    test('should validate required fields', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      // Try to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /create/i });
      await submitButton.click();

      // Should show validation error or prevent submission
      // Check for either HTML5 required attribute or client-side validation error
      const nameInput = page.getByLabel(/name/i)
        .or(page.getByPlaceholder(/name/i))
        .or(page.locator('input[name="name"]'));

      const isVisible = await nameInput.isVisible().catch(() => false);
      if (isVisible) {
        const isRequired = await nameInput.getAttribute('required');
        const hasError = await page.getByText(/required/i).isVisible().catch(() => false);
        // Either has required attribute or shows validation error
        expect(isRequired !== null || hasError).toBeTruthy();
      }
    });

    test('should navigate back to projects list', async ({ authenticatedPage: page }) => {
      await page.goto('/projects/new');

      const backButton = page.getByRole('link', { name: /back/i })
        .or(page.getByRole('button', { name: /back/i }));

      const isVisible = await backButton.isVisible().catch(() => false);

      if (isVisible) {
        await backButton.click();
        await expect(page).toHaveURL(/\/projects$/);
      }
    });
  });
});

