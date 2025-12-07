# Vercel AI SDK Integration

**Epic:** AI
**Priority:** TBD
**Depends on:** NestJS API Skeleton, Organization Management, BullMQ Worker, Rate Limiting, Stripe Billing (for usage-based limits)
**Status:** Draft

---

## 1. Context

### Why AI Integration Is Needed

ForgeStack requires AI capabilities to enable intelligent features across the platform. The Vercel AI SDK provides a unified interface for:

- **Text Generation** – Chat and completion endpoints for conversational AI
- **Structured Output** – Extracting typed data from LLMs with schema validation
- **Tool Calling** – Letting LLMs execute backend functions
- **Streaming** – Real-time response streaming for better UX
- **Multi-Provider Support** – OpenAI, Anthropic, Google, and more

### Business Value

- **AI-Powered Features** – Enable intelligent search, content generation, and data extraction
- **Developer Experience** – Unified API across multiple LLM providers
- **Cost Control** – Per-org usage tracking and rate limiting
- **Flexibility** – Organizations can bring their own API keys
- **Scalability** – Long-running AI tasks offloaded to BullMQ workers

### Technical Approach

**Vercel AI SDK** is the chosen toolkit due to:
- TypeScript-first with full type safety
- Unified provider interface (OpenAI, Anthropic, Google, etc.)
- Built-in streaming support with Server-Sent Events
- Structured output with Zod schema validation
- Tool calling with type-safe definitions
- React hooks for frontend integration (`useChat`, `useCompletion`)

All AI operations are:
- **Rate-limited** per organization based on plan
- **Usage-tracked** for billing purposes
- **Auditable** through audit logs
- **Optionally queued** via BullMQ for long-running tasks

---

## 2. User Stories

### US-1: Chat Completion
**As an** application developer,
**I want to** send chat messages to an AI endpoint,
**So that** I can build conversational interfaces.

### US-2: Structured Data Extraction
**As an** application developer,
**I want to** extract structured data from AI responses,
**So that** I can parse and validate AI outputs with TypeScript types.

### US-3: Tool Calling
**As an** application developer,
**I want to** let the AI call backend functions,
**So that** I can build agentic workflows.

### US-4: Streaming Responses
**As an** application user,
**I want to** see AI responses stream in real-time,
**So that** I don't wait for the entire response to complete.

### US-5: Usage Tracking
**As an** organization owner,
**I want to** see my AI usage metrics,
**So that** I can monitor costs and plan capacity.

### US-6: Bring Your Own Key
**As an** organization owner,
**I want to** use my own API keys for AI providers,
**So that** I can control costs and use my existing accounts.

### US-7: Background AI Tasks
**As an** application developer,
**I want to** queue long-running AI tasks,
**So that** API requests don't timeout.

---

## 3. Acceptance Criteria

### US-1: Chat Completion
- [ ] **AC-1.1:** POST `/api/v1/ai/chat` accepts messages array and streams response
- [ ] **AC-1.2:** Supports system, user, and assistant message roles
- [ ] **AC-1.3:** Returns streaming Server-Sent Events (SSE)
- [ ] **AC-1.4:** Falls back to JSON response when streaming disabled
- [ ] **AC-1.5:** Authenticated users only (org context required)

### US-2: Structured Data Extraction
- [ ] **AC-2.1:** POST `/api/v1/ai/generate-object` accepts schema and prompt
- [ ] **AC-2.2:** Returns validated JSON matching the provided schema
- [ ] **AC-2.3:** Supports streaming partial objects
- [ ] **AC-2.4:** Returns validation errors for malformed schemas

### US-3: Tool Calling
- [ ] **AC-3.1:** Tools can be registered dynamically per request
- [ ] **AC-3.2:** Tool execution is sandboxed and rate-limited
- [ ] **AC-3.3:** Tool results are passed back to the model
- [ ] **AC-3.4:** Multi-step tool loops are supported with configurable depth

### US-4: Streaming Responses
- [ ] **AC-4.1:** SSE stream includes text delta events
- [ ] **AC-4.2:** Stream includes tool call events when applicable
- [ ] **AC-4.3:** Stream properly handles backpressure
- [ ] **AC-4.4:** Client receives finish event with usage metadata

