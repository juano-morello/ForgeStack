import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  readonly profileTab: Locator;
  readonly organizationTab: Locator;
  readonly billingTab: Locator;
  readonly apiKeysTab: Locator;
  readonly webhooksTab: Locator;
  readonly auditLogsTab: Locator;
  readonly rolesTab: Locator;
  readonly notificationsTab: Locator;
  
  constructor(page: Page) {
    super(page);
    this.profileTab = page.getByRole('link', { name: /profile/i });
    this.organizationTab = page.getByRole('link', { name: /organization/i });
    this.billingTab = page.getByRole('link', { name: /billing/i });
    this.apiKeysTab = page.getByRole('link', { name: /api.*keys/i });
    this.webhooksTab = page.getByRole('link', { name: /webhooks/i });
    this.auditLogsTab = page.getByRole('link', { name: /audit.*logs/i });
    this.rolesTab = page.getByRole('link', { name: /roles/i });
    this.notificationsTab = page.getByRole('link', { name: /notifications/i });
  }
  
  async gotoProfile() {
    await this.page.goto('/settings/profile');
    await this.waitForPageLoad();
  }
  
  async gotoBilling() {
    await this.page.goto('/settings/billing');
    await this.waitForPageLoad();
  }
  
  async gotoApiKeys() {
    await this.page.goto('/settings/api-keys');
    await this.waitForPageLoad();
  }
  
  async gotoWebhooks() {
    await this.page.goto('/settings/webhooks');
    await this.waitForPageLoad();
  }
  
  async gotoAuditLogs() {
    await this.page.goto('/settings/audit-logs');
    await this.waitForPageLoad();
  }
  
  async gotoRoles() {
    await this.page.goto('/settings/roles');
    await this.waitForPageLoad();
  }
}

