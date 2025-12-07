# ForgeStack AI Optimization Plan

> Making ForgeStack the most AI-friendly SaaS starter kit for any LLM-powered coding assistant.

## Executive Summary

This document outlines a comprehensive strategy to add AI-optimized development tooling to ForgeStack, matching or exceeding competitors like IndieKit Pro's "20+ Claude Skills" approach while remaining **completely model-agnostic** and **vendor-neutral**.

**Goal**: Enable developers using ANY AI coding assistant (Cursor, Windsurf, GitHub Copilot, Augment, Cody, etc.) with ANY LLM (Claude, GPT-4, Gemini, Llama, etc.) to be maximally productive when building with ForgeStack.

**Approach**: Create a comprehensive `.ai/` directory with plain Markdown documentation that any LLM can consume, rather than IDE-specific configuration files.

---

## Part 1: Current State Assessment

### ✅ Existing AI-Friendly Patterns (Strengths)

ForgeStack already has several characteristics that make it AI-friendly:

| Pattern | Example | AI Benefit |
|---------|---------|------------|
| **Consistent module structure** | Every API module has `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `dto/` | AI can predict file locations and patterns |
| **TypeScript strict mode** | All packages use strict TypeScript | AI gets type hints for accurate code generation |
| **Shared types in `@forgestack/shared`** | DTOs, constants, types centralized | Single source of truth for AI to reference |
| **Spec-driven development** | `/docs/specs/<epic>/<story>.md` | Rich context for understanding features |
| **Consistent naming conventions** | kebab-case files, PascalCase classes | Predictable naming AI can follow |
| **Comprehensive test coverage** | 95%+ with examples for every module | AI can learn patterns from tests |
| **Swagger/OpenAPI annotations** | All controllers use `@ApiTags`, `@ApiOperation` | Self-documenting API endpoints |
| **JSDoc comments on key functions** | `withTenantContext`, handlers | AI understands intent |
| **`agents.md` file** | High-level architecture and rules | Excellent starting context |
| **Clear separation of concerns** | Controller → Service → Repository | AI can target the right layer |

### ❌ Current Gaps (Opportunities)

| Gap | Impact | Priority |
|-----|--------|----------|
| No structured AI context files | AI must scan entire codebase for patterns | 🔴 Critical |
| No reusable prompt templates | Users must craft prompts from scratch | 🟡 Medium |
| No pattern documentation with examples | AI can't quickly find "how to add X" examples | 🟡 Medium |
| Limited inline comments explaining "why" | AI knows "what" but not "why" for RLS, patterns | 🟡 Medium |
| No sub-agent workflow documentation | Complex features require coordinated AI work | 🟡 Medium |
| Schema files lack descriptive comments | AI doesn't understand table purposes | 🟢 Low |

---

## Part 2: AI Optimization Strategy (Model-Agnostic)

### Design Principles

1. **No IDE lock-in**: All context lives in plain Markdown in `.ai/` directory
2. **No LLM lock-in**: Content works with any AI assistant (Claude, GPT, Gemini, etc.)
3. **Self-contained**: Each document provides complete context for its topic
4. **Copy-paste friendly**: Users can easily share context with any AI tool
5. **Maintainable**: Structure mirrors codebase for easy updates

### 2.1 The `.ai/` Directory

Create a structured directory of AI-consumable context:

```
.ai/
├── README.md                 # How to use these files with any AI assistant
├── architecture.md           # System architecture overview
├── agents/                   # Sub-agent role specifications
│   ├── README.md             # Workflow overview
│   ├── spec-writer.md        # Specification writing agent
│   ├── backend.md            # Backend implementation agent
│   ├── frontend.md           # Frontend implementation agent
│   └── code-review.md        # Code review agent
├── patterns/                 # Development patterns with examples
│   ├── api-endpoint.md       # How to create NestJS endpoints
│   ├── database-query.md     # How to use Drizzle with RLS
│   ├── background-job.md     # How to create BullMQ jobs
│   ├── react-hook.md         # How to create data fetching hooks
│   └── ui-component.md       # How to create shadcn/ui components
├── features/                 # Feature-specific context
│   ├── auth.md               # Authentication patterns
│   ├── multi-tenancy.md      # RLS and tenant context
│   ├── billing.md            # Stripe integration patterns
│   └── ...                   # One per major feature
├── schemas/
│   └── overview.md           # Database schema summary with relationships
└── prompts/                  # Reusable prompt templates
    ├── create-endpoint.md
    ├── add-feature-flag.md
    ├── create-background-job.md
    └── ...