### US-5: Usage Tracking
- [ ] **AC-5.1:** Token usage (input/output) tracked per request
- [ ] **AC-5.2:** Usage aggregated per organization per day
- [ ] **AC-5.3:** GET `/api/v1/ai/usage` returns current period usage
- [ ] **AC-5.4:** Usage data available for billing integration

### US-6: Bring Your Own Key
- [ ] **AC-6.1:** Organizations can store encrypted API keys
- [ ] **AC-6.2:** Org keys take precedence over system defaults
- [ ] **AC-6.3:** Key validation before storage
- [ ] **AC-6.4:** API key rotation supported

### US-7: Background AI Tasks
- [ ] **AC-7.1:** POST `/api/v1/ai/jobs` queues AI task to BullMQ
- [ ] **AC-7.2:** GET `/api/v1/ai/jobs/:id` returns job status and result
- [ ] **AC-7.3:** Jobs support retry with exponential backoff
- [ ] **AC-7.4:** Job results stored for 24 hours

---

## 4. Rate Limits (AI-Specific)

AI operations have stricter rate limits due to cost:

### 4.1 Token Limits by Plan
| Plan | Tokens/Minute | Tokens/Day | Concurrent Requests |
|------|---------------|------------|---------------------|
| Free | 10,000 | 100,000 | 2 |
| Starter | 50,000 | 1,000,000 | 5 |
| Pro | 200,000 | 5,000,000 | 20 |
| Enterprise | Custom | Custom | Custom |

### 4.2 Request Limits
| Endpoint | Limit |
|----------|-------|
| `/ai/chat` | 60 requests/minute per org |
| `/ai/generate-object` | 30 requests/minute per org |
| `/ai/jobs` | 100 requests/minute per org |

---

## 5. Database Schema

### 5.1 ai_provider_keys Table

Stores encrypted API keys per organization for AI providers.

```sql
CREATE TABLE ai_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', etc.
  encrypted_key TEXT NOT NULL, -- AES-256 encrypted
  key_hint TEXT, -- Last 4 characters for display
  is_valid BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

-- RLS Policy
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_provider_keys_org_isolation ON ai_provider_keys
  USING (org_id::text = current_setting('app.current_org_id', true));
```

### 5.2 ai_usage Table

