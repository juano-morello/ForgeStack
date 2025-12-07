# Augment Sub-Agent Implementation Analysis

> Comprehensive analysis of `.augment/agents/` with recommendations for improvement.

## 1. Current State Assessment

### Agent Inventory

| Agent | File | Lines | Model | Description Quality |
|-------|------|-------|-------|---------------------|
| `forge-backend` | `forge-backend.md` | 62 | claude-sonnet-4-5 | Good |
| `forge-frontend` | `forge-frontend.md` | 50 | claude-sonnet-4-5 | Good |
| `code-review` | `forge-code-review.md` | 17 | claude-opus-4-1 | **Poor** |
| `forge-spec-writer` | `forge-spec-writer.md` | 36 | claude-opus-4-5 | Adequate |

### Agent Comparison: `.augment/agents/` vs `.ai/agents/`

| Aspect | `.augment/agents/` | `.ai/agents/` |
|--------|-------------------|---------------|
| **Role clarity** | Basic | Comprehensive |
| **Code examples** | Minimal | Extensive |
| **Checklists** | None | Completion checklists |
| **Error handling** | Not covered | Common issues documented |
| **Tool guidance** | None | N/A (model-agnostic) |
| **Workflow diagram** | None | Yes (in README.md) |
| **Output format** | Basic | Detailed templates |

### Tool Integration Assessment

**Current state**: The `.augment/agents/` files make **NO reference** to Augment-specific tools:

- ❌ No mention of `codebase-retrieval` for context gathering
- ❌ No mention of `str-replace-editor` for file modifications
- ❌ No mention of `view` for exploring code
- ❌ No mention of `launch-process` for running tests/builds
- ❌ No mention of task management tools for tracking work

---

## 2. Agent-by-Agent Analysis

### 2.1 `forge-backend.md`

**Strengths:**
- Clear scope boundaries (`apps/api/**`, `apps/worker/**`, `packages/db/**`, `packages/shared/**`)
- References `AGENTS.md` for global rules
- Mentions TDD requirement
- Emphasizes `withTenantContext` pattern
- Good output structure (summarize → edit → show results)

**Weaknesses:**
- **No Augment tool guidance**: Doesn't tell the agent to use `codebase-retrieval` before editing
- **No code examples**: Unlike `.ai/agents/backend.md` which has extensive patterns
- **No checklist**: Missing completion checklist to verify work
- **No error recovery**: No guidance on what to do if tests fail or build breaks
- **No reference to `.ai/`**: Could leverage patterns from `.ai/patterns/api-endpoint.md`

**Missing Context:**
- Key decorators (`@CurrentTenant`, `@RequirePermission`, `@Public`, `@NoOrgRequired`)
- Module structure template
- Swagger/OpenAPI requirements
- Audit logging expectations

### 2.2 `forge-frontend.md`

**Strengths:**
- Clear scope boundaries
- Mentions Storybook, Playwright requirements
- Emphasizes server components by default
- Good output workflow (read spec → identify → propose → implement → summarize)

**Weaknesses:**
- **No Augment tool guidance**
- **No code examples**: The `.ai/agents/frontend.md` has hook patterns, form patterns, etc.
- **No component structure guidance**: Missing directory conventions
- **No shadcn/ui component list**: Should reference what's available
- **No type import guidance**: Should emphasize `@forgestack/shared` imports

**Missing Context:**
- Route group structure (`(auth)`, `(protected)`, `(marketing)`, etc.)
- Available UI components in `packages/ui`
- API client usage patterns

### 2.3 `forge-code-review.md` ⚠️ CRITICAL ISSUES

**This agent definition is severely underdeveloped.**

**Current Content (17 lines):**
```markdown
- Review areas: Bugs, Security, Documentation, API contracts, Database errors, Typos
```

**Strengths:**
- Uses a more powerful model (opus-4-1)

**Critical Weaknesses:**
- **Only 17 lines** vs 184 lines in `.ai/agents/code-review.md`
- **No review checklist**: Should check RLS usage, architecture compliance, test coverage
- **No output format**: Doesn't specify how to report findings
- **No approval criteria**: When should the review approve vs request changes?
- **No ForgeStack-specific checks**: RLS bypass, controller layer separation, etc.
- **No staged changes reference**: Says "staged changes" but doesn't explain how to access them
- **No tool guidance**: Should use `view` to read files, `codebase-retrieval` to understand context

### 2.4 `forge-spec-writer.md`

**Strengths:**
- Clear scope (only `/docs/specs/**`)
- Output format specified
- Mentions test plan requirement

