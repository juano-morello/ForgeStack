# Organization Management

**Epic:** Organizations
**Priority:** #6
**Depends on:** Priority #5 (better-auth Integration)
**Status:** Draft

---

## Overview

This specification defines organization management functionality in ForgeStack. Organizations are the primary tenant boundary for multi-tenant data isolation.

### Core Capabilities

- **Create organizations** – Authenticated users can create new organizations
- **Automatic ownership** – The creator automatically becomes the OWNER of the new organization
- **Multi-org membership** – Users can belong to multiple organizations
- **Organization listing** – Users can view all organizations they are members of
- **Organization context** – Active organization is set via `X-Org-Id` header in API requests

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Create Org     │  │  Org List       │  │  Org Selector       │  │
│  │  Modal/Page     │  │  Dashboard      │  │  Header Dropdown    │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                      │              │
│           └────────────────────┼──────────────────────┘              │
│                                ▼                                     │
│              ┌───────────────────────────────────────┐              │
│              │  API Client (includes X-Org-Id)       │              │
│              │  + localStorage/cookie for active org │              │
│              └───────────────────┬───────────────────┘              │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │ X-Org-Id Header
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    TenantContextGuard                           │  │
│  │  1. Verify session (from better-auth)                          │  │
│  │  2. Check @NoOrgRequired() decorator                           │  │
│  │  3. If org required: extract X-Org-Id, verify membership       │  │
│  │  4. Attach TenantContext { userId, orgId, role }               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐            │
│  │              OrganizationsModule                      │            │
│  │  ┌─────────────────────┐  ┌────────────────────────┐ │            │
│  │  │ OrganizationsService│  │ OrganizationsController│ │            │
│  │  │ - create()          │  │ POST /organizations    │ │            │
│  │  │ - findAll()         │  │ GET /organizations     │ │            │
│  │  │ - findOne()         │  │ GET /organizations/:id │ │            │
│  │  │ - update()          │  │ PATCH /organizations/:id│ │            │
│  │  │ - remove()          │  │ DELETE /organizations/:id│ │           │
│  │  └─────────────────────┘  └────────────────────────┘ │            │
│  └──────────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Database (Postgres)                           │
│  ┌──────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
│  │   organizations  │  │ organization_members  │  │   projects    │  │
│  │   (RLS enabled)  │◄─┤ (RLS enabled)         │  │ (RLS enabled) │  │
│  │                  │  │ userId + orgId + role │  │               │  │
│  └──────────────────┘  └───────────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Org-scoped isolation** – RLS policies ensure users only see data from orgs they belong to
- **Role-based access** – OWNER role required for destructive operations
- **No-org endpoints** – Some endpoints (create org, list orgs) don't require org context
- **Seamless switching** – Users can switch active org without re-authentication

---

## Acceptance Criteria

### API Endpoints

#### 1. POST /api/v1/organizations – Create Organization

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | No (uses `@NoOrgRequired()`) |
| Request Body | `{ name: string }` |
| Response (201) | `{ id: string, name: string, createdAt: string }` |
| Side Effects | Creates `organization_members` entry with OWNER role |

**Behavior:**
- Validates `name` is non-empty string (1-100 chars)
- Creates new organization record
- Creates membership linking user as OWNER
- Returns the created organization

#### 2. GET /api/v1/organizations – List User's Organizations

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | No (uses `@NoOrgRequired()`) |
| Response (200) | `{ organizations: [{ id, name, role, createdAt }] }` |

**Behavior:**
- Returns all organizations where authenticated user is a member
- Includes user's role in each organization
- Sorted by name alphabetically

#### 3. GET /api/v1/organizations/:id – Get Organization Details

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (must match `:id`) |
| Response (200) | `{ id, name, createdAt, updatedAt, memberCount }` |
| Response (403) | If user is not a member |
| Response (404) | If organization doesn't exist |

**Behavior:**
- Requires user to be a member of the organization
- Returns organization details with member count

#### 4. PATCH /api/v1/organizations/:id – Update Organization

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (must match `:id`) |
| Required Role | OWNER |
| Request Body | `{ name?: string }` |
| Response (200) | `{ id, name, createdAt, updatedAt }` |
| Response (403) | If user is not OWNER |
| Response (404) | If organization doesn't exist |