Tracks AI token usage per organization.

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  operation TEXT NOT NULL, -- 'chat', 'generate-object', 'job'
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_usage_org_id ON ai_usage(org_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_org_date ON ai_usage(org_id, created_at);

-- RLS Policy
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_usage_org_isolation ON ai_usage
  USING (org_id::text = current_setting('app.current_org_id', true));
```

### 5.3 ai_jobs Table

Stores background AI job state and results.

```sql
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL, -- 'chat', 'generate-object', 'custom'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  input JSONB NOT NULL,
  output JSONB,
  error TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_jobs_org_id ON ai_jobs(org_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_expires_at ON ai_jobs(expires_at);

-- RLS Policy
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs FORCE ROW LEVEL SECURITY;

CREATE POLICY ai_jobs_org_isolation ON ai_jobs
  USING (org_id::text = current_setting('app.current_org_id', true));
```

---

## 6. API Endpoints

### 6.1 POST /api/v1/ai/chat – Streaming Chat Completion

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Rate Limited | Yes (60 req/min, token limits) |
| Streaming | Yes (SSE) |

**Request Body:**
```typescript
interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string; // Default: 'gpt-4o'
  provider?: 'openai' | 'anthropic' | 'google';
  temperature?: number; // 0-2, default 0.7
  maxTokens?: number; // Default: 4096
  stream?: boolean; // Default: true
  tools?: Array<ToolDefinition>; // Optional tool definitions
}
```

**Response (Streaming):** Server-Sent Events
```
data: {"type":"text-delta","text":"Hello"}
data: {"type":"text-delta","text":" world"}
data: {"type":"finish","usage":{"inputTokens":10,"outputTokens":20}}
```

**Response (Non-Streaming):**
```json
{
  "id": "resp_xxx",
  "content": "Hello world",
  "role": "assistant",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 20
  }
}
```

### 6.2 POST /api/v1/ai/generate-object – Structured Output

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Rate Limited | Yes (30 req/min) |
| Streaming | Yes (partial objects) |

**Request Body:**
```typescript
interface GenerateObjectRequest {
  prompt: string;
  schema: Record<string, unknown>; // JSON Schema
  model?: string;
  provider?: string;
  mode?: 'auto' | 'json' | 'tool'; // Default: 'auto'
  stream?: boolean;
}
```

**Response:**
```json
{
  "object": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com"
  },
  "usage": {
    "inputTokens": 50,
    "outputTokens": 30
  }
}
```

### 6.3 POST /api/v1/ai/jobs – Queue Background AI Task

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Rate Limited | Yes (100 req/min) |
| Async | Yes (returns job ID) |

**Request Body:**
```typescript
interface CreateAIJobRequest {
  type: 'chat' | 'generate-object';
  input: ChatRequest | GenerateObjectRequest;
  webhookUrl?: string; // Optional callback on completion
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job_xxx",
  "status": "pending",
  "estimatedCompletion": "2024-12-07T10:30:00Z"
}
```

### 6.4 GET /api/v1/ai/jobs/:id – Get Job Status

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |

**Response:**
```json
{
  "id": "job_xxx",
  "type": "chat",
  "status": "completed",
  "input": { ... },
  "output": { ... },
  "tokensUsed": 150,
  "startedAt": "2024-12-07T10:29:00Z",
  "completedAt": "2024-12-07T10:29:30Z"
}
```

### 6.5 GET /api/v1/ai/usage – Get Usage Statistics

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Permission | `ai:read` |

**Query Parameters:**
- `period`: `day` | `week` | `month` (default: `month`)

**Response:**
```json
{
  "period": "month",
  "usage": {
    "totalTokens": 500000,
    "inputTokens": 200000,
    "outputTokens": 300000,
    "requestCount": 1500
  },
  "byProvider": {
    "openai": { "tokens": 300000, "requests": 1000 },
    "anthropic": { "tokens": 200000, "requests": 500 }
  },
  "limit": {
    "tokensPerDay": 5000000,
    "remaining": 4500000
  }
}
```

### 6.6 POST /api/v1/ai/provider-keys – Store Provider API Key

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Role | OWNER |

**Request Body:**
```typescript
interface StoreProviderKeyRequest {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
}
```

**Response (201):**
```json
{
  "id": "key_xxx",
  "provider": "openai",
  "keyHint": "sk-...abcd",
  "isValid": true,
  "createdAt": "2024-12-07T10:00:00Z"
}
```

### 6.7 DELETE /api/v1/ai/provider-keys/:provider – Remove Provider Key

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Role | OWNER |

**Response (204):** No content


---

## 7. Worker Jobs

### 7.1 ai-task Queue

**Queue Name:** `ai-task`

**Job Data:**
```typescript
interface AITaskJobData {
  jobId: string; // AI job record ID
  orgId: string;
  userId: string;
  type: 'chat' | 'generate-object';
  input: ChatRequest | GenerateObjectRequest;
  provider: string;
  model: string;
  apiKey?: string; // Decrypted org API key (if BYOK)
  webhookUrl?: string;
}
```

**Processing Logic:**
1. Update job status to `running`
2. Resolve API key (org key or system default)
3. Execute AI operation with Vercel AI SDK
4. Store result in `ai_jobs` table
5. Record usage in `ai_usage` table
6. If webhookUrl provided, queue webhook delivery
7. Update job status to `completed` or `failed`

**Retry Configuration:**
- Attempts: 3
- Backoff: Exponential (5s, 15s, 45s)
- Timeout: 5 minutes per attempt

### 7.2 ai-usage-aggregation Queue

**Queue Name:** `ai-usage-aggregation`

**Job Data:**
```typescript
interface UsageAggregationJobData {
  orgId: string;
  date: string; // YYYY-MM-DD
}
```

**Scheduled:** Daily at 00:05 UTC

**Processing Logic:**
1. Aggregate usage from `ai_usage` for the previous day
2. Check against plan limits
3. Trigger alerts if approaching limits (80%+)
4. Generate usage report for billing

### 7.3 ai-job-cleanup Queue

**Queue Name:** `ai-job-cleanup`

**Scheduled:** Daily at 02:00 UTC

**Processing Logic:**
1. Delete expired jobs (older than 24h)
2. Archive usage data older than 90 days

---

## 8. Frontend Components

### 8.1 Chat UI Component

**Path:** `apps/web/src/components/ai/chat-interface.tsx`

Uses `useChat` hook from `@ai-sdk/react`:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';

export function ChatInterface() {
  const { messages, input, setInput, sendMessage, status } = useChat({
    api: '/api/v1/ai/chat',
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <form onSubmit={e => {
        e.preventDefault();
        sendMessage({ text: input });
        setInput('');
      }}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button disabled={status !== 'ready'}>Send</button>
      </form>
    </div>
  );
}
```

