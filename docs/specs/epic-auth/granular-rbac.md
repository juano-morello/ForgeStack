# Granular RBAC with Permissions

**Epic:** Auth
**Priority:** TBD
**Depends on:** Organization Management, better-auth Integration
**Status:** Draft

---

## Overview

This specification defines a granular Role-Based Access Control (RBAC) system to replace the current simple `OWNER`/`MEMBER` role enum. The new system introduces:

- **Custom roles per organization** – Organizations can define their own roles
- **Granular permissions** – Fine-grained control over actions on resources
- **System roles** – Built-in roles that cannot be deleted (Owner, Admin, Member, Viewer)
- **Multi-role assignment** – Users can have multiple roles within an organization

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                    Current Authorization Model                   │
│                                                                   │
│  organization_members                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  org_id  │  user_id  │  role (enum: OWNER | MEMBER)         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  @RequireRole('OWNER') → checks tenantContext.role directly      │
│                                                                   │
│  Limitations:                                                     │
│  - Only 2 roles (too coarse-grained)                             │
│  - Cannot create custom roles per organization                   │
│  - No fine-grained permission control                            │
│  - Cannot assign partial admin permissions                       │
└─────────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────────────┐
│                     New Authorization Model                          │
│                                                                       │
│  roles                        permissions                             │
│  ┌──────────────────┐        ┌────────────────────────────────────┐  │
│  │ id               │        │ id                                 │  │
│  │ org_id (nullable)│        │ name (e.g., "projects:create")     │  │
│  │ name             │        │ resource (e.g., "projects")        │  │
│  │ is_system        │        │ action (e.g., "create")            │  │
│  └────────┬─────────┘        └────────────────┬───────────────────┘  │
│           │                                    │                      │
│           └──────────┐      ┌──────────────────┘                      │
│                      ▼      ▼                                         │
│               role_permissions                                        │
│               ┌──────────────────────┐                                │
│               │ role_id              │                                │
│               │ permission_id        │                                │
│               └──────────┬───────────┘                                │
│                          │                                            │
│  member_roles           ◄┘                                            │
│  ┌───────────────────────────────────┐                                │
│  │ org_id  │  user_id  │  role_id   │                                │
│  └───────────────────────────────────┘                                │
│                                                                       │
│  @RequirePermission('projects:create') → checks via PermissionsService│
└─────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Backwards compatible migration** – Existing OWNER/MEMBER assignments map to system roles
- **Fail-closed** – Missing permissions deny access by default
- **Caching** – Permissions cached per-request for performance
- **Audit-friendly** – Role and permission changes logged

---

## User Stories

### US-1: Organization Admin Manages Roles

**As an** organization owner,
**I want to** create custom roles with specific permissions,
**So that** I can give team members exactly the access they need.

**Acceptance Criteria:**
- [ ] Owner can view list of all roles (system + custom)
- [ ] Owner can create a new custom role with a name and description
- [ ] Owner can assign permissions to a role from available permissions list
- [ ] Owner can edit custom role name, description, and permissions
- [ ] Owner can delete custom roles (not system roles)
- [ ] System roles (Owner, Admin, Member, Viewer) cannot be deleted or have permissions modified

### US-2: Assign Roles to Members

**As an** organization admin,
**I want to** assign one or more roles to team members,
**So that** they have the appropriate access level.

**Acceptance Criteria:**
- [ ] Admin can view a member's current roles
- [ ] Admin can assign additional roles to a member
- [ ] Admin can remove roles from a member (except: cannot remove own Owner role)
- [ ] A member must have at least one role
- [ ] Role changes take effect immediately

### US-3: Permission-Based Access Control

**As a** developer,
**I want to** use fine-grained permission checks in the API,
**So that** I can control access to specific actions.

**Acceptance Criteria:**
- [ ] `@RequirePermission('resource:action')` decorator available
- [ ] PermissionGuard checks user's effective permissions
- [ ] Permissions aggregated from all assigned roles
- [ ] API returns 403 when user lacks required permission
- [ ] Existing `@RequireRole` still works for backwards compatibility

### US-4: View Effective Permissions

**As a** member,
**I want to** see what permissions I have,
**So that** I understand what actions I can perform.

**Acceptance Criteria:**
- [ ] Member can view their effective permissions
- [ ] Frontend shows/hides UI elements based on permissions
- [ ] `usePermission(permission)` hook available for frontend

