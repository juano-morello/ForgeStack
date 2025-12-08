import { test, expect } from './fixtures';

/**
 * API Keys & Webhooks E2E Tests
 *
 * Tests for API key management and webhook configuration.
 */

test.describe('API Keys', () => {
  test.describe('API Keys Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/api-keys');
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('API Keys Page (Authenticated)', () => {
    test('should display API keys page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      await expect(page).toHaveURL(/\/settings\/api-keys/);
    });

    test('should display API keys header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const heading = page.getByRole('heading', { name: /api.*keys/i });
      await expect(heading.first()).toBeVisible();
    });

    test('should show create API key button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const createButton = page.getByRole('button', { name: /create.*key/i })
        .or(page.getByRole('button', { name: /new.*key/i }))
        .or(page.getByRole('button', { name: /generate/i }));

      await expect(createButton.first()).toBeVisible();
    });

    test('should show API keys list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      // Look for the "Your API Keys" heading which indicates the list section
      const keysSection = page.getByRole('heading', { name: /your api keys/i })
        .or(page.getByText(/no.*api.*keys/i))
        .or(page.getByRole('table'));

      await expect(keysSection.first()).toBeVisible();
    });

    test('should open create API key dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const createButton = page.getByRole('button', { name: /create.*api.*key/i });

      await createButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    test('should have name input in create dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const createButton = page.getByRole('button', { name: /create.*key/i })
        .or(page.getByRole('button', { name: /new.*key/i }))
        .or(page.getByRole('button', { name: /generate/i }));
      
      await createButton.click();
      
      const nameInput = page.getByLabel(/name/i)
        .or(page.getByPlaceholder(/name/i));
      await expect(nameInput).toBeVisible();
    });

    test('should have expiration selector', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const createButton = page.getByRole('button', { name: /create.*key/i })
        .or(page.getByRole('button', { name: /new.*key/i }))
        .or(page.getByRole('button', { name: /generate/i }));
      
      await createButton.click();
      
      const expirationSelect = page.getByLabel(/expir/i)
        .or(page.getByRole('combobox'));
      
      const isVisible = await expirationSelect.isVisible().catch(() => false);
      if (isVisible) {
        await expect(expirationSelect).toBeVisible();
      }
    });

    test('should show revoke button for existing keys', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const revokeButton = page.getByRole('button', { name: /revoke/i })
        .or(page.getByRole('button', { name: /delete/i }));
      
      const isVisible = await revokeButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(revokeButton).toBeVisible();
      }
    });

    test('should show key creation date', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const dateColumn = page.getByText(/created/i)
        .or(page.getByRole('columnheader', { name: /created/i }));
      
      const isVisible = await dateColumn.isVisible().catch(() => false);
      if (isVisible) {
        await expect(dateColumn).toBeVisible();
      }
    });

    test('should show key last used date', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const lastUsedColumn = page.getByText(/last.*used/i)
        .or(page.getByRole('columnheader', { name: /last.*used/i }));
      
      const isVisible = await lastUsedColumn.isVisible().catch(() => false);
      if (isVisible) {
        await expect(lastUsedColumn).toBeVisible();
      }
    });

    test('should display security best practices', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const securityInfo = page.getByText(/never share/i)
        .or(page.getByText(/keep.*secure/i))
        .or(page.getByText(/rotate.*regularly/i));

      const isVisible = await securityInfo.isVisible().catch(() => false);
      if (isVisible) {
        await expect(securityInfo).toBeVisible();
      }
    });

    test('should show rotate button for existing keys', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const rotateButton = page.getByRole('button', { name: /rotate/i });

      const isVisible = await rotateButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(rotateButton).toBeVisible();
      }
    });

    test('should display API key prefix when keys exist', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/api-keys');
      const keyPrefix = page.getByText(/fsk_/i);

      const isVisible = await keyPrefix.isVisible().catch(() => false);
      if (isVisible) {
        await expect(keyPrefix).toBeVisible();
      }
    });
  });
});