```

### 2.2 Sub-Agent Workflow Specifications

Building on the existing `agents.md`, create detailed specifications for AI sub-agent roles:

| Agent | Role | Scope | Handoff |
|-------|------|-------|---------|
| **spec-writer** | Writes feature specifications | `/docs/specs/` only | → backend/frontend |
| **backend** | Implements API, worker, DB logic | `apps/api/`, `apps/worker/`, `packages/db/`, `packages/shared/` | → code-review |
| **frontend** | Implements UI, pages, components | `apps/web/`, `packages/ui/` | → code-review |
| **code-review** | Reviews, refactors, ensures quality | All files (read + refactor) | → done |

These specifications are abstract and can be implemented with any AI tool (Augment sub-agents, custom GPT agents, Claude projects, etc.).

### 2.3 Strategic Code Comments

Enhance key files with "AI-helper" comments:

```typescript
/**
 * @ai-context This service handles project CRUD operations.
 * @ai-pattern Follow this pattern for all org-scoped resources.
 * @ai-requires TenantContext for all operations (RLS enforcement).
 * @ai-emits project.created, project.updated, project.deleted audit logs.
 */
```

### 2.4 Prompt Templates

Create ready-to-use prompts for common tasks:

```markdown
## Create New API Endpoint

I need to create a new API endpoint for [RESOURCE].

Context:
- This is a ForgeStack project using NestJS + Drizzle ORM + PostgreSQL RLS
- Follow the existing patterns in apps/api/src/projects/ as reference
- The endpoint should be org-scoped (use TenantContext)

