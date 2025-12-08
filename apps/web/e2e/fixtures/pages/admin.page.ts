import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminPage extends BasePage {
  readonly userList: Locator;
  readonly impersonateButton: Locator;
  readonly endImpersonationButton: Locator;
  readonly impersonationBanner: Locator;
  readonly auditLogTable: Locator;
  readonly organizationList: Locator;
  
  constructor(page: Page) {
    super(page);
    this.userList = page.locator('[data-testid="user-list"]').or(page.getByRole('table'));
    this.impersonateButton = page.getByRole('button', { name: /impersonate/i });
    this.endImpersonationButton = page.getByRole('button', { name: /end.*impersonation/i });
    this.impersonationBanner = page.locator('[data-testid="impersonation-banner"]').or(page.getByText(/impersonating/i));
    this.auditLogTable = page.locator('[data-testid="audit-logs"]').or(page.getByRole('table'));
    this.organizationList = page.locator('[data-testid="org-list"]').or(page.getByRole('table'));
  }
  
  async gotoSuperAdmin() {
    await this.page.goto('/super-admin');
    await this.waitForPageLoad();
  }
  
  async gotoUsers() {
    await this.page.goto('/super-admin/users');
    await this.waitForPageLoad();
  }
  
  async gotoOrganizations() {
    await this.page.goto('/super-admin/organizations');
    await this.waitForPageLoad();
  }
  
  async gotoAuditLogs() {
    await this.page.goto('/super-admin/audit-logs');
    await this.waitForPageLoad();
  }
  
  async gotoFeatureFlags() {
    await this.page.goto('/admin/feature-flags');
    await this.waitForPageLoad();
  }
  
  async impersonateUser(userEmail: string) {
    const userRow = this.page.getByRole('row').filter({ hasText: userEmail });
    await userRow.getByRole('button', { name: /impersonate/i }).click();
  }
  
  async endImpersonation() {
    await this.endImpersonationButton.click();
  }
  
  async isImpersonating(): Promise<boolean> {
    return this.impersonationBanner.isVisible();
  }
}