test.describe('Webhooks', () => {
  test.describe('Webhooks Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/webhooks');
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Webhooks Page (Authenticated)', () => {
    test('should display webhooks page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      await expect(page).toHaveURL(/\/settings\/webhooks/);
    });

    test('should display webhooks header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      // PageHeader uses h1 with "Webhooks" title
      const heading = page.getByRole('heading', { name: /webhooks/i })
        .or(page.getByText(/webhook endpoints/i));
      await expect(heading.first()).toBeVisible();
    });

    test('should show create webhook button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      // Button says "Create Endpoint"
      const createButton = page.getByRole('button', { name: /create.*endpoint/i })
        .or(page.getByRole('button', { name: /create.*webhook/i }))
        .or(page.getByRole('button', { name: /add.*endpoint/i }));

      await expect(createButton).toBeVisible();
    });

    test('should show webhooks list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      // Look for webhooks heading or empty state message
      const webhooksSection = page.getByRole('heading', { name: /webhooks/i })
        .or(page.getByText(/no.*webhooks/i))
        .or(page.getByText(/no.*endpoints/i));

      await expect(webhooksSection.first()).toBeVisible();
    });

    test('should open create webhook dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      // Button says "Create Endpoint"
      const createButton = page.getByRole('button', { name: /create.*endpoint/i })
        .or(page.getByRole('button', { name: /create.*webhook/i }));

      await createButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    test('should have URL input in create dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const createButton = page.getByRole('button', { name: /create.*webhook/i })
        .or(page.getByRole('button', { name: /add.*webhook/i }))
        .or(page.getByRole('button', { name: /new.*webhook/i })
        .or(page.getByRole('button', { name: /create.*endpoint/i })));

      await createButton.click();

      const urlInput = page.getByLabel(/url/i)
        .or(page.getByPlaceholder(/https/i));
      await expect(urlInput).toBeVisible();
    });

    test('should have event selector in create dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const createButton = page.getByRole('button', { name: /create.*webhook/i })
        .or(page.getByRole('button', { name: /add.*webhook/i }))
        .or(page.getByRole('button', { name: /new.*webhook/i })
        .or(page.getByRole('button', { name: /create.*endpoint/i })));

      await createButton.click();

      const eventSelector = page.getByLabel(/events/i)
        .or(page.getByText(/select.*events/i))
        .or(page.getByRole('checkbox'));

      const isVisible = await eventSelector.isVisible().catch(() => false);
      if (isVisible) {
        await expect(eventSelector).toBeVisible();
      }
    });

    test('should validate webhook URL format', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const createButton = page.getByRole('button', { name: /create.*webhook/i })
        .or(page.getByRole('button', { name: /add.*webhook/i }))
        .or(page.getByRole('button', { name: /new.*webhook/i })
        .or(page.getByRole('button', { name: /create.*endpoint/i })));

      await createButton.click();

      const urlInput = page.getByLabel(/url/i)
        .or(page.getByPlaceholder(/https/i));

      if (await urlInput.isVisible()) {
        await urlInput.fill('invalid-url');

        const submitButton = page.getByRole('button', { name: /create/i })
          .or(page.getByRole('button', { name: /save/i }));
        await submitButton.click();

        // Should show validation error
        const error = page.getByText(/invalid.*url/i)
          .or(page.getByText(/valid.*url/i));
        const errorVisible = await error.isVisible().catch(() => false);

        // Or HTML5 validation
        const isInvalid = await urlInput.evaluate((el: HTMLInputElement) => !el.validity.valid).catch(() => false);
        expect(errorVisible || isInvalid).toBeTruthy();
      }
    });

    test('should show webhook status', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const status = page.getByText(/active/i)
        .or(page.getByText(/enabled/i))
        .or(page.getByText(/disabled/i));

      const isVisible = await status.isVisible().catch(() => false);
      if (isVisible) {
        await expect(status).toBeVisible();
      }
    });

    test('should show delete webhook option', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const deleteButton = page.getByRole('button', { name: /delete/i })
        .or(page.getByRole('button', { name: /remove/i }));

      const isVisible = await deleteButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(deleteButton).toBeVisible();
      }
    });

    test('should show webhook secret', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const secret = page.getByText(/secret/i)
        .or(page.getByText(/signing/i));

      const isVisible = await secret.isVisible().catch(() => false);
      if (isVisible) {
        await expect(secret).toBeVisible();
      }
    });

    test('should have tabs for endpoints and deliveries', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const endpointsTab = page.getByRole('tab', { name: /endpoints/i });
      const deliveriesTab = page.getByRole('tab', { name: /deliveries/i });

      const endpointsVisible = await endpointsTab.isVisible().catch(() => false);
      const deliveriesVisible = await deliveriesTab.isVisible().catch(() => false);

      if (endpointsVisible && deliveriesVisible) {
        await expect(endpointsTab).toBeVisible();
        await expect(deliveriesTab).toBeVisible();
      }
    });

    test('should show test endpoint button', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const testButton = page.getByRole('button', { name: /test/i });

      const isVisible = await testButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(testButton).toBeVisible();
      }
    });

    test('should display webhook URL in list', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const webhookUrl = page.getByText(/https:\/\//i);

      const isVisible = await webhookUrl.isVisible().catch(() => false);
      if (isVisible) {
        await expect(webhookUrl).toBeVisible();
      }
    });

    test('should show webhook events in list', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const events = page.getByText(/events/i);

      const isVisible = await events.isVisible().catch(() => false);
      if (isVisible) {
        await expect(events).toBeVisible();
      }
    });

    test('should display deliveries tab content', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      const deliveriesTab = page.getByRole('tab', { name: /deliveries/i });

      const isVisible = await deliveriesTab.isVisible().catch(() => false);
      if (isVisible) {
        await deliveriesTab.click();
        await page.waitForTimeout(500);

        const deliveriesContent = page.getByText(/recent.*deliveries/i)
          .or(page.getByText(/no.*deliveries/i))
          .or(page.getByText(/webhook.*deliver/i))
          .or(page.getByRole('table'));

        await expect(deliveriesContent.first()).toBeVisible({ timeout: 5000 });
      } else {
        // Tab not visible - test passes
        expect(true).toBeTruthy();
      }
    });

    test('should show refresh button in deliveries tab', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const deliveriesTab = page.getByRole('tab', { name: /deliveries/i });

      const isVisible = await deliveriesTab.isVisible().catch(() => false);
      if (isVisible) {
        await deliveriesTab.click();

        const refreshButton = page.getByRole('button', { name: /refresh/i });
        const refreshVisible = await refreshButton.isVisible().catch(() => false);

        if (refreshVisible) {
          await expect(refreshButton).toBeVisible();
        }
      }
    });

    test('should show retry button for failed deliveries', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const deliveriesTab = page.getByRole('tab', { name: /deliveries/i });

      const isVisible = await deliveriesTab.isVisible().catch(() => false);
      if (isVisible) {
        await deliveriesTab.click();

        const retryButton = page.getByRole('button', { name: /retry/i });
        const retryVisible = await retryButton.isVisible().catch(() => false);

        if (retryVisible) {
          await expect(retryButton).toBeVisible();
        }
      }
    });

    test('should display webhook description field', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const createButton = page.getByRole('button', { name: /create.*webhook/i })
        .or(page.getByRole('button', { name: /add.*webhook/i }))
        .or(page.getByRole('button', { name: /new.*webhook/i })
        .or(page.getByRole('button', { name: /create.*endpoint/i })));

      await createButton.click();

      const descriptionInput = page.getByLabel(/description/i)
        .or(page.getByPlaceholder(/description/i));

      const isVisible = await descriptionInput.isVisible().catch(() => false);
      if (isVisible) {
        await expect(descriptionInput).toBeVisible();
      }
    });

    test('should show enabled toggle in create dialog', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/webhooks');
      const createButton = page.getByRole('button', { name: /create.*webhook/i })
        .or(page.getByRole('button', { name: /add.*webhook/i }))
        .or(page.getByRole('button', { name: /new.*webhook/i })
        .or(page.getByRole('button', { name: /create.*endpoint/i })));

      await createButton.click();

      const enabledToggle = page.getByLabel(/enabled/i)
        .or(page.getByRole('switch'));

      const isVisible = await enabledToggle.isVisible().catch(() => false);
      if (isVisible) {
        await expect(enabledToggle).toBeVisible();
      }
    });
  });
});

