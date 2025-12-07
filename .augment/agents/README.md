# ForgeStack Augment Sub-Agents

> Augment-specific sub-agent definitions for ForgeStack development.

## Overview

ForgeStack uses a **spec-driven, multi-agent workflow** for feature development. These agents are configured specifically for Augment's sub-agent system.

## Agent Inventory

| Agent | Model             | Description | Scope |
|-------|-------------------|-------------|-------|
| [forge-spec-writer](./forge-spec-writer.md) | claude-opus-4-5   | Write feature specifications | `/docs/specs/` |
| [forge-backend](./forge-backend.md) | claude-sonnet-4-5 | Implement API, worker, DB | `apps/api/`, `apps/worker/`, `packages/db/`, `packages/shared/` |
| [forge-frontend](./forge-frontend.md) | claude-sonnet-4-5 | Implement UI, pages, components | `apps/web/`, `packages/ui/` |
| [code-review](./forge-code-review.md) | claude-opus-4-5   | Review code quality | All files (read + refactor) |

---

## Mandatory Workflow

```
┌────────────────────────────────────────────────────────────────────┐
│                        1. SPECIFICATION                             │
│                                                                      │
│   User Request ──▶ forge-spec-writer ──▶ /docs/specs/<epic>/<story>.md │
│                                                                      │
│   Output: Acceptance criteria, tasks, test plan                     │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                      2. IMPLEMENTATION                              │
│                                                                      │
│   ┌───────────────┐         ┌────────────────┐                     │
│   │ forge-backend │ ──AND── │ forge-frontend │  (can run parallel) │
│   │               │         │                │                     │
│   │ - API         │         │ - Pages        │                     │
│   │ - Worker      │         │ - Components   │                     │
│   │ - DB Schema   │         │ - Hooks        │                     │
│   │ - Tests       │         │ - Tests        │                     │
│   └───────────────┘         └────────────────┘                     │
│                                                                      │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                        3. CODE REVIEW                               │
│                                                                      │
│   code-review ──▶ Review all changes ──▶ Approve or request fix    │
│                                                                      │
│   Checks: RLS compliance, architecture, test coverage, security    │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
                            ✅ DONE
```

---

## Strict Rules

### 1. Scope Boundaries
- **No agent may work outside its scope**
- Backend agent cannot modify frontend files
- Frontend agent cannot modify backend files
- Spec-writer cannot write code

### 2. Spec-First Development
- **No implementation without specs**
- Every feature starts with forge-spec-writer
- Implementation agents read specs before coding

### 3. Mandatory Code Review
- **Every implementation must be reviewed**
- code-review runs after backend/frontend complete
- Must pass review before feature is done

### 4. No Feature Expansion
- **Implement exactly what's in the spec**
- Don't add features not specified
- Flag spec gaps rather than assuming

---

## Augment Tool Usage

All agents should use Augment's tools effectively:

### Context Gathering
```
codebase-retrieval: "How is [feature] implemented?"
```

### File Reading
```
view: /path/to/file.ts
view with search_query_regex: "pattern" to find specific code
```

### File Editing
```
str-replace-editor: For precise, targeted edits
```

### Running Commands
```
launch-process: pnpm test, pnpm build, pnpm typecheck
```

### Task Tracking
```
Use task management tools to track progress
```

---

## Context References

All agents should consult the `.ai/` directory for patterns and context:

| Topic | Reference |
|-------|-----------|
| Architecture | `.ai/architecture.md` |
| Code conventions | `.ai/conventions.md` |
| API patterns | `.ai/patterns/api-endpoint.md` |
| Database patterns | `.ai/patterns/database-query.md` |
| React patterns | `.ai/patterns/react-hook.md` |
| Feature docs | `.ai/features/*.md` |
| Common issues | `.ai/troubleshooting.md` |

---

## Parallelization

| Phase | Agents | Parallel? |
|-------|--------|-----------|
| Specification | forge-spec-writer | No (sequential) |
| Implementation | forge-backend, forge-frontend | **Yes** |
| Review | code-review | No (after implementation) |

---

## Error Escalation

If an agent is stuck after 3 attempts:
1. Document the specific issue
2. List what was tried
3. Escalate to the orchestrator
4. Do NOT keep retrying the same approach

---

## Quick Reference

### Starting a Feature
```
1. Run forge-spec-writer with the feature request
2. Review the generated spec
3. Run forge-backend and forge-frontend in parallel
4. Run code-review on all changes
5. Commit when review passes
```

### Common Commands
```bash
pnpm test          # Run tests
pnpm build         # Build all packages
pnpm typecheck     # Check TypeScript types
pnpm lint          # Run linter
pnpm dev           # Start development servers
```