### 8.2 AI Settings Page

**Path:** `apps/web/src/app/(dashboard)/settings/ai/page.tsx`

Features:
- View/manage provider API keys
- View usage statistics
- View rate limit status
- Configure default model/provider

### 8.3 Usage Dashboard Component

**Path:** `apps/web/src/components/ai/usage-dashboard.tsx`

Features:
- Token usage chart (daily/weekly/monthly)
- Breakdown by provider
- Breakdown by operation type
- Remaining quota indicator

---

## 9. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  useChat Hook   │  │ useCompletion   │  │  AI Settings Page   │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │ SSE                 │ SSE                 │ REST
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NestJS API (apps/api)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  AIController   │  │   AIService     │  │  AIProviderService  │  │
│  │  - /ai/chat     │──│  - Chat         │──│  - OpenAI           │  │
│  │  - /ai/object   │  │  - Objects      │  │  - Anthropic        │  │
│  │  - /ai/jobs     │  │  - Jobs         │  │  - Google           │  │
│  └─────────────────┘  └────────┬────────┘  └─────────────────────┘  │
│                                │                                     │
│  ┌─────────────────┐  ┌────────▼────────┐  ┌─────────────────────┐  │
│  │ AIRateLimiter   │  │  AIRepository   │  │   QueueService      │  │
│  │  - Token limits │  │  - Usage        │  │  - ai-task queue    │  │
│  │  - Req limits   │  │  - Jobs         │  └──────────┬──────────┘  │
│  └─────────────────┘  │  - Keys         │             │             │
│                       └─────────────────┘             │             │
└───────────────────────────────────────────────────────┼─────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BullMQ Worker (apps/worker)                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AITaskHandler                                               │   │
│  │  - Execute AI operations                                     │   │
│  │  - Store results                                             │   │
│  │  - Track usage                                               │   │
│  │  - Trigger webhooks                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Provider Configuration

### 10.1 Supported Providers

| Provider | Package | Models | Notes |
|----------|---------|--------|-------|
| OpenAI | `@ai-sdk/openai` | gpt-4o, gpt-4o-mini, gpt-3.5-turbo | Default provider |
| Anthropic | `@ai-sdk/anthropic` | claude-3.5-sonnet, claude-3-opus | Best for long context |
| Google | `@ai-sdk/google` | gemini-1.5-pro, gemini-1.5-flash | Good price/performance |

### 10.2 Default Model Selection

```typescript
const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-1.5-flash',
};
```

### 10.3 API Key Resolution Order

1. Organization-specific key (from `ai_provider_keys`)
2. System default key (from environment variables)
3. Error if neither available

---

## 11. Tasks & Subtasks

### 11.1 Backend Tasks (apps/api)

#### 11.1.1 Create AI Module
- [ ] Create `apps/api/src/ai/ai.module.ts`
- [ ] Import providers, services, controllers
- [ ] Register with QueueModule
- [ ] Export AIService

#### 11.1.2 Implement AI Provider Service
- [ ] Create `apps/api/src/ai/ai-provider.service.ts`
- [ ] Initialize Vercel AI SDK providers (OpenAI, Anthropic, Google)
- [ ] Implement `getProvider(name, apiKey?)` method
- [ ] Implement `getModel(provider, modelName)` method
- [ ] Handle API key resolution (org key vs system default)

#### 11.1.3 Implement AI Service
- [ ] Create `apps/api/src/ai/ai.service.ts`
- [ ] Implement `chat(ctx, request)` with streaming
- [ ] Implement `generateObject(ctx, request, schema)`
- [ ] Implement `createJob(ctx, request)`
- [ ] Implement `getJob(ctx, jobId)`
- [ ] Implement `getUsage(ctx, period)`
- [ ] Track usage after each operation