---

## Technical Design

### Database Schema (Drizzle)

```typescript
// packages/db/src/schema/roles.ts
import { pgTable, uuid, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Roles table - Custom and system roles
 * org_id is null for system roles (shared across all orgs)
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.orgId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
  memberRoles: many(memberRoles),
}));

// Type exports
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
```

```typescript
// packages/db/src/schema/permissions.ts
import { pgTable, uuid, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Permissions table - Available permissions (seeded, global)
 * Format: "resource:action" (e.g., "projects:create")
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
}, (table) => ({
  resourceActionIdx: uniqueIndex('idx_permissions_resource_action').on(table.resource, table.action),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// Type exports
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
```

```typescript
// packages/db/src/schema/role-permissions.ts
import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roles } from './roles';
import { permissions } from './permissions';

/**
 * Role-Permission junction table
 */
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
```

```typescript
// packages/db/src/schema/member-roles.ts
import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { roles } from './roles';

/**
 * Member-Role junction table
 * Replaces the role column in organization_members
 */
export const memberRoles = pgTable('member_roles', {
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.orgId, table.userId, table.roleId] }),
}));

export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberRoles.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [memberRoles.roleId],
    references: [roles.id],
  }),
}));

// Type exports
export type MemberRole = typeof memberRoles.$inferSelect;
export type NewMemberRole = typeof memberRoles.$inferInsert;
```

---

### System Roles (Seeded)

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Owner** | Full access, cannot be deleted | All permissions (wildcard) |
| **Admin** | Administrative access | All except `roles:*`, `billing:manage` |
| **Member** | Standard team member | Create, read, update on most resources |
| **Viewer** | Read-only access | Read-only on all resources |

### Permission Matrix

| Resource | create | read | update | delete | manage |
|----------|--------|------|--------|--------|--------|
| projects | ✓ | ✓ | ✓ | ✓ | - |
| members | invite | ✓ | ✓ | remove | - |
| billing | - | ✓ | - | - | ✓ |
| settings | - | ✓ | ✓ | - | - |
| api_keys | ✓ | ✓ | - | revoke | - |
| webhooks | ✓ | ✓ | ✓ | ✓ | - |
| audit_logs | - | ✓ | - | - | - |
| roles | ✓ | ✓ | ✓ | ✓ | - |
| files | upload | ✓ | - | ✓ | - |
| notifications | - | ✓ | - | - | ✓ |
| feature_flags | - | ✓ | - | - | ✓ |

**Full Permission List:**
```
projects:create, projects:read, projects:update, projects:delete
members:invite, members:read, members:update, members:remove
billing:read, billing:manage
settings:read, settings:update
api_keys:create, api_keys:read, api_keys:revoke
webhooks:create, webhooks:read, webhooks:update, webhooks:delete
audit_logs:read
roles:create, roles:read, roles:update, roles:delete
files:upload, files:read, files:delete
notifications:read, notifications:manage
feature_flags:read, feature_flags:manage
```

---

## API Contracts

### Roles Endpoints

#### GET /api/v1/roles - List Roles

**Auth Required:** Yes
**Permission Required:** `roles:read`

**Response (200):**
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Admin",
      "description": "Administrative access",
      "isSystem": true,
      "permissionCount": 25,
      "memberCount": 3,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/v1/roles - Create Custom Role

**Auth Required:** Yes
**Permission Required:** `roles:create`