**Behavior:**
- Only OWNER role can update organization
- Currently only `name` can be updated
- Returns updated organization

#### 5. DELETE /api/v1/organizations/:id – Delete Organization

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (must match `:id`) |
| Required Role | OWNER |
| Response (204) | No content on success |
| Response (403) | If user is not OWNER |
| Response (404) | If organization doesn't exist |

**Behavior:**
- Only OWNER role can delete organization
- Cascades deletion to:
  - All `organization_members` records
  - All `projects` records
- Returns 204 No Content on success

### Frontend Requirements

1. **Organization Creation Modal/Page**
   - Form with organization name input
   - Validation (required, 1-100 chars)
   - Success/error feedback
   - Redirect to new org after creation

2. **Organization List on Dashboard**
   - Display all user's organizations
   - Show user's role in each org
   - Link to select/switch to org

3. **Organization Selector in Header**
   - Dropdown showing current org name
   - List of other orgs user belongs to
   - Quick switch between orgs

4. **Active Org Persistence**
   - Store selected org ID in localStorage or cookie
   - Restore on page load
   - Clear on logout

5. **X-Org-Id Header in API Calls**
   - API client reads active org from storage
   - Includes `X-Org-Id` header in all requests
   - Omits header for no-org-required endpoints

---

## Tasks & Subtasks

### Backend Tasks

#### 1. Create OrganizationsModule
- [ ] Create `apps/api/src/organizations/organizations.module.ts`
- [ ] Register service and controller
- [ ] Import required dependencies (DrizzleModule, etc.)

#### 2. Create OrganizationsService
- [ ] Create `apps/api/src/organizations/organizations.service.ts`
- [ ] Implement `create(userId, dto)` – creates org + membership
- [ ] Implement `findAllForUser(userId)` – returns user's orgs with roles
- [ ] Implement `findOne(orgId)` – returns org with member count
- [ ] Implement `update(orgId, dto)` – updates org name
- [ ] Implement `remove(orgId)` – deletes org (cascade handled by DB)

#### 3. Create OrganizationsController
- [ ] Create `apps/api/src/organizations/organizations.controller.ts`
- [ ] Implement `POST /organizations` endpoint
- [ ] Implement `GET /organizations` endpoint
- [ ] Implement `GET /organizations/:id` endpoint
- [ ] Implement `PATCH /organizations/:id` endpoint
- [ ] Implement `DELETE /organizations/:id` endpoint
- [ ] Apply `@NoOrgRequired()` to create/list endpoints
- [ ] Apply `@Roles('OWNER')` guard to update/delete endpoints

#### 4. Create DTOs
- [ ] Create `apps/api/src/organizations/dto/create-organization.dto.ts`
- [ ] Create `apps/api/src/organizations/dto/update-organization.dto.ts`
- [ ] Add validation decorators (class-validator)

#### 5. Add @NoOrgRequired() Decorator
- [ ] Create `apps/api/src/core/decorators/no-org-required.decorator.ts`
- [ ] Export decorator using `SetMetadata`
- [ ] Define `NO_ORG_REQUIRED_KEY` constant

#### 6. Update TenantContextGuard
- [ ] Check for `@NoOrgRequired()` metadata
- [ ] Skip org verification if decorator present
- [ ] Still require valid session (authentication)
- [ ] Attach partial TenantContext (userId only) for no-org endpoints

### Frontend Tasks

#### 1. Create Organization Form Component
- [ ] Create `apps/web/src/components/organizations/create-org-form.tsx`
- [ ] Form with name input field
- [ ] Validation (required, max length)
- [ ] Submit handler calls API
- [ ] Loading and error states

#### 2. Create Organization List Component
- [ ] Create `apps/web/src/components/organizations/org-list.tsx`
- [ ] Fetch and display user's organizations
- [ ] Show role badge for each org
- [ ] Click to select/switch org

#### 3. Create Organization Selector Dropdown
- [ ] Create `apps/web/src/components/organizations/org-selector.tsx`
- [ ] Dropdown in header/nav area
- [ ] Show current org name
- [ ] List other orgs in dropdown
- [ ] Handle org switch