#### 11.1.4 Implement AI Rate Limiter
- [ ] Create `apps/api/src/ai/ai-rate-limiter.service.ts`
- [ ] Implement token-based rate limiting
- [ ] Implement request-based rate limiting
- [ ] Integrate with existing rate limiting infrastructure
- [ ] Check limits before AI operations

#### 11.1.5 Create AI Controller
- [ ] Create `apps/api/src/ai/ai.controller.ts`
- [ ] Implement `POST /ai/chat` with SSE streaming
- [ ] Implement `POST /ai/generate-object`
- [ ] Implement `POST /ai/jobs`
- [ ] Implement `GET /ai/jobs/:id`
- [ ] Implement `GET /ai/usage`
- [ ] Apply rate limiting decorators

#### 11.1.6 Create Provider Keys Controller
- [ ] Create `apps/api/src/ai/provider-keys.controller.ts`
- [ ] Implement `POST /ai/provider-keys`
- [ ] Implement `GET /ai/provider-keys`
- [ ] Implement `DELETE /ai/provider-keys/:provider`
- [ ] Apply `@RequireRole('OWNER')` to write operations

#### 11.1.7 Create DTOs
- [ ] Create `apps/api/src/ai/dto/chat.dto.ts`
- [ ] Create `apps/api/src/ai/dto/generate-object.dto.ts`
- [ ] Create `apps/api/src/ai/dto/create-job.dto.ts`
- [ ] Create `apps/api/src/ai/dto/usage.dto.ts`
- [ ] Create `apps/api/src/ai/dto/provider-key.dto.ts`

### 11.2 Database Tasks (packages/db)

#### 11.2.1 Create AI Schema
- [ ] Create `packages/db/src/schema/ai-provider-keys.ts`
- [ ] Create `packages/db/src/schema/ai-usage.ts`
- [ ] Create `packages/db/src/schema/ai-jobs.ts`
- [ ] Export from `packages/db/src/schema/index.ts`

#### 11.2.2 Create Migrations
- [ ] Create migration for `ai_provider_keys` table with RLS
- [ ] Create migration for `ai_usage` table with RLS
- [ ] Create migration for `ai_jobs` table with RLS
- [ ] Add indexes for query performance

#### 11.2.3 Create AI Repository
- [ ] Create `apps/api/src/ai/ai.repository.ts`
- [ ] Implement `saveProviderKey(ctx, data)`
- [ ] Implement `getProviderKey(ctx, provider)`
- [ ] Implement `deleteProviderKey(ctx, provider)`
- [ ] Implement `saveUsage(ctx, data)`
- [ ] Implement `getUsageStats(ctx, period)`
- [ ] Implement `createJob(ctx, data)`
- [ ] Implement `updateJob(ctx, id, data)`
- [ ] Implement `getJob(ctx, id)`

### 11.3 Worker Tasks (apps/worker)

#### 11.3.1 Create AI Task Handler
- [ ] Create `apps/worker/src/handlers/ai-task.handler.ts`
- [ ] Initialize AI providers
- [ ] Implement chat operation execution
- [ ] Implement generate-object execution
- [ ] Store results and track usage
- [ ] Handle errors and retries

#### 11.3.2 Create AI Usage Aggregation Handler
- [ ] Create `apps/worker/src/handlers/ai-usage-aggregation.handler.ts`
- [ ] Aggregate daily usage statistics
- [ ] Check limits and trigger alerts
- [ ] Generate billing data

#### 11.3.3 Create AI Job Cleanup Handler
- [ ] Create `apps/worker/src/handlers/ai-job-cleanup.handler.ts`
- [ ] Delete expired jobs
- [ ] Archive old usage data

#### 11.3.4 Register AI Queues
- [ ] Add `AI_TASK` to `QUEUE_NAMES` in `packages/shared/src/queues.ts`
- [ ] Add `AI_USAGE_AGGREGATION` to `QUEUE_NAMES`
- [ ] Add `AI_JOB_CLEANUP` to `QUEUE_NAMES`
- [ ] Register workers in `apps/worker/src/worker.ts`

### 11.4 Frontend Tasks (apps/web)

#### 11.4.1 Create AI Hooks
- [ ] Create `apps/web/src/hooks/use-ai-chat.ts` (wraps useChat)
- [ ] Create `apps/web/src/hooks/use-ai-usage.ts`
- [ ] Create `apps/web/src/hooks/use-provider-keys.ts`

