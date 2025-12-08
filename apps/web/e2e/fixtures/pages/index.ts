/**
 * Page Object Models (POMs) for ForgeStack E2E Tests
 * 
 * Export all page objects from this file for easy importing in tests.
 * 
 * Usage:
 * ```typescript
 * import { AiChatPage, SettingsPage, AdminPage } from './fixtures/pages';
 * 
 * test('example test', async ({ page }) => {
 *   const aiChat = new AiChatPage(page);
 *   await aiChat.goto();
 *   await aiChat.sendMessage('Hello');
 * });
 * ```
 */

export { BasePage } from './base.page';
export { AiChatPage } from './ai-chat.page';
export { SettingsPage } from './settings.page';
export { AdminPage } from './admin.page';