#### 4. Add Organization Context to Auth State
- [ ] Extend auth context with `activeOrgId` and `activeOrgRole`
- [ ] Add `setActiveOrg(orgId)` method
- [ ] Persist to localStorage/cookie

#### 5. Create useOrganization Hook
- [ ] Create `apps/web/src/hooks/use-organization.ts`
- [ ] Expose `activeOrg`, `organizations`, `setActiveOrg`
- [ ] Expose `createOrg`, `updateOrg`, `deleteOrg` methods
- [ ] Handle loading and error states

#### 6. Update API Client for X-Org-Id Header
- [ ] Modify API client to read active org from context/storage
- [ ] Add `X-Org-Id` header to requests
- [ ] Allow override for specific calls
- [ ] Omit header when calling no-org endpoints

#### 7. Add Organization Creation Page/Modal
- [ ] Create `apps/web/src/app/(dashboard)/organizations/new/page.tsx`
- [ ] Or create modal component triggered from dashboard
- [ ] Use CreateOrgForm component
- [ ] Redirect to dashboard after success

#### 8. Update Dashboard to Show Organization List
- [ ] Add org list section to dashboard
- [ ] Show "Create Organization" button if no orgs
- [ ] Link org names to org detail/switch

---

## Test Plan

### Backend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `OrganizationsService.create()` creates org | Returns org with generated ID |
| `OrganizationsService.create()` creates OWNER membership | Membership record exists with OWNER role |
| `OrganizationsService.findAllForUser()` returns only user's orgs | Other orgs not included |
| `OrganizationsService.findAllForUser()` includes role | Each org has role property |
| `OrganizationsService.findOne()` returns org with memberCount | memberCount reflects actual members |
| `OrganizationsService.update()` updates name | Name changed in database |
| `OrganizationsService.remove()` deletes org | Org no longer exists |

### Backend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `POST /organizations` returns 201 with org data | Created org returned |
| `POST /organizations` adds creator as OWNER | Membership exists with OWNER role |
| `POST /organizations` without auth returns 401 | Unauthorized error |
| `GET /organizations` returns only user's orgs | Other users' orgs not included |
| `GET /organizations` includes role in each org | Role property present |
| `GET /organizations/:id` requires membership | 403 if not member |
| `GET /organizations/:id` returns org details | Org data with memberCount |
| `PATCH /organizations/:id` requires OWNER role | 403 if MEMBER/ADMIN |
| `PATCH /organizations/:id` updates org name | Name changed |
| `DELETE /organizations/:id` requires OWNER role | 403 if MEMBER/ADMIN |
| `DELETE /organizations/:id` cascades properly | Members and projects deleted |

### Frontend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| CreateOrgForm renders correctly | Name input and submit button visible |
| CreateOrgForm validates empty name | Shows required error |
| CreateOrgForm validates long name | Shows max length error |
| OrgList renders organizations | All orgs displayed with roles |
| OrgSelector shows current org | Active org name in trigger |
| OrgSelector dropdown lists other orgs | Other orgs in menu |
| useOrganization provides activeOrg | activeOrg matches stored value |
| setActiveOrg updates storage | localStorage/cookie updated |

### Frontend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Create org with valid name | Org created, shown in list |
| Create org shows error on failure | Error message displayed |
| Org list fetches and displays orgs | API called, orgs rendered |
| Org selector changes active org | Storage updated, header refreshed |
| X-Org-Id header sent with requests | Header present in API calls |
| No X-Org-Id for create/list endpoints | Header omitted appropriately |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| New user creates first org | Sign up → See empty state → Create org → See org in list | Org created and displayed |
| User switches between orgs | Create org A → Create org B → Switch to A → Switch to B | Active org changes correctly |
| Create project in org context | Select org → Create project → Project visible in org | Project scoped to correct org |
| OWNER updates org name | Navigate to org settings → Change name → Save | Name updated |
| Non-OWNER cannot update org | Login as MEMBER → Try to access settings | 403 or UI hidden |
| OWNER deletes org | Navigate to org settings → Delete → Confirm | Org removed, redirected |

---

## Implementation Notes

### Project Structure

