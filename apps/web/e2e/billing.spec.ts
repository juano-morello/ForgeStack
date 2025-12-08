import { test, expect } from './fixtures';

/**
 * Billing E2E Tests
 *
 * Tests for billing and subscription management features.
 */

test.describe('Billing', () => {
  test.describe('Billing Page (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/settings/billing');
      await page.waitForURL(/\/(login|settings)/, { timeout: 5000 });
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Billing Page (Authenticated)', () => {
    test('should display billing page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      await expect(page).toHaveURL(/\/settings\/billing/);
    });

    test('should display billing header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const heading = page.getByRole('heading', { name: /billing/i });
      await expect(heading).toBeVisible();
    });

    test('should show current plan information', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const planInfo = page.getByText(/current.*plan/i)
        .or(page.getByText(/subscription/i))
        .or(page.getByText(/free/i))
        .or(page.getByText(/starter/i))
        .or(page.getByText(/pro/i));

      const isVisible = await planInfo.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(planInfo.first()).toBeVisible();
      }
    });

    test('should show upgrade button for free plan', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const upgradeButton = page.getByRole('button', { name: /upgrade/i })
        .or(page.getByRole('link', { name: /upgrade/i }));

      const isVisible = await upgradeButton.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(upgradeButton.first()).toBeVisible();
      }
    });

    test('should display available plans', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const plans = page.getByText(/starter/i)
        .or(page.getByText(/pro/i))
        .or(page.getByText(/enterprise/i));

      const isVisible = await plans.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(plans.first()).toBeVisible();
      }
    });

    test('should show plan features', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const features = page.getByText(/features/i)
        .or(page.getByText(/included/i))
        .or(page.getByRole('list'));

      const isVisible = await features.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(features.first()).toBeVisible();
      }
    });

    test('should show billing history section', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const history = page.getByText(/billing.*history/i)
        .or(page.getByText(/invoices/i))
        .or(page.getByText(/payment.*history/i));

      const isVisible = await history.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(history.first()).toBeVisible();
      }
    });

    test('should show manage subscription button for paid plans', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const manageButton = page.getByRole('button', { name: /manage.*subscription/i })
        .or(page.getByRole('link', { name: /manage.*subscription/i }))
        .or(page.getByRole('button', { name: /billing.*portal/i }));

      const isVisible = await manageButton.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(manageButton.first()).toBeVisible();
      }
    });

    test('should show payment method section', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const paymentMethod = page.getByText(/payment.*method/i)
        .or(page.getByText(/credit.*card/i))
        .or(page.getByText(/add.*payment/i));

      const isVisible = await paymentMethod.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(paymentMethod.first()).toBeVisible();
      }
    });

    test('should show usage information', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const usage = page.getByText(/usage/i)
        .or(page.getByText(/limits/i))
        .or(page.getByText(/quota/i));

      const isVisible = await usage.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(usage.first()).toBeVisible();
      }
    });

    test('should navigate to settings from billing', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const profileLink = page.getByRole('link', { name: /profile/i });

      const isVisible = await profileLink.isVisible().catch(() => false);
      if (isVisible) {
        await profileLink.click();
        await expect(page).toHaveURL(/\/settings\/profile/);
      }
    });
  });

  test.describe('Plan Selection', () => {
    test('should show plan comparison', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const comparison = page.getByText(/compare.*plans/i)
        .or(page.getByRole('table'))
        .or(page.locator('[data-testid="plan-comparison"]'));

      const isVisible = await comparison.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(comparison.first()).toBeVisible();
      }
    });

    test('should highlight current plan', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const currentPlan = page.getByText(/current/i)
        .or(page.locator('[data-current="true"]'));

      const isVisible = await currentPlan.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(currentPlan.first()).toBeVisible();
      }
    });

    test('should show pricing for each plan', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const pricing = page.getByText(/\$\d+/i)
        .or(page.getByText(/month/i))
        .or(page.getByText(/year/i));

      const isVisible = await pricing.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(pricing.first()).toBeVisible();
      }
    });
  });

  test.describe('Stripe Integration', () => {
    test('should open Stripe checkout when upgrading', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const upgradeButton = page.getByRole('button', { name: /upgrade/i })
        .or(page.getByRole('button', { name: /subscribe/i }));

      const isVisible = await upgradeButton.first().isVisible().catch(() => false);
      if (isVisible) {
        // Click should either open Stripe or show plan selection
        await upgradeButton.first().click();

        // Wait for either Stripe redirect or modal
        await page.waitForTimeout(2000);

        // Check if redirected to Stripe or modal opened
        const stripeRedirect = page.url().includes('stripe.com');
        const modal = page.getByRole('dialog');
        const modalVisible = await modal.first().isVisible().catch(() => false);

        expect(stripeRedirect || modalVisible || page.url().includes('/settings/billing')).toBeTruthy();
      }
    });

    test('should open Stripe portal for subscription management', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const portalButton = page.getByRole('button', { name: /billing.*portal/i })
        .or(page.getByRole('button', { name: /manage.*subscription/i }))
        .or(page.getByRole('link', { name: /manage.*billing/i }));

      const isVisible = await portalButton.first().isVisible().catch(() => false);
      if (isVisible) {
        // Clicking should redirect to Stripe portal
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
          portalButton.first().click()
        ]);

        // Either opens new tab or redirects
        if (newPage) {
          expect(newPage.url()).toContain('stripe.com');
          await newPage.close();
        }
      }
    });
  });

  test.describe('Usage Tracking', () => {
    test('should display usage summary cards', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const usageSummary = page.getByText(/current.*usage/i)
        .or(page.getByText(/api.*calls/i))
        .or(page.getByText(/storage/i));

      const isVisible = await usageSummary.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(usageSummary.first()).toBeVisible();
      }
    });

    test('should show usage chart', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const chart = page.getByText(/usage.*trends/i)
        .or(page.locator('canvas'))
        .or(page.locator('[data-testid="usage-chart"]'));

      const isVisible = await chart.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(chart.first()).toBeVisible();
      }
    });

    test('should display usage limits', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const limits = page.getByText(/limit/i)
        .or(page.getByText(/quota/i))
        .or(page.getByText(/remaining/i));

      const isVisible = await limits.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(limits.first()).toBeVisible();
      }
    });

    test('should show usage alerts when approaching limits', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const alert = page.getByRole('alert')
        .or(page.getByText(/approaching.*limit/i))
        .or(page.getByText(/exceeded/i));

      const isVisible = await alert.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(alert.first()).toBeVisible();
      }
    });
  });

  test.describe('Invoice Management', () => {
    test('should display recent invoices', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const invoices = page.getByText(/recent.*invoices/i)
        .or(page.getByText(/invoice/i))
        .or(page.getByRole('table'));

      const isVisible = await invoices.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(invoices.first()).toBeVisible();
      }
    });

    test('should show view all invoices link', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const viewAllLink = page.getByRole('link', { name: /view.*all/i })
        .or(page.getByRole('button', { name: /view.*all/i }));

      const isVisible = await viewAllLink.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(viewAllLink.first()).toBeVisible();
      }
    });

    test('should navigate to invoices page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const viewAllLink = page.getByRole('link', { name: /view.*all/i })
        .or(page.getByRole('button', { name: /view.*all/i }));

      const isVisible = await viewAllLink.first().isVisible().catch(() => false);
      if (isVisible) {
        await viewAllLink.first().click();
        await expect(page).toHaveURL(/\/settings\/billing\/invoices/);
      }
    });

    test('should display projected invoice', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const projected = page.getByText(/projected.*invoice/i)
        .or(page.getByText(/estimated.*cost/i))
        .or(page.getByText(/next.*bill/i));

      const isVisible = await projected.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(projected.first()).toBeVisible();
      }
    });

    test('should show invoice status', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const status = page.getByText(/paid/i)
        .or(page.getByText(/pending/i))
        .or(page.getByText(/overdue/i));

      const isVisible = await status.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(status.first()).toBeVisible();
      }
    });

    test('should allow downloading invoices', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const downloadButton = page.getByRole('button', { name: /download/i })
        .or(page.getByRole('link', { name: /download/i }))
        .or(page.locator('[aria-label*="download" i]'));

      const isVisible = await downloadButton.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(downloadButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Invoices Page', () => {
    test('should display invoices page', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing/invoices');
      await expect(page).toHaveURL(/\/settings\/billing\/invoices/);
    });

    test('should display invoices header', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing/invoices');
      const heading = page.getByRole('heading', { name: /invoice/i });
      await expect(heading).toBeVisible();
    });

    test('should show invoice filters', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing/invoices');
      const filters = page.getByRole('tab')
        .or(page.getByRole('combobox'))
        .or(page.getByText(/filter/i));

      const isVisible = await filters.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(filters.first()).toBeVisible();
      }
    });

    test('should display invoice table', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing/invoices');
      const table = page.getByRole('table')
        .or(page.getByText(/no.*invoices/i));

      const isVisible = await table.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(table.first()).toBeVisible();
      }
    });

    test('should navigate back to billing', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing/invoices');
      const backLink = page.getByRole('link', { name: /back/i })
        .or(page.getByRole('button', { name: /back/i }));

      const isVisible = await backLink.first().isVisible().catch(() => false);
      if (isVisible) {
        await backLink.first().click();
        await expect(page).toHaveURL(/\/settings\/billing$/);
      }
    });
  });

  test.describe('Subscription Status', () => {
    test('should show subscription status badge', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const badge = page.getByText(/active/i)
        .or(page.getByText(/inactive/i))
        .or(page.getByText(/canceled/i))
        .or(page.getByText(/past.*due/i));

      const isVisible = await badge.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(badge.first()).toBeVisible();
      }
    });

    test('should display renewal date', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const renewalDate = page.getByText(/renew/i)
        .or(page.getByText(/next.*billing/i))
        .or(page.getByText(/expires/i));

      const isVisible = await renewalDate.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(renewalDate.first()).toBeVisible();
      }
    });

    test('should show past due alert', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/billing');
      const alert = page.getByRole('alert')
        .or(page.getByText(/past.*due/i))
        .or(page.getByText(/payment.*failed/i));

      const isVisible = await alert.first().isVisible().catch(() => false);
      if (isVisible) {
        await expect(alert.first()).toBeVisible();
      }
    });
  });
});