**Request Body:**
```json
{
  "name": "Developer",
  "description": "Can manage projects and webhooks",
  "permissionIds": ["uuid1", "uuid2"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Developer",
  "description": "Can manage projects and webhooks",
  "isSystem": false,
  "permissions": [
    { "id": "uuid1", "name": "projects:create" },
    { "id": "uuid2", "name": "projects:read" }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### GET /api/v1/roles/:id - Get Role Details

**Auth Required:** Yes
**Permission Required:** `roles:read`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Developer",
  "description": "Can manage projects and webhooks",
  "isSystem": false,
  "permissions": [
    { "id": "uuid1", "name": "projects:create", "resource": "projects", "action": "create" }
  ],
  "members": [
    { "userId": "user1", "name": "John Doe", "assignedAt": "2024-01-01T00:00:00Z" }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### PUT /api/v1/roles/:id - Update Role

**Auth Required:** Yes
**Permission Required:** `roles:update`
**Restrictions:** Cannot update system roles

**Request Body:**
```json
{
  "name": "Senior Developer",
  "description": "Updated description",
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### DELETE /api/v1/roles/:id - Delete Role

**Auth Required:** Yes
**Permission Required:** `roles:delete`
**Restrictions:** Cannot delete system roles; must reassign members first

**Response (204):** No content

### Permissions Endpoints

#### GET /api/v1/permissions - List All Permissions

**Auth Required:** Yes
**Permission Required:** `roles:read` (needed to create/edit roles)

**Response (200):**
```json
{
  "permissions": [
    {
      "id": "uuid",
      "name": "projects:create",
      "description": "Create new projects",
      "resource": "projects",
      "action": "create"
    }
  ],
  "groupedByResource": {
    "projects": [
      { "id": "uuid", "name": "projects:create", "action": "create" }
    ]
  }
}
```

### Member Roles Endpoints

#### GET /api/v1/members/:userId/roles - Get Member's Roles

**Auth Required:** Yes
**Permission Required:** `members:read`

**Response (200):**
```json
{
  "userId": "user-id",
  "roles": [
    { "id": "role-uuid", "name": "Developer", "isSystem": false, "assignedAt": "2024-01-01T00:00:00Z" }
  ],
  "effectivePermissions": [
    "projects:create", "projects:read", "projects:update"
  ]
}
```

#### PUT /api/v1/members/:userId/roles - Assign Roles to Member

**Auth Required:** Yes
**Permission Required:** `members:update`
**Restrictions:** Cannot remove Owner role from self

**Request Body:**
```json
{
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

**Response (200):**
```json
{
  "userId": "user-id",
  "roles": [
    { "id": "role-uuid-1", "name": "Developer", "assignedAt": "2024-01-01T00:00:00Z" }
  ]
}
```

---

## Backend Components

### Directory Structure

```
apps/api/src/
├── roles/
│   ├── roles.module.ts
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   ├── roles.repository.ts
│   └── dto/
│       ├── create-role.dto.ts
│       ├── update-role.dto.ts
│       └── assign-roles.dto.ts
├── permissions/
│   ├── permissions.module.ts
│   ├── permissions.controller.ts
│   ├── permissions.service.ts
│   └── permissions.repository.ts
├── core/
│   ├── decorators/
│   │   ├── require-role.decorator.ts     # Existing (keep for compatibility)
│   │   └── require-permission.decorator.ts # New
│   └── guards/
│       ├── require-role.guard.ts         # Existing (keep for compatibility)
│       └── permission.guard.ts           # New
```

### PermissionsService

```typescript
// apps/api/src/permissions/permissions.service.ts
@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  /**
   * Check if user has a specific permission in the current org
   * Aggregates permissions from all assigned roles
   */
  async hasPermission(orgId: string, userId: string, permission: string): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(orgId, userId);

    // Check for wildcard (Owner has all permissions)
    if (effectivePermissions.includes('*')) return true;

    // Check for exact match
    if (effectivePermissions.includes(permission)) return true;

    // Check for resource wildcard (e.g., "projects:*")
    const [resource] = permission.split(':');
    if (effectivePermissions.includes(`${resource}:*`)) return true;

    return false;
  }

  /**
   * Get all effective permissions for a user in an org
   * Results cached per-request
   */
  async getEffectivePermissions(orgId: string, userId: string): Promise<string[]> {
    return this.permissionsRepository.getEffectivePermissions(orgId, userId);
  }

  /**
   * List all available permissions
   */
  async listAll(): Promise<Permission[]> {
    return this.permissionsRepository.findAll();
  }
}
```

### @RequirePermission Decorator

```typescript
// apps/api/src/core/decorators/require-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/**
 * Decorator to require specific permissions
 * @param permissions - One or more permissions required (user needs at least one)
 * @example @RequirePermission('projects:create')
 * @example @RequirePermission('projects:create', 'projects:update')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
