# ForgeStack Sub-Agent Workflow

> Abstract specifications for AI agents that can implement ForgeStack features.

## Overview

ForgeStack uses a **spec-driven, multi-agent workflow** for feature development. This approach can be implemented with any AI tooling:

- Augment sub-agents
- Custom GPT agents
- Claude projects
- AutoGPT/CrewAI/LangChain agents
- Manual prompting with clear role boundaries

## The Four Agents

| Agent | Primary Responsibility | Scope |
|-------|----------------------|-------|
| [spec-writer](./spec-writer.md) | Write feature specifications | `/docs/specs/` only |
| [backend](./backend.md) | Implement API, worker, database logic | `apps/api/`, `apps/worker/`, `packages/db/`, `packages/shared/` |
| [frontend](./frontend.md) | Implement UI, pages, components | `apps/web/`, `packages/ui/` |
| [code-review](./code-review.md) | Review and refine code quality | All files (read + refactor only) |

## Mandatory Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                      1. SPECIFICATION                           │
│                                                                  │
│   User Request ──▶ spec-writer ──▶ /docs/specs/<epic>/<story>.md │
│                                                                  │
│   Output: Acceptance criteria, tasks, test plan                 │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                    2. IMPLEMENTATION                            │
│                                                                  │
│   ┌─────────────┐         ┌──────────────┐                     │
│   │   backend   │ ──AND── │   frontend   │  (can run parallel) │
│   │             │         │              │                     │
│   │ - API       │         │ - Pages      │                     │
│   │ - Worker    │         │ - Components │                     │
│   │ - DB Schema │         │ - Hooks      │                     │
│   │ - Tests     │         │ - Tests      │                     │
│   └─────────────┘         └──────────────┘                     │
│                                                                  │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                      3. CODE REVIEW                             │
│                                                                  │
│   code-review ──▶ Review all changes ──▶ Approve or request fix │
│                                                                  │
│   Checks: Architecture compliance, RLS usage, test coverage,    │
│           code quality, security, performance                   │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
                          ✅ DONE
```

## Rules

### Strict Boundaries

1. **No agent may work outside its scope** - A backend agent cannot modify frontend files
2. **No implementation without specs** - The spec-writer must produce a spec first
3. **Mandatory code review** - Every implementation must be reviewed
4. **No feature expansion** - Agents implement exactly what's in the spec, nothing more

### Communication

Agents communicate through:
1. **Spec files** - spec-writer outputs, others read
2. **Code changes** - backend/frontend output, code-review reads
3. **Test results** - All agents verify tests pass

### Parallelization

- `backend` and `frontend` can run in parallel after spec is complete
- `code-review` must run after all implementation is complete
- Multiple features can be in different stages simultaneously

## Example Session

```
User: "Add a task management feature"

1. [spec-writer]
   Input: "Add a task management feature"
   Output: /docs/specs/epic-tasks/tasks-crud.md
   
2. [backend] (reads spec)
   Creates: apps/api/src/tasks/
   Creates: packages/db/src/schema/tasks.ts
   Creates: Unit tests for tasks module
   
3. [frontend] (reads spec, runs parallel with backend)
   Creates: apps/web/src/components/tasks/
   Creates: apps/web/src/hooks/use-tasks.ts
   Creates: Task pages and forms
   
4. [code-review] (runs after both complete)
   Reviews: All created files
   Checks: RLS usage, test coverage, patterns
   Output: Approval or requested changes
```

## Implementing with Your AI Tool

### Augment Sub-Agents
Configure sub-agents with the role descriptions from each agent's markdown file.

### Manual Prompting
Start each prompt with: "You are the ForgeStack [role] agent. Read .ai/agents/[role].md for your role definition."

### Custom Agents
Use the agent definitions as system prompts for your custom AI agents.