#### 11.4.2 Create AI Components
- [ ] Create `apps/web/src/components/ai/chat-interface.tsx`
- [ ] Create `apps/web/src/components/ai/usage-dashboard.tsx`
- [ ] Create `apps/web/src/components/ai/provider-key-form.tsx`
- [ ] Create `apps/web/src/components/ai/provider-key-list.tsx`

#### 11.4.3 Create AI Settings Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/ai/page.tsx`
- [ ] Integrate provider key management
- [ ] Display usage statistics
- [ ] Show rate limit status

### 11.5 Shared Types (packages/shared)

#### 11.5.1 Create AI Types
- [ ] Create `packages/shared/src/types/ai.ts`
- [ ] Define `ChatRequest`, `ChatResponse` types
- [ ] Define `GenerateObjectRequest`, `GenerateObjectResponse` types
- [ ] Define `AIJob`, `AIUsage` types
- [ ] Define `AIProvider` enum



---

## 12. Test Plan

### 12.1 Unit Tests

#### AI Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `chat()` with valid messages | Returns streaming response |
| `chat()` with invalid model | Returns validation error |
| `generateObject()` with valid schema | Returns validated object |
| `generateObject()` with invalid schema | Returns schema error |
| `createJob()` queues BullMQ job | Job record created, job queued |

#### AI Provider Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `getProvider('openai')` | Returns OpenAI provider |
| `getProvider('invalid')` | Throws provider not found |
| `getModel('openai', 'gpt-4o')` | Returns model instance |
| API key resolution with org key | Uses org key |
| API key resolution without org key | Uses system default |

#### AI Rate Limiter Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Request under token limit | Allowed |
| Request over token limit | Rejected with 429 |
| Request under request limit | Allowed |
| Request over request limit | Rejected with 429 |

#### AI Repository Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `saveProviderKey()` encrypts key | Key stored encrypted |
| `getProviderKey()` decrypts key | Key returned decrypted |
| `saveUsage()` creates record | Usage record created |
| `getUsageStats()` aggregates correctly | Correct totals |

### 12.2 Integration Tests

#### API Endpoint Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `POST /ai/chat` streams response | SSE events received |
| `POST /ai/chat` without auth | Returns 401 |
| `POST /ai/generate-object` returns object | Valid JSON matching schema |
| `POST /ai/jobs` creates job | Returns 202 with job ID |
| `GET /ai/jobs/:id` returns job | Job status and result |
| `GET /ai/usage` returns stats | Usage statistics |
| `POST /ai/provider-keys` as OWNER | Key stored |
| `POST /ai/provider-keys` as MEMBER | Returns 403 |

#### RLS Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Org A cannot see Org B's provider keys | Empty result |
| Org A cannot see Org B's usage | Empty result |
| Org A cannot see Org B's jobs | Empty result |

### 12.3 E2E Tests

```gherkin
Scenario: Chat completion with streaming
  Given I am authenticated as an org member
  When I POST to /api/v1/ai/chat with messages
  Then I receive SSE stream with text deltas
  And I receive finish event with usage
  And usage is recorded in database

Scenario: Structured output generation
  Given I am authenticated as an org member
  When I POST to /api/v1/ai/generate-object with schema
  Then I receive object matching schema
  And object is validated against schema

Scenario: Background AI job
  Given I am authenticated as an org member
  When I POST to /api/v1/ai/jobs with chat request
  Then I receive 202 with job ID
  When I poll GET /api/v1/ai/jobs/:id
  Then job status changes to completed
  And result is available

Scenario: Bring your own API key
  Given I am an org owner
  When I POST my OpenAI API key
  Then key is stored encrypted
  When I make AI requests
  Then my key is used instead of system default

Scenario: Rate limiting enforcement
  Given I am on the Free plan (10k tokens/min)
  When I make requests totaling 10k tokens
  Then subsequent requests return 429
  And Retry-After header indicates wait time
```

---