```

### PermissionGuard

```typescript
// apps/api/src/core/guards/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { orgId, userId } = request.tenantContext;

    if (!orgId || !userId) {
      throw new ForbiddenException('Organization context required');
    }

    // Check if user has ANY of the required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        orgId,
        userId,
        permission
      );
      if (hasPermission) return true;
    }

    throw new ForbiddenException(
      `This action requires one of the following permissions: ${requiredPermissions.join(', ')}`
    );
  }
}
```

### RolesService

```typescript
// apps/api/src/roles/roles.service.ts
@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async create(orgId: string, dto: CreateRoleDto): Promise<Role> {
    return this.rolesRepository.create({
      orgId,
      name: dto.name,
      description: dto.description,
      isSystem: false,
    }, dto.permissionIds);
  }

  async findAllForOrg(orgId: string): Promise<Role[]> {
    // Returns both org-specific and system roles
    return this.rolesRepository.findAllForOrg(orgId);
  }

  async findOne(orgId: string, roleId: string): Promise<Role> {
    const role = await this.rolesRepository.findOne(roleId);
    if (!role || (role.orgId && role.orgId !== orgId)) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(orgId: string, roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(orgId, roleId);

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    return this.rolesRepository.update(roleId, dto);
  }

  async delete(orgId: string, roleId: string): Promise<void> {
    const role = await this.findOne(orgId, roleId);

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    // Check if role has members
    const memberCount = await this.rolesRepository.getMemberCount(roleId);
    if (memberCount > 0) {
      throw new BadRequestException(
        'Cannot delete role with assigned members. Reassign members first.'
      );
    }

    await this.rolesRepository.delete(roleId);
  }

  async assignRolesToMember(
    orgId: string,
    userId: string,
    roleIds: string[],
    currentUserId: string
  ): Promise<void> {
    if (roleIds.length === 0) {
      throw new BadRequestException('Member must have at least one role');
    }

    // Validate all roles exist and belong to org or are system roles
    for (const roleId of roleIds) {
      await this.findOne(orgId, roleId);
    }

    // Prevent removing Owner role from self
    if (userId === currentUserId) {
      const ownerRole = await this.rolesRepository.findSystemRole('Owner');
      const currentRoles = await this.rolesRepository.getMemberRoles(orgId, userId);
      const hasOwnerNow = currentRoles.some(r => r.id === ownerRole.id);
      const willHaveOwner = roleIds.includes(ownerRole.id);

      if (hasOwnerNow && !willHaveOwner) {
        throw new ForbiddenException('Cannot remove Owner role from yourself');
      }
    }

    await this.rolesRepository.assignRolesToMember(orgId, userId, roleIds);
  }
}
```

---

## Frontend Components

### Directory Structure

```
apps/web/src/
├── app/(protected)/organizations/[orgId]/settings/
│   └── roles/
│       ├── page.tsx              # Roles management page
│       └── [roleId]/
│           └── page.tsx          # Role detail/edit page
├── components/
│   └── roles/
│       ├── role-list.tsx         # List of roles with actions
│       ├── role-form.tsx         # Create/edit role form
│       ├── role-permissions-picker.tsx  # Multi-select for permissions
│       ├── member-role-assignment.tsx   # Assign roles to member
│       └── permission-gate.tsx   # Conditional rendering by permission
├── hooks/
│   ├── use-roles.ts              # CRUD operations for roles
│   ├── use-permissions.ts        # Fetch available permissions
│   └── use-permission.ts         # Check if user has permission
└── lib/
    └── permissions.ts            # Permission constants and utilities
```

### usePermission Hook

```typescript
// apps/web/src/hooks/use-permission.ts
import { useOrgContext } from '@/providers/org-provider';

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { currentOrg } = useOrgContext();

  if (!currentOrg?.effectivePermissions) {
    return false;
  }

  const permissions = currentOrg.effectivePermissions;

  // Check for wildcard
  if (permissions.includes('*')) return true;

  // Check exact match
  if (permissions.includes(permission)) return true;

  // Check resource wildcard
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Hook to check multiple permissions (returns true if user has ANY)
 */
export function usePermissions(permissions: string[]): boolean {
  const { currentOrg } = useOrgContext();

  if (!currentOrg?.effectivePermissions) {
    return false;
  }

  return permissions.some(p => {
    const userPerms = currentOrg.effectivePermissions;
    if (userPerms.includes('*')) return true;
    if (userPerms.includes(p)) return true;
    const [resource] = p.split(':');
    return userPerms.includes(`${resource}:*`);
  });
}
```

### PermissionGate Component

```tsx
// apps/web/src/components/roles/permission-gate.tsx
import { usePermission } from '@/hooks/use-permission';

