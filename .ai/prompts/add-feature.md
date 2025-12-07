# Prompt: Add New Feature (Full Stack)

> Copy this prompt to implement a complete feature following ForgeStack's spec-driven workflow.

---

## Prompt Template

```
I need to add a new feature to ForgeStack: [FEATURE_NAME]

## Overview
[Describe what the feature does and why it's needed]

## User Stories
As a [role], I want to [action], so that [benefit].

## Context
This is a ForgeStack project. Please follow the multi-agent workflow:
1. First, create a spec in /docs/specs/
2. Then implement backend (API, worker, database)
3. Then implement frontend (pages, components, hooks)
4. Finally, review the code

Read these files for context:
- agents.md (project overview)
- .ai/agents/README.md (workflow)
- .ai/architecture.md (system architecture)

## Requirements

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Technical Requirements
- Database: [new tables needed?]
- API: [new endpoints needed?]
- Worker: [background jobs needed?]
- Frontend: [pages/components needed?]

### Permissions
- [List any new permissions needed]

### Integration Points
- [List any existing features this integrates with]

## Constraints
- Must use RLS for all org-scoped data
- Must have 90%+ test coverage
- Must include audit logging for mutations
- Must follow existing UI patterns

## Deliverables
1. Spec file in /docs/specs/epic-[name]/[feature].md
2. Database schema changes
3. API endpoints with tests
4. Worker jobs (if needed)
5. Frontend pages and components
6. Hook tests
```

---

## Example: Adding Task Comments Feature

```
I need to add a new feature to ForgeStack: Task Comments

## Overview
Allow users to add comments to tasks for collaboration and discussion.

## User Stories
- As a team member, I want to comment on tasks, so that I can discuss work with colleagues.
- As a project manager, I want to see comment history, so that I can track discussions.

## Context
Read agents.md and .ai/agents/README.md for the workflow.

## Requirements

### Acceptance Criteria
- [ ] Users can add text comments to any task they can view
- [ ] Comments show author name and timestamp
- [ ] Comments are ordered newest-first
- [ ] Users can delete their own comments
- [ ] Owners can delete any comment
- [ ] Adding a comment creates an activity feed entry
- [ ] Task assignee is notified of new comments

### Technical Requirements
- Database: task_comments table with orgId, taskId, userId, content, createdAt
- API: GET/POST/DELETE /api/v1/tasks/:taskId/comments
- Worker: Notification job when comment added
- Frontend: Comment list component, comment form, inline on task detail page

### Permissions
- task:read required to view comments
- task:update required to add comments
- task:delete required to delete others' comments

### Integration Points
- Tasks module (parent resource)
- Activity feed (log comment events)
- Notifications (notify assignee)
- Audit logs (track deletions)

## Constraints
- RLS enforced via task's orgId
- Max comment length: 10,000 characters
- No file attachments (future feature)

## Deliverables
Follow the spec-driven workflow to implement this feature.
```

---

## Workflow Steps

### Step 1: Create Spec
```
Acting as the spec-writer agent (read .ai/agents/spec-writer.md),
create a specification for this feature at:
/docs/specs/epic-[name]/[feature].md
```

### Step 2: Implement Backend
```
Acting as the backend agent (read .ai/agents/backend.md),
implement the backend based on the spec:
- Database schema
- API endpoints
- Worker jobs
- Unit tests
```

### Step 3: Implement Frontend
```
Acting as the frontend agent (read .ai/agents/frontend.md),
implement the frontend based on the spec:
- Pages and components
- Data fetching hooks
- Hook tests
```

### Step 4: Code Review
```
Acting as the code-review agent (read .ai/agents/code-review.md),
review all changes for:
- RLS compliance
- Test coverage
- Code quality
- Security
```

---

## Checklist for Complete Feature

### Spec
- [ ] Spec file created in /docs/specs/
- [ ] Acceptance criteria are testable
- [ ] Tasks broken down to implementable size

### Backend
- [ ] Database schema with RLS-compatible structure
- [ ] Repository with withTenantContext
- [ ] Service with business logic
- [ ] Controller with Swagger docs
- [ ] DTOs with validation
- [ ] Unit tests passing

### Frontend
- [ ] Components following shadcn/ui patterns
- [ ] Data fetching hook with SWR
- [ ] Loading and error states
- [ ] Hook tests passing

### Integration
- [ ] Audit logging for mutations
- [ ] Activity feed entries
- [ ] Notifications (if applicable)
- [ ] Permissions enforced