## 13. Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | System OpenAI API key | No* | - |
| `ANTHROPIC_API_KEY` | System Anthropic API key | No* | - |
| `GOOGLE_AI_API_KEY` | System Google AI API key | No* | - |
| `AI_ENCRYPTION_KEY` | 32-byte key for encrypting org API keys | Yes | - |
| `AI_DEFAULT_PROVIDER` | Default AI provider | No | `openai` |
| `AI_DEFAULT_MODEL` | Default model name | No | `gpt-4o-mini` |
| `AI_RATE_LIMIT_ENABLED` | Enable AI rate limiting | No | `true` |

*At least one provider API key is required unless all orgs use BYOK.

**Example `.env`:**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_ENCRYPTION_KEY=32-byte-hex-string-for-encryption
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
```

---

## 14. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4.x` | Vercel AI SDK core |
| `@ai-sdk/openai` | `^1.x` | OpenAI provider |
| `@ai-sdk/anthropic` | `^1.x` | Anthropic provider |
| `@ai-sdk/google` | `^1.x` | Google AI provider |
| `zod` | existing | Schema validation |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@ai-sdk/react` | `^1.x` | React hooks (useChat, useCompletion) |

---

## 15. Security Considerations

1. **API Key Encryption** – Org API keys stored with AES-256 encryption
2. **Key Never Logged** – API keys never appear in logs or error messages
3. **RLS Enforcement** – All AI tables have org-scoped RLS policies
4. **Rate Limiting** – Both request and token-based limits prevent abuse
5. **Input Validation** – All inputs validated before sending to AI providers
6. **Output Sanitization** – AI outputs sanitized before storage/display
7. **Cost Control** – Token limits prevent runaway costs
8. **Audit Trail** – All AI operations logged to audit log
9. **No PII in Prompts** – Warn against sending sensitive data to AI


---

## 16. Observability

### Logging

```
[INFO] [AI] Chat request from org {orgId}, model: {model}
[INFO] [AI] Streaming response started, request_id: {reqId}
[INFO] [AI] Request completed, tokens: {input}/{output}
[WARN] [AI] Rate limit approaching for org {orgId}: 80% used
[ERROR] [AI] Provider error: {error}
```

### Metrics (Future)

- Requests per provider/model
- Token usage per org/day
- Average response latency
- Error rate by provider
- Rate limit hit rate

---

## 17. Multi-Tenancy Considerations

- [ ] All AI tables have `org_id` column with RLS
- [ ] Provider keys are org-scoped and encrypted
- [ ] Usage is tracked and aggregated per org
- [ ] Rate limits are enforced per org
- [ ] Jobs are accessible only within org context
- [ ] Audit logs record org context for all operations
- [ ] Uses `withTenantContext` for all queries

---

## 18. Future Enhancements (Out of Scope)

- Image generation (DALL-E, Stable Diffusion)
- Audio transcription (Whisper)
- Embeddings and vector search
- Fine-tuning support
- Prompt templates and versioning
- A/B testing for prompts
- Cost estimation before execution
- Streaming to client via WebSockets
- Multi-turn conversation persistence
- RAG integration with file uploads

---

## 19. Project Structure

```
apps/api/src/
├── ai/
│   ├── ai.module.ts
│   ├── ai.controller.ts
│   ├── ai.service.ts
│   ├── ai-provider.service.ts
│   ├── ai-rate-limiter.service.ts
│   ├── ai.repository.ts
│   ├── provider-keys.controller.ts
│   └── dto/
│       ├── chat.dto.ts
│       ├── generate-object.dto.ts
│       ├── create-job.dto.ts
│       ├── usage.dto.ts
│       └── provider-key.dto.ts

packages/db/src/
├── schema/
│   ├── ai-provider-keys.ts
│   ├── ai-usage.ts
│   └── ai-jobs.ts

apps/worker/src/
├── handlers/
│   ├── ai-task.handler.ts
│   ├── ai-usage-aggregation.handler.ts
│   └── ai-job-cleanup.handler.ts

apps/web/src/
├── app/(dashboard)/
│   └── settings/
│       └── ai/
│           └── page.tsx
├── components/
│   └── ai/
│       ├── chat-interface.tsx
│       ├── usage-dashboard.tsx
│       ├── provider-key-form.tsx
│       └── provider-key-list.tsx
└── hooks/
    ├── use-ai-chat.ts
    ├── use-ai-usage.ts
    └── use-provider-keys.ts

packages/shared/src/
├── types/
│   └── ai.ts
└── queues.ts  # Add AI queue names
```

---

*End of spec*