interface PermissionGateProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on user permission
 */
export function PermissionGate({
  permission,
  fallback = null,
  children
}: PermissionGateProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage example:
// <PermissionGate permission="roles:create">
//   <Button>Create Role</Button>
// </PermissionGate>
```

### useRoles Hook

```typescript
// apps/web/src/hooks/use-roles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useRoles(orgId: string) {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['roles', orgId],
    queryFn: () => api.get(`/roles`).then(res => res.data.roles),
  });

  const createRole = useMutation({
    mutationFn: (data: CreateRoleDto) => api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
      api.put(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });

  return {
    roles: rolesQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
    error: rolesQuery.error,
    createRole,
    updateRole,
    deleteRole,
  };
}
```

### Roles Management Page

```tsx
// apps/web/src/app/(protected)/organizations/[orgId]/settings/roles/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useRoles } from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGate } from '@/components/roles/permission-gate';
import { RoleList } from '@/components/roles/role-list';
import { Button } from '@/components/ui/button';

export default function RolesPage() {
  const { orgId } = useParams();
  const { roles, isLoading } = useRoles(orgId as string);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <PermissionGate permission="roles:create">
          <Button>Create Role</Button>
        </PermissionGate>
      </div>

      <RoleList
        roles={roles}
        isLoading={isLoading}
      />
    </div>
  );
}
```

---

## Migration Plan

### Phase 1: Create New Tables (Non-Breaking)

```sql
-- Migration: 001_create_rbac_tables.sql

-- 1. Create permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_permissions_resource_action
  ON permissions(resource, action);

-- 2. Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_org_id ON roles(org_id);

-- 3. Create role_permissions junction table
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Create member_roles junction table
CREATE TABLE member_roles (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id, role_id)
);

CREATE INDEX idx_member_roles_user ON member_roles(user_id);
CREATE INDEX idx_member_roles_role ON member_roles(role_id);
```

### Phase 2: Seed System Roles and Permissions

```typescript
// packages/db/src/seed/rbac-seed.ts

