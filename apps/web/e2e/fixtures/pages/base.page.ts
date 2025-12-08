import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
  
  async getToast(): Promise<Locator> {
    return this.page.locator('[data-sonner-toast]').or(this.page.getByRole('alert'));
  }
  
  async waitForToast(text: string) {
    const toast = await this.getToast();
    await toast.filter({ hasText: text }).waitFor({ state: 'visible' });
  }
  
  async closeToast() {
    const toast = await this.getToast();
    const closeButton = toast.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}

