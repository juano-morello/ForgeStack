# Projects CRUD

**Epic:** Projects
**Priority:** #8
**Depends on:** Priority #7 (Organization Switcher)
**Status:** Draft

---

## Overview

This specification defines project management functionality in ForgeStack. Projects are org-scoped resources that enable teams to organize their work within an organization context.

### Core Capabilities

- **Org-scoped projects** – Projects belong to an organization (org_id)
- **Context-aware operations** – All project operations require org context via `X-Org-Id` header
- **RLS enforcement** – Row-Level Security automatically filters projects by current org
- **Full CRUD** – Users can create, list, view, update, and delete projects

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Projects List  │  │  Project Detail │  │  Create/Edit Form   │  │
│  │  /projects      │  │  /projects/:id  │  │  /projects/new      │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                      │              │
│           └────────────────────┼──────────────────────┘              │
│                                ▼                                     │
│              ┌───────────────────────────────────────┐              │
│              │  API Client (includes X-Org-Id)       │              │
│              └───────────────────┬───────────────────┘              │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │ X-Org-Id Header
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    TenantContextGuard                           │  │
│  │  1. Verify session (from better-auth)                          │  │
│  │  2. Extract X-Org-Id header                                    │  │
│  │  3. Verify user membership in org                              │  │
│  │  4. Attach TenantContext { userId, orgId, role }               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐            │
│  │              ProjectsModule                           │            │
│  │  ┌─────────────────────┐  ┌────────────────────────┐ │            │
│  │  │ ProjectsService     │  │ ProjectsController     │ │            │
│  │  │ - create()          │  │ POST /projects         │ │            │
│  │  │ - findAll()         │  │ GET /projects          │ │            │
│  │  │ - findOne()         │  │ GET /projects/:id      │ │            │
│  │  │ - update()          │  │ PATCH /projects/:id    │ │            │
│  │  │ - remove()          │  │ DELETE /projects/:id   │ │            │
│  │  └─────────────────────┘  └────────────────────────┘ │            │
│  └──────────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Database (Postgres)                           │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │   projects (RLS enabled)                                      │    │
│  │   - id: uuid (PK)                                             │    │
│  │   - org_id: uuid (FK → organizations.id)                      │    │
│  │   - name: varchar(255)                                        │    │
│  │   - description: text (nullable)                              │    │
│  │   - created_at: timestamp with time zone                      │    │
│  │   - updated_at: timestamp with time zone                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Org-scoped isolation** – RLS policies ensure users only see projects from their current org
- **Role-based access** – OWNER role required for DELETE operations
- **Members can create/edit** – Both OWNER and MEMBER roles can create and update projects
- **Automatic filtering** – RLS automatically scopes all queries to current org

---

## Acceptance Criteria

### API Endpoints

All endpoints require `X-Org-Id` header with a valid org ID where the user is a member.

#### 1. POST /api/v1/projects – Create Project

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER or MEMBER |
| Request Body | `{ name: string, description?: string }` |
| Response (201) | `{ id, orgId, name, description, createdAt, updatedAt }` |

**Behavior:**
- Validates `name` is non-empty string (1-255 chars)
- Validates `description` is string if provided (max 2000 chars)
- Sets `org_id` from tenant context (not from request body)
- Returns the created project

#### 2. GET /api/v1/projects – List Projects

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER or MEMBER |
| Query Params | `search?: string, page?: number, limit?: number` |
| Response (200) | `{ items: Project[], total: number, page: number, limit: number }` |

**Behavior:**
- Returns only projects belonging to current org (via RLS)
- Supports optional text search on `name` and `description`
- Supports pagination with `page` (default: 1) and `limit` (default: 20, max: 100)
- Sorted by `created_at` descending (newest first)

#### 3. GET /api/v1/projects/:id – Get Project Details

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER or MEMBER |
| Response (200) | `{ id, orgId, name, description, createdAt, updatedAt }` |
| Response (404) | If project doesn't exist or belongs to another org |