Requirements:
- [ ] Controller with Swagger decorators
- [ ] Service with business logic
- [ ] Repository for database operations
- [ ] DTOs with class-validator decorators
- [ ] Unit tests with mocked dependencies
- [ ] Integration with audit logs
```

---

## Part 3: Feature-Specific AI Helpers

### Quick Reference Table

| Feature | Key Files | Context Needed | Prompt Focus |
|---------|-----------|----------------|--------------|
| **Authentication** | `apps/api/src/auth/`, `apps/web/src/lib/auth*.ts` | better-auth config, session handling | Adding auth to new routes |
| **Multi-tenancy & RLS** | `packages/db/src/context.ts`, schema files | `withTenantContext` usage, RLS policies | Safe database queries |
| **RBAC & Permissions** | `apps/api/src/roles/`, `apps/api/src/permissions/` | 33 permissions, 11 resources | Adding permission checks |
| **Stripe Billing** | `apps/api/src/billing/` | Customer, subscription, webhook handling | Usage metering, checkout |
| **API Endpoints** | `apps/api/src/*/` | Controller → Service → Repository pattern | CRUD for new resources |
| **Background Jobs** | `apps/worker/src/handlers/` | Job data types, handler pattern | Adding new job types |
| **Database (Drizzle)** | `packages/db/src/schema/` | Table definitions, relations | Schema changes, migrations |
| **File Uploads** | `apps/api/src/files/` | Presigned URLs, R2/S3 | Adding file support |
| **Webhooks** | `apps/api/src/webhooks/` | Endpoint registration, delivery | Outgoing webhook events |
| **Feature Flags** | `apps/api/src/feature-flags/` | Plan-based gating, overrides | Adding feature gates |
| **Audit Logging** | `apps/api/src/audit-logs/` | Async logging via worker | Logging new actions |

---

## Part 4: File Structure & Naming Recommendations

### Current Structure (Already Good)

```
apps/
├── api/src/
│   └── {module}/
│       ├── {module}.controller.ts
│       ├── {module}.controller.spec.ts
│       ├── {module}.service.ts
│       ├── {module}.service.spec.ts
│       ├── {module}.repository.ts
│       ├── {module}.repository.spec.ts
│       ├── {module}.module.ts
│       └── dto/
│           ├── index.ts
│           ├── create-{module}.dto.ts
│           └── update-{module}.dto.ts
├── web/src/
│   ├── app/
│   ├── components/{feature}/
│   ├── hooks/use-{feature}.ts
│   ├── lib/
│   └── types/{feature}.ts
└── worker/src/
    └── handlers/{job-name}.handler.ts
```

### Recommendations for AI Navigation

1. **Add `README.md` to each module** - Brief description for AI context
2. **Add `PATTERNS.md` to `.ai/`** - Document why certain patterns exist
3. **Consistent export patterns** - Always use `dto/index.ts` barrel exports

---

## Part 5: Implementation Priority

### Phase 1: Core `.ai/` Structure (1-2 days) 🔴

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Create `.ai/README.md` | 1 hour | 🔥 High | Usage guide for any AI tool |
| Create `.ai/architecture.md` | 2 hours | 🔥 High | System overview |
| Create `.ai/agents/` specs | 2 hours | 🔥 High | Sub-agent roles |

### Phase 2: Pattern Documentation (2-3 days) 🟡

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Create `.ai/patterns/api-endpoint.md` | 2 hours | High | Pattern doc |
| Create `.ai/patterns/database-query.md` | 2 hours | High | Pattern doc |
| Create `.ai/patterns/background-job.md` | 1 hour | Medium | Pattern doc |
| Create `.ai/patterns/react-hook.md` | 1 hour | Medium | Pattern doc |
| Create `.ai/features/multi-tenancy.md` | 2 hours | High | Feature doc |
| Create `.ai/features/billing.md` | 2 hours | High | Feature doc |

### Phase 3: Prompt Templates (1-2 days) 🟢

| Task | Effort | Impact | Files |
|------|--------|--------|-------|
| Create endpoint creation prompt | 1 hour | Medium | `.ai/prompts/` |
| Create feature flag prompt | 30 min | Medium | `.ai/prompts/` |
| Create background job prompt | 30 min | Medium | `.ai/prompts/` |
| Create database migration prompt | 30 min | Medium | `.ai/prompts/` |
| Create webhook integration prompt | 30 min | Medium | `.ai/prompts/` |

### Phase 4: Code Enhancements (Ongoing) 🔵

| Task | Effort | Impact |
|------|--------|--------|
| Add JSDoc `@ai-*` tags to key files | Incremental | Medium |
| Add module README files | Incremental | Low |
| Standardize remaining inconsistencies | Incremental | Low |

---

## Appendix A: Comparison with IndieKit Pro

| IndieKit Feature | ForgeStack Equivalent | Notes |
|------------------|----------------------|-------|
| 20+ Claude Skills | `.ai/` directory with patterns & prompts | More comprehensive |
| Cursor-optimized | Any AI tool | Vendor-neutral |
| Preset prompts | `.ai/prompts/` templates | More customizable |
| Documentation | `docs/specs/` + `.ai/` | More structured |

### ForgeStack Advantages
1. **Model-agnostic** - Works with any LLM (Claude, GPT, Gemini, Llama, etc.)
2. **Editor-agnostic** - Works with Cursor, Windsurf, Copilot, Augment, etc.
3. **Open/Extensible** - Plain Markdown that users can modify
4. **Context-rich** - Leverages existing specs + test examples
5. **Sub-agent workflow** - Defined patterns for complex multi-agent tasks

---

## Appendix B: Maintenance Strategy

### Keeping AI Context Updated

1. **On feature changes**: Update relevant `.ai/patterns/` or `.ai/features/` docs
2. **On new modules**: Add to rules file patterns section
3. **On schema changes**: Update `.ai/schemas/overview.md`
4. **Version sync**: Rules files should mention ForgeStack version

### Automated Validation (Future)

```bash
# Lint AI context files
pnpm ai:lint

# Validate rules match codebase
pnpm ai:validate
```

---

## Next Steps

1. ✅ Create this analysis document
2. ✅ Create `.ai/README.md` - Usage guide
3. ✅ Create `.ai/architecture.md` - System overview
4. ✅ Create `.ai/agents/` - Sub-agent specifications
5. ✅ Create `.ai/patterns/` - Development patterns
6. ✅ Create `.ai/prompts/` - Reusable prompt templates
7. 🔲 Add to README and SETUP.md


