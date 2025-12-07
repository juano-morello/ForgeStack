# ForgeStack AI Context

> Universal AI-friendly documentation for any LLM-powered coding assistant.

This directory contains structured context that helps AI assistants understand ForgeStack's architecture, patterns, and conventions. It's designed to be **completely model-agnostic** and **vendor-neutral**.

## How to Use

### With Any AI Coding Assistant

1. **Reference specific files**: Share the relevant `.ai/` files with your AI when asking about specific topics
2. **Use prompt templates**: Copy prompts from `.ai/prompts/` and fill in your requirements
3. **Provide architecture context**: Share `.ai/architecture.md` when the AI needs to understand the overall system

### Examples

```
# When creating a new API endpoint
"Read .ai/patterns/api-endpoint.md and create a new Tasks endpoint following this pattern"

# When working on billing features
"Read .ai/features/billing.md and help me add a new subscription tier"

# When orchestrating complex work
"Follow the workflow in .ai/agents/README.md to implement this feature"
```

### IDE-Specific Instructions

| Tool | How to Use |
|------|------------|
| **Cursor** | Add `.ai/` to your project context or reference files in chat |
| **Windsurf** | Include `.ai/` files in your workspace indexing |
| **GitHub Copilot** | Reference files with `@file` in Copilot Chat |
| **Augment** | Files are automatically indexed; use codebase-retrieval |
| **Claude/ChatGPT** | Copy-paste relevant sections into your conversation |

## Directory Structure

```
.ai/
├── README.md               # This file
├── architecture.md         # System architecture overview
├── conventions.md          # Code style and naming conventions
├── troubleshooting.md      # Common issues and solutions
├── agents/                 # Sub-agent role specifications
│   ├── README.md           # Workflow overview
│   ├── spec-writer.md      # Specification writing agent
│   ├── backend.md          # Backend implementation agent
│   ├── frontend.md         # Frontend implementation agent
│   └── code-review.md      # Code review agent
├── features/               # Feature-specific documentation
│   ├── authentication.md   # better-auth integration
│   ├── multi-tenancy.md    # RLS and tenant context
│   ├── billing.md          # Stripe integration
│   ├── api-keys.md         # API key management
│   ├── webhooks.md         # Outgoing and incoming webhooks
│   ├── emails.md           # Email templates with react-email
│   └── ai-integration.md   # Vercel AI SDK integration
├── patterns/               # Development patterns with examples
│   ├── api-endpoint.md     # How to create NestJS endpoints
│   ├── database-query.md   # How to use Drizzle with RLS
│   ├── background-job.md   # How to create BullMQ jobs
│   ├── react-hook.md       # How to create data fetching hooks
│   └── seo.md              # SEO patterns (metadata, sitemap, OG)
├── prompts/                # Reusable prompt templates
│   ├── create-endpoint.md  # API endpoint prompt
│   ├── create-job.md       # Background job prompt
│   ├── add-feature.md      # Full-stack feature prompt
│   ├── write-tests.md      # Test writing prompt
│   ├── add-page.md         # Next.js page prompt
│   ├── add-component.md    # React component prompt
│   ├── debug-issue.md      # Debugging prompt
│   └── write-copy.md       # Marketing copy generation
└── schemas/
    └── overview.md         # Database schema summary
```

## Quick Reference

### Critical Rules

1. **Multi-tenancy**: ALL org-scoped database queries MUST use `withTenantContext(ctx, fn)`
2. **Architecture layers**: Controller → Service → Repository (no shortcuts)
3. **Type safety**: Never use `any`; all types live in `@forgestack/shared`
4. **Testing**: Tests are mandatory; 95%+ coverage required
5. **Specs first**: Features begin with specs in `/docs/specs/`

### Key Files to Reference

| Topic | File |
|-------|------|
| Overall architecture | `.ai/architecture.md` |
| Code conventions | `.ai/conventions.md` |
| Troubleshooting | `.ai/troubleshooting.md` |
| Database schema | `.ai/schemas/overview.md` |
| Creating API endpoints | `.ai/patterns/api-endpoint.md` |
| Database with RLS | `.ai/patterns/database-query.md` |
| Background jobs | `.ai/patterns/background-job.md` |
| React data fetching | `.ai/patterns/react-hook.md` |
| Authentication | `.ai/features/authentication.md` |
| Multi-tenancy | `.ai/features/multi-tenancy.md` |
| Billing/Stripe | `.ai/features/billing.md` |
| API keys | `.ai/features/api-keys.md` |
| Webhooks | `.ai/features/webhooks.md` |
| Email templates | `.ai/features/emails.md` |
| AI/LLM integration | `.ai/features/ai-integration.md` |
| SEO patterns | `.ai/patterns/seo.md` |
| Marketing copy | `.ai/prompts/write-copy.md` |
| Complex feature workflow | `.ai/agents/README.md` |

## Relationship to agents.md

The root `agents.md` file contains high-level project configuration and rules. The `.ai/` directory expands on this with:

- Detailed code patterns with examples
- Step-by-step prompt templates
- Sub-agent workflow specifications
- Feature-specific context

Think of `agents.md` as the "what" and `.ai/` as the "how".

