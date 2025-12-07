# AI Integration (Vercel AI SDK)

ForgeStack's AI integration using Vercel AI SDK for multi-provider LLM support.

## Overview

The AI SDK provides a unified interface for:
- **Text generation** - Chat completions, content generation
- **Structured output** - Extract typed JSON from LLMs
- **Tool calling** - Let LLMs call backend functions
- **Streaming** - Real-time response streaming
- **Multi-provider** - OpenAI, Anthropic, Google, etc.

## Backend Service

```typescript
// apps/api/src/modules/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

@Injectable()
export class AiService {
  // Get provider based on org settings or default
  private getModel(provider: 'openai' | 'anthropic' = 'openai', model?: string) {
    switch (provider) {
      case 'anthropic':
        return anthropic(model ?? 'claude-sonnet-4-20250514');
      default:
        return openai(model ?? 'gpt-4o');
    }
  }

  // Simple text generation
  async generateText(prompt: string, options?: { provider?: 'openai' | 'anthropic'; model?: string }) {
    const { text, usage } = await generateText({
      model: this.getModel(options?.provider, options?.model),
      prompt,
    });
    return { text, tokensUsed: usage.totalTokens };
  }

  // Structured output with Zod schema
  async generateObject<T>(prompt: string, schema: z.ZodSchema<T>, options?: { provider?: 'openai' | 'anthropic' }) {
    const { object, usage } = await generateObject({
      model: this.getModel(options?.provider),
      prompt,
      schema,
    });
    return { object, tokensUsed: usage.totalTokens };
  }

  // Streaming for chat
  streamChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>, options?: { provider?: 'openai' | 'anthropic' }) {
    return streamText({
      model: this.getModel(options?.provider),
      messages,
    });
  }
}
```

## API Route (Streaming)

```typescript
// apps/api/src/modules/ai/ai.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { messages: any[] }, @Res() res: Response) {
    const result = this.aiService.streamChat(body.messages);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.end();
  }

  @Post('generate')
  async generate(@Body() body: { prompt: string }) {
    return this.aiService.generateText(body.prompt);
  }
}
```

## Frontend Hook (useChat)

```typescript
// apps/web/src/hooks/use-ai-chat.ts
'use client';
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          assistantContent += data.text;
          setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: assistantContent }]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  return { messages, input, setInput, sendMessage, isLoading };
}
```

## Structured Output Example

```typescript
// Extract invoice data from text
const InvoiceSchema = z.object({
  vendor: z.string(),
  amount: z.number(),
  date: z.string(),
  lineItems: z.array(z.object({ description: z.string(), quantity: z.number(), price: z.number() })),
});

const { object: invoice } = await aiService.generateObject(
  'Extract invoice data from: "Acme Corp charged $1,500 on Jan 15 for 3x Widget Pro @ $500"',
  InvoiceSchema
);
// Returns typed invoice object
```

## Usage Tracking

Track AI usage per organization for billing:

```typescript
// After each AI call
await this.usageRepository.recordUsage({
  orgId,
  provider: 'openai',
  model: 'gpt-4o',
  inputTokens: usage.promptTokens,
  outputTokens: usage.completionTokens,
  estimatedCost: calculateCost(usage),
});
```

## Rate Limiting by Plan

| Plan | Requests/min | Tokens/month |
|------|--------------|--------------|
| Free | 10 | 10,000 |
| Starter | 60 | 100,000 |
| Pro | 120 | 1,000,000 |
| Enterprise | Unlimited | Custom |

## Dependencies

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

## Related Files

- `apps/api/src/modules/ai/` - Backend AI module
- `apps/web/src/hooks/use-ai-chat.ts` - Frontend hook
- `docs/specs/ai-sdk-integration.md` - Full specification
- `.ai/patterns/api-endpoint.md` - API patterns