const PERMISSIONS = [
  // Projects
  { name: 'projects:create', resource: 'projects', action: 'create', description: 'Create new projects' },
  { name: 'projects:read', resource: 'projects', action: 'read', description: 'View projects' },
  { name: 'projects:update', resource: 'projects', action: 'update', description: 'Edit projects' },
  { name: 'projects:delete', resource: 'projects', action: 'delete', description: 'Delete projects' },

  // Members
  { name: 'members:invite', resource: 'members', action: 'invite', description: 'Invite new members' },
  { name: 'members:read', resource: 'members', action: 'read', description: 'View member list' },
  { name: 'members:update', resource: 'members', action: 'update', description: 'Update member roles' },
  { name: 'members:remove', resource: 'members', action: 'remove', description: 'Remove members from org' },

  // Billing
  { name: 'billing:read', resource: 'billing', action: 'read', description: 'View billing information' },
  { name: 'billing:manage', resource: 'billing', action: 'manage', description: 'Manage billing and subscriptions' },

  // Settings
  { name: 'settings:read', resource: 'settings', action: 'read', description: 'View organization settings' },
  { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update organization settings' },

  // API Keys
  { name: 'api_keys:create', resource: 'api_keys', action: 'create', description: 'Create API keys' },
  { name: 'api_keys:read', resource: 'api_keys', action: 'read', description: 'View API keys' },
  { name: 'api_keys:revoke', resource: 'api_keys', action: 'revoke', description: 'Revoke API keys' },

  // Webhooks
  { name: 'webhooks:create', resource: 'webhooks', action: 'create', description: 'Create webhooks' },
  { name: 'webhooks:read', resource: 'webhooks', action: 'read', description: 'View webhooks' },
  { name: 'webhooks:update', resource: 'webhooks', action: 'update', description: 'Update webhooks' },
  { name: 'webhooks:delete', resource: 'webhooks', action: 'delete', description: 'Delete webhooks' },

  // Audit Logs
  { name: 'audit_logs:read', resource: 'audit_logs', action: 'read', description: 'View audit logs' },

  // Roles
  { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create custom roles' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update custom roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete custom roles' },

  // Files
  { name: 'files:upload', resource: 'files', action: 'upload', description: 'Upload files' },
  { name: 'files:read', resource: 'files', action: 'read', description: 'View and download files' },
  { name: 'files:delete', resource: 'files', action: 'delete', description: 'Delete files' },

  // Notifications
  { name: 'notifications:read', resource: 'notifications', action: 'read', description: 'View notifications' },
  { name: 'notifications:manage', resource: 'notifications', action: 'manage', description: 'Manage notification settings' },

  // Feature Flags
  { name: 'feature_flags:read', resource: 'feature_flags', action: 'read', description: 'View feature flags' },
  { name: 'feature_flags:manage', resource: 'feature_flags', action: 'manage', description: 'Manage feature flags' },
];

const SYSTEM_ROLES = [
  {
    name: 'Owner',
    description: 'Full access to all resources. Cannot be modified or deleted.',
    permissions: ['*'], // Wildcard - all permissions
  },
  {
    name: 'Admin',
    description: 'Administrative access. Cannot manage roles or billing.',
    permissions: PERMISSIONS
      .filter(p => !p.name.startsWith('roles:') && p.name !== 'billing:manage')
      .map(p => p.name),
  },
  {
    name: 'Member',
    description: 'Standard team member with create and edit access.',
    permissions: [
      'projects:create', 'projects:read', 'projects:update',
      'members:read',
      'settings:read',
      'api_keys:create', 'api_keys:read',
      'webhooks:create', 'webhooks:read', 'webhooks:update',
      'files:upload', 'files:read',
      'notifications:read',
      'feature_flags:read',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to all resources.',
    permissions: PERMISSIONS.filter(p => p.action === 'read').map(p => p.name),
  },
];

export async function seedRbac(db: Database) {
  // Insert permissions
  await db.insert(permissions).values(PERMISSIONS).onConflictDoNothing();

  // Insert system roles (org_id = null)
  for (const role of SYSTEM_ROLES) {
    const [insertedRole] = await db
      .insert(roles)
      .values({
        orgId: null,
        name: role.name,
        description: role.description,
        isSystem: true,
      })
      .onConflictDoNothing()
      .returning();

    if (insertedRole && role.permissions[0] !== '*') {
      const permIds = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.name, role.permissions));

      await db.insert(rolePermissions).values(
        permIds.map(p => ({ roleId: insertedRole.id, permissionId: p.id }))
      );
    }
  }
}
```

### Phase 3: Migrate Existing Members

```typescript
// packages/db/src/migrations/002_migrate_member_roles.ts

export async function migrateExistingMembers(db: Database) {
  // Get system role IDs
  const [ownerRole] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.name, 'Owner'), eq(roles.isSystem, true)));

  const [memberRole] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.name, 'Member'), eq(roles.isSystem, true)));

  // Migrate OWNER -> Owner system role
  const owners = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.role, 'OWNER'));

  for (const owner of owners) {
    await db.insert(memberRoles).values({
      orgId: owner.orgId,
      userId: owner.userId,
      roleId: ownerRole.id,
      assignedAt: owner.joinedAt,
    }).onConflictDoNothing();
  }

  // Migrate MEMBER -> Member system role
  const members = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.role, 'MEMBER'));

  for (const member of members) {
    await db.insert(memberRoles).values({
      orgId: member.orgId,
      userId: member.userId,
      roleId: memberRole.id,
      assignedAt: member.joinedAt,
    }).onConflictDoNothing();
  }
}
```

### Phase 4: Update Guards to Use New System

1. Update `TenantContextGuard` to fetch effective permissions
2. Register `PermissionGuard` globally
3. Gradually replace `@RequireRole` with `@RequirePermission`

### Phase 5: Remove Legacy Column (Future)

```sql
-- Migration: 003_remove_legacy_role_column.sql
-- Run after verification that new system is working