**Behavior:**
- Returns full project details
- RLS ensures project must belong to current org
- Returns 404 if project not found (security: don't reveal existence)

#### 4. PATCH /api/v1/projects/:id – Update Project

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER or MEMBER |
| Request Body | `{ name?: string, description?: string }` |
| Response (200) | `{ id, orgId, name, description, createdAt, updatedAt }` |
| Response (404) | If project doesn't exist or belongs to another org |

**Behavior:**
- Partial update (only provided fields are changed)
- Updates `updated_at` timestamp automatically
- RLS ensures project must belong to current org

#### 5. DELETE /api/v1/projects/:id – Delete Project

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER only |
| Response (200) | `{ success: true }` |
| Response (403) | If user is not OWNER |
| Response (404) | If project doesn't exist or belongs to another org |

**Behavior:**
- Only OWNER role can delete projects
- Returns 403 Forbidden if user is MEMBER
- Hard delete (no soft delete for v1)

### Frontend Requirements

1. **Projects List Page (`/projects`)**
   - Display paginated list of projects in current org
   - Show project name, description preview, and timestamps
   - Search/filter functionality
   - "Create Project" button
   - Empty state when no projects exist

2. **Project Detail Page (`/projects/:id`)**
   - Display full project information
   - Edit button (for OWNER and MEMBER)
   - Delete button (for OWNER only)
   - Breadcrumb navigation back to list

3. **Create Project Page/Modal (`/projects/new`)**
   - Form with name (required) and description (optional) inputs
   - Validation feedback
   - Cancel and Submit buttons
   - Redirect to project detail on success

4. **Edit Project Page/Modal (`/projects/:id/edit`)**
   - Pre-filled form with current values
   - Same validation as create
   - Cancel and Save buttons
   - Redirect to project detail on success

5. **Delete Confirmation Dialog**
   - Modal confirming project deletion
   - Shows project name
   - Cancel and Delete buttons
   - Redirect to list on success

6. **Empty State Component**
   - Shown when no projects exist
   - Friendly message and illustration
   - "Create your first project" CTA

---

## Tasks & Subtasks

### Backend Tasks

#### 1. Create ProjectsModule
- [ ] Create `apps/api/src/projects/projects.module.ts`
- [ ] Register service and controller
- [ ] Import required dependencies (DrizzleModule, etc.)

#### 2. Create ProjectsService
- [ ] Create `apps/api/src/projects/projects.service.ts`
- [ ] Implement `create(ctx, dto)` – creates project with `withTenantContext`
- [ ] Implement `findAll(ctx, query)` – returns paginated projects
- [ ] Implement `findOne(ctx, id)` – returns single project
- [ ] Implement `update(ctx, id, dto)` – updates project fields
- [ ] Implement `remove(ctx, id)` – deletes project (OWNER check)

#### 3. Create ProjectsController
- [ ] Create `apps/api/src/projects/projects.controller.ts`
- [ ] Implement `POST /projects` endpoint
- [ ] Implement `GET /projects` endpoint with query params
- [ ] Implement `GET /projects/:id` endpoint
- [ ] Implement `PATCH /projects/:id` endpoint
- [ ] Implement `DELETE /projects/:id` endpoint with `@Roles('OWNER')`

#### 4. Create DTOs
- [ ] Create `apps/api/src/projects/dto/create-project.dto.ts`
- [ ] Create `apps/api/src/projects/dto/update-project.dto.ts`
- [ ] Create `apps/api/src/projects/dto/project-query.dto.ts` (pagination/search)
- [ ] Add validation decorators (class-validator)

#### 5. Add Pagination Support
- [ ] Create reusable pagination helper/interface
- [ ] Implement offset-based pagination in service
- [ ] Return total count for frontend pagination

#### 6. Add Search/Filter Support
- [ ] Implement ILIKE search on name and description
- [ ] Handle empty search query gracefully

### Frontend Tasks

#### 1. Create Projects List Component
- [ ] Create `apps/web/src/components/projects/projects-list.tsx`
- [ ] Display project cards in grid/list layout
- [ ] Handle loading and error states
- [ ] Implement pagination controls

#### 2. Create Project Card Component
- [ ] Create `apps/web/src/components/projects/project-card.tsx`
- [ ] Show name, description excerpt, timestamps
- [ ] Link to project detail page
- [ ] Hover/focus states

#### 3. Create Project Form Component
- [ ] Create `apps/web/src/components/projects/project-form.tsx`
- [ ] Reusable for both create and edit
- [ ] Name input (required, max 255 chars)
- [ ] Description textarea (optional, max 2000 chars)
- [ ] Form validation with error messages
- [ ] Submit handler with loading state

#### 4. Add /projects Page
- [ ] Create `apps/web/src/app/(dashboard)/projects/page.tsx`
- [ ] Use ProjectsList component
- [ ] Add search input
- [ ] Add "Create Project" button
- [ ] Handle empty state

#### 5. Add /projects/new Page
- [ ] Create `apps/web/src/app/(dashboard)/projects/new/page.tsx`
- [ ] Use ProjectForm component
- [ ] Call POST /projects API
- [ ] Redirect to /projects/:id on success

#### 6. Add /projects/:id Page
- [ ] Create `apps/web/src/app/(dashboard)/projects/[id]/page.tsx`
- [ ] Fetch and display project details
- [ ] Show edit button (conditionally by role)
- [ ] Show delete button (OWNER only)

#### 7. Add /projects/:id/edit Page
- [ ] Create `apps/web/src/app/(dashboard)/projects/[id]/edit/page.tsx`
- [ ] Fetch current project data
- [ ] Use ProjectForm with pre-filled values
- [ ] Call PATCH /projects/:id API
- [ ] Redirect to /projects/:id on success

#### 8. Add Delete Confirmation Dialog
- [ ] Create `apps/web/src/components/projects/delete-project-dialog.tsx`
- [ ] Confirmation modal with project name
- [ ] Call DELETE /projects/:id API
- [ ] Redirect to /projects on success

#### 9. Update Dashboard with Recent Projects Widget
- [ ] Add recent projects section to dashboard
- [ ] Show 5 most recent projects
- [ ] Quick link to /projects page

---

## Test Plan

### Backend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `ProjectsService.create()` creates project | Returns project with generated ID and orgId |
| `ProjectsService.create()` sets orgId from context | orgId matches ctx.orgId, not from DTO |
| `ProjectsService.findAll()` uses RLS | Only returns projects for ctx.orgId |
| `ProjectsService.findAll()` paginates correctly | Returns correct items, total, page, limit |
| `ProjectsService.findAll()` searches name/description | ILIKE filter works |
| `ProjectsService.findOne()` returns project | Full project returned |
| `ProjectsService.findOne()` returns null for other org | RLS prevents access |
| `ProjectsService.update()` updates fields | Only provided fields changed |
| `ProjectsService.update()` sets updatedAt | Timestamp updated |
| `ProjectsService.remove()` deletes project | Project no longer exists |

### Backend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `POST /projects` returns 201 with project data | Created project returned |
| `POST /projects` sets org_id from X-Org-Id header | orgId matches header |
| `POST /projects` without auth returns 401 | Unauthorized error |
| `POST /projects` without X-Org-Id returns 400 | Bad request error |
| `GET /projects` returns only current org's projects | Other orgs' projects not included |
| `GET /projects` pagination works | Correct page/limit/total |
| `GET /projects?search=foo` filters results | Only matching projects returned |
| `GET /projects/:id` returns project details | Full project data |
| `GET /projects/:id` returns 404 for other org's project | Not found error |
| `PATCH /projects/:id` updates project | Updated project returned |
| `PATCH /projects/:id` returns 404 for non-existent | Not found error |
| `DELETE /projects/:id` requires OWNER role | 403 if MEMBER |
| `DELETE /projects/:id` as OWNER succeeds | Project deleted |
| `DELETE /projects/:id` returns 404 for other org | Not found error |

### Frontend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| ProjectsList renders projects | All projects displayed |
| ProjectsList shows empty state | Empty component shown when no projects |
| ProjectsList pagination works | Page controls functional |
| ProjectCard renders correctly | Name, description, dates visible |
| ProjectForm validates required name | Shows error if empty |
| ProjectForm validates name length | Shows error if > 255 chars |
| ProjectForm submits correctly | onSubmit called with form data |
| DeleteProjectDialog shows project name | Name visible in modal |
| DeleteProjectDialog calls onDelete | Handler called on confirm |

### Frontend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Create project with valid data | Project created, redirected |
| Create project shows validation errors | Errors displayed |
| Project list fetches and displays | API called, projects rendered |
| Project detail page shows data | All fields displayed |
| Edit project updates values | Changes saved, redirected |
| Delete project removes it | Project deleted, redirected |
| Search filters project list | Only matching results shown |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Create first project | Login → Select org → Go to /projects → Create project | Project created and displayed |
| View project details | Navigate to project list → Click project → View details | Details page shows all info |
| Edit project | Go to project detail → Click edit → Change name → Save | Name updated |
| Delete project (OWNER) | Go to project detail → Click delete → Confirm | Project removed from list |
| Delete button hidden (MEMBER) | Login as MEMBER → Go to project detail | Delete button not visible |
| Search projects | Go to /projects → Enter search term → Results filtered | Only matching projects shown |
| Pagination | Create 25 projects → Navigate pages | Correct items per page |
| Empty state | New org with no projects → Go to /projects | Empty state displayed |

---

## Implementation Notes

### Project Structure

```
apps/api/src/
├── projects/
│   ├── projects.module.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── dto/
│       ├── create-project.dto.ts
│       ├── update-project.dto.ts
│       ├── project-query.dto.ts
│       └── index.ts
└── ...

apps/web/src/
├── app/
│   └── (dashboard)/
│       ├── projects/
│       │   ├── page.tsx           # Projects list
│       │   ├── new/
│       │   │   └── page.tsx       # Create project
│       │   └── [id]/
│       │       ├── page.tsx       # Project detail
│       │       └── edit/
│       │           └── page.tsx   # Edit project
│       └── page.tsx               # Dashboard with recent projects
├── components/
│   └── projects/
│       ├── projects-list.tsx
│       ├── project-card.tsx
│       ├── project-form.tsx
│       ├── delete-project-dialog.tsx
│       └── empty-state.tsx
├── hooks/
│   └── use-projects.ts
└── types/
    └── project.ts
```

### DTOs Example

```typescript
// apps/api/src/projects/dto/create-project.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

// apps/api/src/projects/dto/project-query.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProjectQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Service Example

```typescript
// apps/api/src/projects/projects.service.ts
@Injectable()
export class ProjectsService {
  async create(ctx: TenantContext, dto: CreateProjectDto) {
    return withTenantContext(ctx, async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          orgId: ctx.orgId,
          name: dto.name,
          description: dto.description,
        })
        .returning();
      return project;
    });
  }

  async findAll(ctx: TenantContext, query: ProjectQueryDto) {
    return withTenantContext(ctx, async (tx) => {
      const { search, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      let baseQuery = tx.select().from(projects);

      if (search) {
        baseQuery = baseQuery.where(
          or(
            ilike(projects.name, `%${search}%`),
            ilike(projects.description, `%${search}%`)
          )
        );
      }

      const items = await baseQuery
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count: total }] = await tx
        .select({ count: count() })
        .from(projects)
        .where(/* same where clause */);

      return { items, total, page, limit };
    });
  }

  async remove(ctx: TenantContext, id: string) {
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can delete projects');
    }

    return withTenantContext(ctx, async (tx) => {
      const [deleted] = await tx
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      if (!deleted) {
        throw new NotFoundException('Project not found');
      }

      return { success: true };
    });
  }
}
```

### Frontend Project Type

```typescript
// apps/web/src/types/project.ts
export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}
```

---

## Security Considerations

1. **Org isolation** – RLS policies ensure users only access their org's projects
2. **Role enforcement** – DELETE requires OWNER role (checked in service + RLS)
3. **Input validation** – DTOs validate and sanitize all input
4. **404 vs 403** – Return 404 for other org's resources (don't reveal existence)
5. **X-Org-Id validation** – TenantContextGuard validates header and membership

---

## Dependencies

- **Priority #7** (Organization Switcher) – Required for X-Org-Id header
- **@forgestack/db** – Database layer with projects table and RLS
- **TenantContextGuard** – Extracts and validates org context
- **withTenantContext()** – Sets RLS session variables

---

## Future Enhancements (Out of Scope for v1)

- Project archiving (soft delete)
- Project templates
- Project duplication
- Project-level permissions
- Project activity log
- Project tags/labels
- Project favorites
- Bulk project operations

---

*End of spec*

