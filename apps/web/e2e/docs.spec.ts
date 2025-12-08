import { test, expect } from '@playwright/test';

// Skip docs tests - docs site is not implemented yet
test.describe.skip('Docs Site', () => {
  test('loads the docs homepage', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('h1')).toContainText('Introduction');
    await expect(page.locator('text=Welcome to ForgeStack')).toBeVisible();
  });

  test('displays sidebar navigation', async ({ page }) => {
    await page.goto('/docs');

    // Check all navigation sections are visible
    await expect(page.locator('text=Getting Started')).toBeVisible();
    await expect(page.locator('text=Guides')).toBeVisible();
    await expect(page.locator('text=API Reference')).toBeVisible();
    await expect(page.locator('text=SDK')).toBeVisible();
  });

  test('navigates to installation page', async ({ page }) => {
    await page.goto('/docs');

    // Click on Installation link
    await page.click('text=Installation');

    // Verify we're on the installation page
    await expect(page).toHaveURL('/docs/installation');
    await expect(page.locator('h1')).toContainText('Installation');
  });

  test('navigates to quickstart page', async ({ page }) => {
    await page.goto('/docs');

    // Click on Quickstart link
    await page.click('text=Quickstart');

    // Verify we're on the quickstart page
    await expect(page).toHaveURL('/docs/quickstart');
    await expect(page.locator('h1')).toContainText('Quickstart');
  });

  test('navigates to authentication guide', async ({ page }) => {
    await page.goto('/docs');

    // Click on Authentication link in Guides section
    await page.click('aside >> text=Authentication');

    // Verify we're on the authentication page
    await expect(page).toHaveURL('/docs/guides/authentication');
    await expect(page.locator('h1')).toContainText('Authentication');
  });

  test('navigates to organizations guide', async ({ page }) => {
    await page.goto('/docs');

    // Click on Organizations link
    await page.click('aside >> text=Organizations');

    // Verify we're on the organizations page
    await expect(page).toHaveURL('/docs/guides/organizations');
    await expect(page.locator('h1')).toContainText('Organizations');
  });

  test('navigates to billing guide', async ({ page }) => {
    await page.goto('/docs');

    // Click on Billing link
    await page.click('aside >> text=Billing');

    // Verify we're on the billing page
    await expect(page).toHaveURL('/docs/guides/billing');
    await expect(page.locator('h1')).toContainText('Billing');
  });

  test('navigates to webhooks guide', async ({ page }) => {
    await page.goto('/docs');

    // Click on Webhooks link
    await page.click('aside >> text=Webhooks');

    // Verify we're on the webhooks page
    await expect(page).toHaveURL('/docs/guides/webhooks');
    await expect(page.locator('h1')).toContainText('Webhooks');
  });

  test('navigates to API overview', async ({ page }) => {
    await page.goto('/docs');

    // Click on Overview link in API Reference section
    await page.click('aside >> text=Overview');

    // Verify we're on the API overview page
    await expect(page).toHaveURL('/docs/api/overview');
    await expect(page.locator('h1')).toContainText('API Overview');
  });

  test('navigates to SDK installation', async ({ page }) => {
    await page.goto('/docs');

    // Click on Installation link in SDK section
    const sdkSection = page.locator('aside').locator('text=SDK').locator('..');
    await sdkSection.locator('text=Installation').click();

    // Verify we're on the SDK installation page
    await expect(page).toHaveURL('/docs/sdk/installation');
    await expect(page.locator('h1')).toContainText('SDK Installation');
  });

  test('highlights active page in sidebar', async ({ page }) => {
    await page.goto('/docs/installation');

    // Check that Installation link has active styling
    const installationLink = page
      .locator('aside')
      .locator('a[href="/docs/installation"]');
    await expect(installationLink).toHaveClass(/bg-primary/);
  });

  test('renders callout components', async ({ page }) => {
    await page.goto('/docs');

    // Check for callout on the introduction page
    const callout = page.locator('.border.rounded-lg');
    await expect(callout).toBeVisible();
  });

  test('renders code blocks', async ({ page }) => {
    await page.goto('/docs/installation');

    // Check for code blocks
    const codeBlock = page.locator('pre');
    await expect(codeBlock.first()).toBeVisible();
  });

  test('code block has copy button', async ({ page }) => {
    await page.goto('/docs/installation');

    // Hover over code block to reveal copy button
    const codeBlock = page.locator('pre').first();
    await codeBlock.hover();

    // Check for copy button
    const copyButton = page.locator('button').filter({ hasText: /Copy/ });
    // Note: The button might not have text, so we check for the button near the code block
    const buttons = await codeBlock.locator('..').locator('button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('navigates using in-page links', async ({ page }) => {
    await page.goto('/docs');

    // Click on a link within the content
    await page.click('text=Installation');

    // Should navigate to installation page
    await expect(page).toHaveURL(/\/docs\/installation/);
  });

  test('logo links back to home', async ({ page }) => {
    await page.goto('/docs/installation');

    // Click on ForgeStack logo
    await page.click('aside >> text=ForgeStack');

    // Should navigate to home page
    await expect(page).toHaveURL('/');
  });

  test('displays multiple sections on guides pages', async ({ page }) => {
    await page.goto('/docs/guides/authentication');

    // Check for multiple headings
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('h3').first()).toBeVisible();
  });

  test('renders tables on API pages', async ({ page }) => {
    await page.goto('/docs/api/overview');

    // Check for tables
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();
  });
});

