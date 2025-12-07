# Prompt: Create New API Endpoint

> Copy this prompt and fill in the placeholders to create a new API endpoint.

---

## Prompt Template

```
I need to create a new API endpoint for [RESOURCE_NAME] in ForgeStack.

## Context
This is a ForgeStack project using:
- NestJS 11 for the backend
- Drizzle ORM with PostgreSQL
- Row-Level Security (RLS) for multi-tenancy
- BullMQ for background jobs

Please read these files for patterns:
- .ai/patterns/api-endpoint.md
- .ai/patterns/database-query.md
- .ai/architecture.md

## Requirements

### Resource: [RESOURCE_NAME]
- Description: [What this resource represents]
- Org-scoped: [Yes/No - most resources are org-scoped]

### Fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| [field1] | [type] | [yes/no] | [description] |
| [field2] | [type] | [yes/no] | [description] |

### Endpoints Needed:
- [ ] GET /api/v1/[resources] - List all
- [ ] GET /api/v1/[resources]/:id - Get by ID
- [ ] POST /api/v1/[resources] - Create
- [ ] PATCH /api/v1/[resources]/:id - Update
- [ ] DELETE /api/v1/[resources]/:id - Delete

### Permissions:
- Read: [permission name, e.g., 'task:read']
- Create: [permission name]
- Update: [permission name]
- Delete: [permission name]

### Side Effects:
- [ ] Audit logging on mutations
- [ ] Activity feed updates
- [ ] Notifications
- [ ] Other: [specify]

## Deliverables
1. Database schema (packages/db/src/schema/[resource].ts)
2. Controller with Swagger decorators
3. Service with business logic
4. Repository with RLS-safe queries
5. DTOs with validation
6. Module registration
7. Unit tests for all layers
8. Shared types exported from @forgestack/shared
```

---

## Example: Creating a Tasks Endpoint

```
I need to create a new API endpoint for Tasks in ForgeStack.

## Context
This is a ForgeStack project using NestJS, Drizzle ORM with PostgreSQL RLS, and BullMQ.

Please read these files for patterns:
- .ai/patterns/api-endpoint.md
- .ai/patterns/database-query.md

## Requirements

### Resource: Tasks
- Description: To-do items that belong to a project
- Org-scoped: Yes

### Fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string(255) | yes | Task title |
| description | text | no | Detailed description |
| status | enum | yes | todo, in_progress, done |
| dueDate | timestamp | no | When task is due |
| projectId | uuid | yes | Reference to project |
| assigneeId | uuid | no | Assigned user |

### Endpoints Needed:
- [x] GET /api/v1/tasks - List all tasks (filterable by project, status)
- [x] GET /api/v1/tasks/:id - Get task by ID
- [x] POST /api/v1/tasks - Create task
- [x] PATCH /api/v1/tasks/:id - Update task
- [x] DELETE /api/v1/tasks/:id - Delete task

### Permissions:
- Read: task:read
- Create: task:create  
- Update: task:update
- Delete: task:delete

### Side Effects:
- [x] Audit logging on create, update, delete
- [x] Activity feed for task status changes
- [ ] Notifications when assigned

## Deliverables
Create all files following the patterns in .ai/patterns/api-endpoint.md
```

---

## Checklist for AI Response

After the AI generates code, verify:

- [ ] Schema uses `pgTable` with proper types
- [ ] Schema includes `orgId` with foreign key to organizations
- [ ] Repository uses `withTenantContext` for ALL queries
- [ ] Controller has `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`
- [ ] Controller uses `@CurrentTenant()` decorator
- [ ] Controller uses `@RequirePermission()` for each endpoint
- [ ] Service handles audit logging via AuditLogsService
- [ ] DTOs have `@ApiProperty` and class-validator decorators
- [ ] Types are exported from `@forgestack/shared`
- [ ] Unit tests mock dependencies properly
- [ ] Module is registered in app.module.ts

