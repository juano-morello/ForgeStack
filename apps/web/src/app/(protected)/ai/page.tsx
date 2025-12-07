/**
 * AI Chat Page
 *
 * Full-page AI chat interface.
 */

import { AiChat } from '@/components/ai/ai-chat';

export default function AiChatPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground mt-2">
          Have a conversation with AI. Ask questions, get help, or explore ideas.
        </p>
      </div>

      {/* Chat Interface */}
      <AiChat />
    </div>
  );
}

