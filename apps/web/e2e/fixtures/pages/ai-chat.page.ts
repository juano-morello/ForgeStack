import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AiChatPage extends BasePage {
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;
  readonly clearButton: Locator;
  readonly usageCard: Locator;
  
  constructor(page: Page) {
    super(page);
    this.messageInput = page.getByPlaceholder(/type.*message/i).or(page.getByRole('textbox'));
    this.sendButton = page.getByRole('button', { name: /send/i });
    this.messageList = page.locator('[data-testid="message-list"]').or(page.getByRole('list'));
    this.clearButton = page.getByRole('button', { name: /clear/i });
    this.usageCard = page.locator('[data-testid="ai-usage"]').or(page.getByText(/usage/i));
  }
  
  async goto() {
    await this.page.goto('/ai');
    await this.waitForPageLoad();
  }
  
  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }
  
  async getMessages(): Promise<Locator> {
    return this.messageList.locator('[data-testid="message"]').or(this.messageList.locator('li'));
  }
  
  async waitForResponse() {
    // Wait for streaming to complete
    await this.page.waitForFunction(() => {
      const sendButton = document.querySelector('button[type="submit"]');
      return sendButton && !sendButton.hasAttribute('disabled');
    }, { timeout: 30000 });
  }
  
  async clearChat() {
    if (await this.clearButton.isVisible()) {
      await this.clearButton.click();
    }
  }
}