**Weaknesses:**
- **Minimal template**: The `.ai/agents/spec-writer.md` has a much more detailed template
- **No research guidance**: Should use `codebase-retrieval` to understand existing patterns
- **No dependency identification**: Should check for existing related specs
- **No RLS consideration**: Multi-tenancy should be considered in every spec
- **No quality checklist**: Missing verification steps before completion

---

## 3. Key Gaps Summary

### 3.1 Missing Tool Guidance (All Agents)

None of the agents explain how to use Augment's tools effectively:

```markdown
## Tool Usage (MISSING FROM ALL AGENTS)

Before making any changes:
1. Use `codebase-retrieval` to understand related code
2. Use `view` to read specific files
3. Plan changes before using `str-replace-editor`

During implementation:
4. Use `launch-process` to run tests: `pnpm test`
5. Use `launch-process` to verify build: `pnpm build`
6. Use task management tools to track progress

After completion:
7. Use `view` to verify changes
8. Run tests again to confirm nothing broke
```

### 3.2 Missing Context References

Agents don't reference the `.ai/` documentation we created:
- `.ai/patterns/api-endpoint.md` - Backend patterns
- `.ai/patterns/database-query.md` - RLS patterns  
- `.ai/patterns/react-hook.md` - Frontend patterns
- `.ai/features/*.md` - Feature-specific context
- `.ai/conventions.md` - Naming and style conventions
- `.ai/troubleshooting.md` - Common issues

### 3.3 Missing Error Recovery

No agent explains what to do when things go wrong:
- Build failures
- Test failures
- Type errors
- RLS policy violations
- Missing dependencies

### 3.4 Missing Parallelization Guidance

The agents don't explain when they can run in parallel vs. sequentially.

---

## 4. Recommendations (Prioritized)

### Tier 1: Critical (High Impact, Low-Medium Effort)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1.1 | **Rewrite `forge-code-review.md`** - Expand from 17 to ~150 lines with full checklist | 30 min | Critical |
| 1.2 | **Add Tool Usage section to all agents** - Document codebase-retrieval, view, str-replace-editor usage | 20 min | Critical |
| 1.3 | **Add `.ai/` references to all agents** - Point to relevant pattern/feature docs | 10 min | High |

### Tier 2: Important (High Impact, Medium Effort)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 2.1 | **Add code examples to backend agent** - Include controller, service, repository patterns | 20 min | High |
| 2.2 | **Add code examples to frontend agent** - Include hook, form, page patterns | 20 min | High |
| 2.3 | **Add completion checklists to all agents** - Verification steps before marking complete | 15 min | High |
| 2.4 | **Add error recovery section to all agents** - What to do when builds/tests fail | 15 min | Medium |

### Tier 3: Enhancements (Medium Impact)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 3.1 | **Create specialized agents** - database-migration, testing, security | 45 min | Medium |
| 3.2 | **Add workflow diagram to agents README** - Visual handoff process | 15 min | Medium |
| 3.3 | **Add parallelization guidance** - When agents can run concurrently | 10 min | Low |

---

## 5. Proposed New/Enhanced Agents

### 5.1 Specialized Agents to Consider

| Agent | Purpose | Scope |
|-------|---------|-------|
| `forge-migration` | Database schema changes, migrations | `packages/db/drizzle/**`, `packages/db/src/schema/**` |
| `forge-testing` | Write/fix tests, improve coverage | `**/test/**`, `**/*.spec.ts`, `**/*.test.ts` |
| `forge-security` | Security audits, vulnerability fixes | All files (read + security-specific changes) |
| `forge-performance` | Performance optimization, query analysis | All files (read + perf-specific changes) |

### 5.2 Recommendation

Start with **`forge-testing`** agent as it would:
- Reduce burden on backend/frontend agents
- Improve test coverage systematically
- Have clear, measurable success criteria

---

## 6. Immediate Action Items

### Priority 1: Fix Critical Issues

```bash
# Files to update
.augment/agents/forge-code-review.md  # Rewrite completely
.augment/agents/forge-backend.md       # Add tool guidance, examples
.augment/agents/forge-frontend.md      # Add tool guidance, examples  
.augment/agents/forge-spec-writer.md   # Add research guidance, checklist
```

### Priority 2: Create README

Create `.augment/agents/README.md` with:
- Workflow overview
- Agent responsibilities matrix
- Tool usage patterns
- Handoff procedures

### Priority 3: Consider New Agents

Evaluate adding:
- `forge-testing.md` - Dedicated testing agent
- `forge-migration.md` - Database migration specialist