```
apps/api/src/
├── organizations/
│   ├── organizations.module.ts
│   ├── organizations.controller.ts
│   ├── organizations.service.ts
│   └── dto/
│       ├── create-organization.dto.ts
│       └── update-organization.dto.ts
├── core/
│   ├── decorators/
│   │   ├── no-org-required.decorator.ts
│   │   └── roles.decorator.ts
│   └── guards/
│       ├── tenant-context.guard.ts  # Updated
│       └── roles.guard.ts
└── ...

apps/web/src/
├── app/
│   └── (dashboard)/
│       ├── page.tsx               # Dashboard with org list
│       └── organizations/
│           └── new/
│               └── page.tsx       # Create org page
├── components/
│   └── organizations/
│       ├── create-org-form.tsx
│       ├── org-list.tsx
│       └── org-selector.tsx
├── hooks/
│   └── use-organization.ts
└── lib/
    └── api-client.ts              # Updated with X-Org-Id
```

### @NoOrgRequired Decorator

```typescript
// apps/api/src/core/decorators/no-org-required.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const NO_ORG_REQUIRED_KEY = 'noOrgRequired';
export const NoOrgRequired = () => SetMetadata(NO_ORG_REQUIRED_KEY, true);
```

### Updated TenantContextGuard

```typescript
// In canActivate method
const noOrgRequired = this.reflector.getAllAndOverride<boolean>(
  NO_ORG_REQUIRED_KEY,
  [context.getHandler(), context.getClass()]
);

if (noOrgRequired) {
  // Still verify session, but don't require org
  const session = await this.authService.verifySession(sessionToken);
  request.tenantContext = { userId: session.userId };
  return true;
}

// Existing org verification logic...
```

### Controller Example

```typescript
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @NoOrgRequired()
  async create(
    @TenantContext() ctx: { userId: string },
    @Body() dto: CreateOrganizationDto
  ) {
    return this.orgsService.create(ctx.userId, dto);
  }

  @Get()
  @NoOrgRequired()
  async findAll(@TenantContext() ctx: { userId: string }) {
    return this.orgsService.findAllForUser(ctx.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER')
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.orgsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.orgsService.remove(id);
  }
}
```

### Frontend Active Org Storage

```typescript
// apps/web/src/lib/org-storage.ts
const ORG_STORAGE_KEY = 'forgestack_active_org';

export function getActiveOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ORG_STORAGE_KEY);
}

export function setActiveOrgId(orgId: string): void {
  localStorage.setItem(ORG_STORAGE_KEY, orgId);
}

export function clearActiveOrgId(): void {
  localStorage.removeItem(ORG_STORAGE_KEY);
}
```

### API Client with X-Org-Id

```typescript
// apps/web/src/lib/api-client.ts
import { getActiveOrgId } from './org-storage';

const NO_ORG_ENDPOINTS = [
  '/api/v1/organizations', // POST and GET list
  '/api/v1/auth/me',
];

export async function apiClient(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  // Add X-Org-Id header unless endpoint doesn't require it
  const needsOrg = !NO_ORG_ENDPOINTS.some(
    (ep) => path === ep || path.startsWith(ep + '?')
  );

  if (needsOrg) {
    const orgId = getActiveOrgId();
    if (orgId) {
      headers.set('X-Org-Id', orgId);
    }
  }

  return fetch(path, { ...options, headers, credentials: 'include' });
}
```

---

## Security Considerations

1. **Ownership verification** – Only OWNER can update/delete organizations
2. **Membership verification** – RLS policies prevent access to non-member orgs
3. **Cascade deletion** – Deleting org removes all associated data
4. **Header validation** – X-Org-Id must be a valid UUID
5. **Session validation** – All endpoints require valid authentication
6. **Input sanitization** – Validate and sanitize org names

---

## Dependencies

- **Priority #5** (better-auth Integration) – Required for authentication
- **@forgestack/db** – Database layer with organizations and members tables
- **class-validator** – DTO validation
- **class-transformer** – DTO transformation

---

## Future Enhancements (Out of Scope for v1)

- Organization settings page
- Organization avatars/logos
- Organization billing integration
- Organization-level feature flags
- Organization audit logs
- Transfer organization ownership
- Organization invitation system (covered in member management spec)

---

*End of spec*