ALTER TABLE organization_members DROP COLUMN role;
DROP TYPE org_role;
```

---

## Test Plan

### Unit Tests

#### PermissionsService Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `hasPermission` with exact match | Returns true |
| `hasPermission` without permission | Returns false |
| `hasPermission` with wildcard role | Returns true for any permission |
| `hasPermission` with resource wildcard | Returns true for any action on resource |
| `getEffectivePermissions` aggregates from multiple roles | Returns union of all permissions |
| `getEffectivePermissions` for user with no roles | Returns empty array |

#### PermissionGuard Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Guard with no required permissions | Allows access |
| Guard with required permission user has | Allows access |
| Guard with required permission user lacks | Throws ForbiddenException |
| Guard with multiple required permissions (OR logic) | Allows if user has any |
| Guard without tenant context | Throws ForbiddenException |

#### RolesService Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `create` creates custom role | Role created with isSystem=false |
| `create` assigns permissions | role_permissions entries created |
| `findAllForOrg` returns org and system roles | Both types included |
| `update` modifies custom role | Changes persisted |
| `update` on system role | Throws ForbiddenException |
| `delete` custom role | Role deleted |
| `delete` system role | Throws ForbiddenException |
| `delete` role with members | Throws BadRequestException |
| `assignRolesToMember` with valid roles | member_roles updated |
| `assignRolesToMember` with empty array | Throws BadRequestException |
| `assignRolesToMember` removing own Owner | Throws ForbiddenException |

### Integration Tests

#### Roles API Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /roles` returns org + system roles | Both types in response |
| `POST /roles` creates custom role | 201 with role data |
| `POST /roles` without `roles:create` permission | 403 Forbidden |
| `PUT /roles/:id` updates custom role | 200 with updated data |
| `PUT /roles/:id` on system role | 403 Forbidden |
| `DELETE /roles/:id` deletes custom role | 204 No Content |
| `DELETE /roles/:id` on system role | 403 Forbidden |
| `GET /permissions` returns all permissions | Grouped by resource |

#### Member Roles API Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /members/:userId/roles` returns roles | Roles with effective permissions |
| `PUT /members/:userId/roles` assigns roles | 200 with updated roles |
| `PUT /members/:userId/roles` with invalid role | 404 Not Found |
| `PUT /members/:userId/roles` empty array | 400 Bad Request |

#### Permission Check Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| User with Owner role accesses any endpoint | Allowed |
| User with specific permission accesses endpoint | Allowed |
| User without permission accesses endpoint | 403 Forbidden |
| User with multiple roles has aggregated permissions | Union of permissions |

### Frontend Tests

#### usePermission Hook Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Returns true for exact permission match | `usePermission('projects:create') === true` |
| Returns false for missing permission | `usePermission('billing:manage') === false` |
| Returns true for wildcard user | Always true |
| Returns true for resource wildcard | `usePermission('projects:delete')` with `projects:*` |

#### PermissionGate Component Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Renders children when user has permission | Children visible |
| Renders fallback when user lacks permission | Fallback visible |
| Renders nothing when no fallback and no permission | Empty |

#### Roles Page Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Displays list of roles | All roles visible |
| Create button visible for users with `roles:create` | Button rendered |
| Create button hidden for users without permission | Button not rendered |
| Edit form updates role | Changes reflected |
| Delete confirmation works | Role removed from list |

### E2E Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Owner creates custom role | Login as Owner → Settings → Roles → Create → Fill form → Save | Role created, visible in list |
| Owner assigns role to member | Settings → Members → Select member → Assign role → Save | Member has new role |
| Member with permission accesses feature | Login as member with role → Navigate to feature | Feature accessible |
| Member without permission blocked | Login as member → Try to access restricted feature | 403 or redirect |
| Custom role deletion | Create role → Delete role | Role removed |
| System role protection | Try to edit/delete Owner role | Action blocked |

---

## Security Considerations

1. **System role protection** – Owner, Admin, Member, Viewer roles cannot be modified or deleted
2. **Owner role preservation** – Users cannot remove Owner role from themselves
3. **Permission validation** – All permissions validated against seed list
4. **Cascading deletes** – Deleting a role fails if members are assigned; deleting an org cascades to member_roles
5. **Audit logging** – Role and permission changes should be logged to audit_logs
6. **Caching invalidation** – Permission cache invalidated on role/membership changes
7. **RLS consideration** – member_roles table needs appropriate RLS policies
8. **Migration safety** – Legacy role column kept during transition for rollback

---

## Dependencies

- **Organization Management** – Required for org context
- **better-auth Integration** – Required for user authentication
- **Audit Logs** – For logging role/permission changes
- **@forgestack/db** – Database schema definitions

---

## Future Enhancements (Out of Scope for v1)

- Role templates (copy from existing role)
- Role inheritance (Admin inherits from Member)
- Time-limited role assignments
- Role request/approval workflow
- Permission groups (bundle related permissions)
- API key scopes aligned with permissions
- Org-level permission overrides

---

*End of spec*
