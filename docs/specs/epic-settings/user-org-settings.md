# User & Organization Settings Polish

**Epic:** Settings
**Phase:** 4A
**Depends on:** better-auth Integration, File Uploads Integration, Organizations Module
**Status:** Draft

---

## 1. Context

### Current State

The settings pages exist but are currently read-only:
- `/settings/profile` - Shows user info (name, email, avatar) with disabled fields
- `/settings/organization` - Shows org info (name, logo) with disabled fields

Key issues to address:
- **Profile fields are disabled** - Users cannot edit their display name or email
- **No password change** - Users have no way to change their password
- **Avatar uploads don't persist** - Files upload to R2 but the `image` field on the user record is never updated
- **Org name is read-only** - Owners cannot edit organization name from the UI
- **Logo uploads don't persist** - Files upload to R2 but there's no `logo` field on the organization record
- **No org preferences** - Missing timezone and language settings for organizations

### Technical Context

- **Authentication**: better-auth handles auth; exposes `changePassword`, `changeEmail` APIs
- **Database**: Users table has `image` field, organizations table needs `logo` and preferences fields
- **File Storage**: R2 integration works for uploads; need to persist file URLs to records
- **Frontend**: Settings pages exist with upload components; need to enable editing

---

## 2. User Stories

### US-1: Edit Profile Name
**As a user**, I want to edit my display name so that my profile reflects my preferred name.

### US-2: Change Email Address
**As a user**, I want to change my email address with verification so that I can update my login credentials securely.

### US-3: Change Password
**As a user**, I want to change my password so that I can maintain account security.

### US-4: Avatar Upload Persistence
**As a user**, I want my avatar upload to persist so that my profile picture is saved and displayed across sessions.

### US-5: Edit Organization Name
**As an organization owner**, I want to edit the organization name so that I can update our branding.

### US-6: Logo Upload Persistence
**As an organization owner**, I want the logo upload to persist so that our organization branding is saved.

### US-7: Organization Preferences
**As an organization owner**, I want to set timezone and language preferences so that the organization has consistent settings.

---

## 3. Acceptance Criteria

### US-1: Edit Profile Name

| ID | Criteria |
|----|----------|
| AC-1.1 | Profile page shows editable name field (not disabled) |
| AC-1.2 | Name must be 1-100 characters |
| AC-1.3 | Save button submits name change to API |
| AC-1.4 | Success notification shown on save |
| AC-1.5 | Session/UI updates to reflect new name |
| AC-1.6 | Audit log entry created for name change |

### US-2: Change Email Address

| ID | Criteria |
|----|----------|
| AC-2.1 | Email change form shows current email and new email field |
| AC-2.2 | Verification email sent to new address |
| AC-2.3 | Email only updates after verification link clicked |
| AC-2.4 | User notified that verification is pending |
| AC-2.5 | Old email receives notification of change request |
| AC-2.6 | Audit log entry created for email change |

### US-3: Change Password

| ID | Criteria |
|----|----------|
| AC-3.1 | Password change form with current password field |
| AC-3.2 | New password and confirm password fields |
| AC-3.3 | Password strength requirements enforced (min 8 chars) |
| AC-3.4 | Current password must be verified |
| AC-3.5 | Success notification and form reset on completion |
| AC-3.6 | Audit log entry created for password change |

### US-4: Avatar Upload Persistence

| ID | Criteria |
|----|----------|
| AC-4.1 | Avatar upload updates `users.image` field with file URL |
| AC-4.2 | Previous avatar file soft-deleted when new one uploaded |
| AC-4.3 | Avatar displays correctly after page refresh |
| AC-4.4 | Avatar shows in header, settings, and anywhere user is displayed |
| AC-4.5 | Audit log entry created for avatar change |

### US-5: Edit Organization Name

| ID | Criteria |
|----|----------|
| AC-5.1 | Organization page shows editable name field for OWNER |
| AC-5.2 | Non-owners see disabled/read-only name field |
| AC-5.3 | Name must be 2-100 characters |
| AC-5.4 | Save button submits name change to API |
| AC-5.5 | Success notification shown on save |
| AC-5.6 | Audit log entry created for name change |

### US-6: Logo Upload Persistence

| ID | Criteria |
|----|----------|
| AC-6.1 | Logo upload updates `organizations.logo` field with file URL |
| AC-6.2 | Only OWNER can upload logo |
| AC-6.3 | Previous logo file soft-deleted when new one uploaded |
| AC-6.4 | Logo displays correctly after page refresh |
| AC-6.5 | Audit log entry created for logo change |

### US-7: Organization Preferences

| ID | Criteria |
|----|----------|
| AC-7.1 | Timezone dropdown with common timezones |
| AC-7.2 | Language dropdown (en-US, es-ES, etc.) |
| AC-7.3 | Only OWNER can edit preferences |
| AC-7.4 | Preferences stored in `organizations` table |
| AC-7.5 | Preferences applied to date/time formatting in UI |
| AC-7.6 | Audit log entry created for preference changes |

---

## 4. API Endpoints

### User Profile Endpoints

#### PATCH /api/v1/users/me/profile
Update current user's profile (name, avatar).

**Request:**
```typescript
interface UpdateProfileDto {
  name?: string;      // 1-100 characters
  image?: string;     // URL from file upload
}
```

**Response:** `200 OK`
```typescript
interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  image: string | null;
  updatedAt: string;
}
```

#### POST /api/v1/users/me/change-email
Request email change with verification.

**Request:**
```typescript
interface ChangeEmailDto {
  newEmail: string;   // Valid email format
  password: string;   // Current password for verification
}
```

**Response:** `200 OK`
```typescript
interface ChangeEmailResponse {
  message: string;    // "Verification email sent"
  pendingEmail: string;
}
```

#### POST /api/v1/users/me/change-password
Change password (requires current password).

**Request:**
```typescript
interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;      // Min 8 characters
  confirmPassword: string;  // Must match newPassword
}
```

**Response:** `200 OK`
```typescript
interface ChangePasswordResponse {
  message: string;    // "Password changed successfully"
}
```

### Organization Settings Endpoints

#### PATCH /api/v1/organizations/:id
Update organization (existing endpoint, extend with logo/preferences).

**Request:**
```typescript
interface UpdateOrganizationDto {
  name?: string;       // 2-100 characters
  logo?: string;       // URL from file upload
  timezone?: string;   // IANA timezone (e.g., "America/New_York")
  language?: string;   // Locale code (e.g., "en-US")
}
```

**Response:** `200 OK`
```typescript
interface OrganizationResponse {
  id: string;
  name: string;
  logo: string | null;
  timezone: string | null;
  language: string | null;
  updatedAt: string;
}
```

---

## 5. Database Schema Changes

### Organizations Table Updates

```sql
-- Add new columns to organizations table
ALTER TABLE organizations
  ADD COLUMN logo TEXT,
  ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN language VARCHAR(10) DEFAULT 'en-US',
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

### Drizzle Schema Update

```typescript
// packages/db/src/schema/organizations.ts
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerUserId: text('owner_user_id').notNull().references(() => users.id),

  // New fields
  logo: text('logo'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 10 }).default('en-US'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Suspension fields (existing)
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  suspendedReason: text('suspended_reason'),
  suspendedBy: text('suspended_by').references(() => users.id),
});
```

---

## 6. Tasks

### Backend Tasks (apps/api)

#### 6.1 Create Users Module for Profile Management
- [ ] Create `apps/api/src/users/users.module.ts`
- [ ] Create `apps/api/src/users/users.controller.ts`
- [ ] Create `apps/api/src/users/users.service.ts`
- [ ] Create `apps/api/src/users/users.repository.ts`
- [ ] Register module in AppModule

#### 6.2 Implement Profile Update Endpoint
- [ ] Create `PATCH /api/v1/users/me/profile` endpoint
- [ ] Create `UpdateProfileDto` with validation
- [ ] Implement profile update in UsersService
- [ ] Update user record in database
- [ ] Create audit log entry for changes

#### 6.3 Implement Change Email Endpoint
- [ ] Create `POST /api/v1/users/me/change-email` endpoint
- [ ] Create `ChangeEmailDto` with validation
- [ ] Verify current password before proceeding
- [ ] Integrate with better-auth email change flow
- [ ] Send verification email to new address
- [ ] Create audit log entry

#### 6.4 Implement Change Password Endpoint
- [ ] Create `POST /api/v1/users/me/change-password` endpoint
- [ ] Create `ChangePasswordDto` with validation
- [ ] Verify current password
- [ ] Integrate with better-auth password change
- [ ] Create audit log entry

#### 6.5 Extend Organization Update
- [ ] Add `logo`, `timezone`, `language` to UpdateOrganizationDto
- [ ] Update OrganizationsRepository to handle new fields
- [ ] Add validation for timezone (IANA format)
- [ ] Add validation for language (locale format)
- [ ] Create audit log entries for changes

#### 6.6 Avatar/Logo File Persistence
- [ ] Create endpoint to link uploaded file to user avatar
- [ ] Create endpoint to link uploaded file to org logo
- [ ] Update file completion flow to update parent record
- [ ] Soft-delete previous file when replaced

### Database Tasks (packages/db)

#### 6.7 Create Migration for Organization Fields
- [ ] Add `logo` column to organizations table
- [ ] Add `timezone` column with default 'UTC'
- [ ] Add `language` column with default 'en-US'
- [ ] Add `updated_at` column to organizations table
- [ ] Generate and apply migration

#### 6.8 Update Schema Exports
- [ ] Update organizations schema in Drizzle
- [ ] Update Organization type exports
- [ ] Add timezone/language validation constants to shared package

### Frontend Tasks (apps/web)

#### 6.9 Enable Profile Name Editing
- [ ] Remove `disabled` prop from name input field
- [ ] Add form state management with React Hook Form
- [ ] Add Save button with loading state
- [ ] Call profile update API on save
- [ ] Show success/error toast notifications
- [ ] Refresh session after update

#### 6.10 Create Email Change Component
- [ ] Create `ChangeEmailForm` component
- [ ] Add new email field with validation
- [ ] Add current password field
- [ ] Show pending verification state
- [ ] Handle verification success callback

#### 6.11 Create Password Change Component
- [ ] Create `ChangePasswordForm` component
- [ ] Add current password field
- [ ] Add new password with strength indicator
- [ ] Add confirm password field
- [ ] Validate passwords match
- [ ] Call password change API

#### 6.12 Fix Avatar Persistence
- [ ] Update avatar upload handler to call profile update API
- [ ] Pass file URL to profile update after upload completes
- [ ] Update session/context with new avatar URL
- [ ] Ensure avatar displays everywhere after refresh

#### 6.13 Enable Organization Name Editing
- [ ] Remove `disabled` prop from name input (for OWNER)
- [ ] Add form state management
- [ ] Add Save button with loading state
- [ ] Call organization update API on save
- [ ] Refresh org context after update

#### 6.14 Fix Logo Persistence
- [ ] Update logo upload handler to call org update API
- [ ] Pass file URL to org update after upload completes
- [ ] Update org context with new logo URL
- [ ] Ensure logo displays everywhere after refresh

#### 6.15 Add Organization Preferences Section
- [ ] Create timezone dropdown component
- [ ] Create language dropdown component
- [ ] Add preferences section to org settings page
- [ ] Call org update API on preference change
- [ ] Apply preferences to date/time formatting

---

## 7. Test Plan

### Backend Unit Tests

#### Users Service Tests
```typescript
describe('UsersService', () => {
  it('should update user profile name');
  it('should update user profile image');
  it('should reject empty name');
  it('should reject name over 100 characters');
  it('should create audit log on profile update');
});
```

#### Password Change Tests
```typescript
describe('ChangePassword', () => {
  it('should change password with valid current password');
  it('should reject incorrect current password');
  it('should reject password under 8 characters');
  it('should reject mismatched confirm password');
  it('should create audit log on password change');
});
```

#### Email Change Tests
```typescript
describe('ChangeEmail', () => {
  it('should initiate email change with verification');
  it('should reject incorrect password');
  it('should reject invalid email format');
  it('should reject email already in use');
  it('should send verification email');
  it('should create audit log on email change');
});
```

#### Organization Update Tests
```typescript
describe('OrganizationsService.update', () => {
  it('should update organization name');
  it('should update organization logo');
  it('should update organization timezone');
  it('should update organization language');
  it('should reject invalid timezone');
  it('should create audit log on update');
});
```

### Backend Integration Tests

```typescript
describe('Profile API Integration', () => {
  it('PATCH /users/me/profile updates name');
  it('PATCH /users/me/profile updates image');
  it('PATCH /users/me/profile requires authentication');
  it('POST /users/me/change-password works with correct password');
  it('POST /users/me/change-password fails with wrong password');
  it('POST /users/me/change-email initiates verification');
});

describe('Organization Settings Integration', () => {
  it('PATCH /organizations/:id updates name for OWNER');
  it('PATCH /organizations/:id updates logo for OWNER');
  it('PATCH /organizations/:id updates preferences for OWNER');
  it('PATCH /organizations/:id rejects update from MEMBER');
});
```

### Frontend Unit Tests

```typescript
describe('ProfileSettingsForm', () => {
  it('renders with current user data');
  it('enables name field for editing');
  it('shows save button when changes made');
  it('validates name length');
  it('shows loading state during save');
  it('shows success toast on save');
});

describe('ChangePasswordForm', () => {
  it('renders password fields');
  it('validates password length');
  it('validates passwords match');
  it('shows password strength indicator');
  it('clears form on success');
});

describe('ChangeEmailForm', () => {
  it('renders email fields');
  it('validates email format');
  it('shows pending verification state');
});

describe('OrganizationSettingsForm', () => {
  it('renders with current org data');
  it('enables fields for OWNER');
  it('disables fields for MEMBER');
  it('shows timezone dropdown');
  it('shows language dropdown');
});
```

### E2E Tests (Playwright)

```typescript
describe('User Profile Settings E2E', () => {
  it('user can update display name');
  it('user can upload and persist avatar');
  it('user can change password');
  it('user can request email change');
  it('avatar appears in header after upload');
});

describe('Organization Settings E2E', () => {
  it('owner can update organization name');
  it('owner can upload and persist logo');
  it('owner can set timezone preference');
  it('owner can set language preference');
  it('member cannot edit organization settings');
  it('logo appears in sidebar after upload');
});
```

---

## 8. Security Considerations

1. **Password verification** - Email and password changes require current password
2. **Email verification** - New email must be verified before becoming active
3. **Rate limiting** - Password/email change endpoints should be rate-limited
4. **Session invalidation** - Consider invalidating other sessions on password change
5. **Audit logging** - All sensitive changes logged for security review
6. **RBAC enforcement** - Only OWNER can modify organization settings
7. **Input sanitization** - Validate and sanitize all user inputs
8. **File validation** - Ensure uploaded files are valid images before persisting URL

---

## 9. Implementation Notes

### better-auth Integration

better-auth provides built-in methods for password/email changes:
- `auth.api.changePassword()` - Server-side password change
- `auth.api.changeEmail()` - Server-side email change with verification

The API should wrap these methods and add audit logging.

### File Upload Flow

1. Frontend calls existing presigned URL endpoint
2. Upload file to R2
3. Call complete upload endpoint
4. Call profile/org update endpoint with file URL
5. Update parent record with new URL

### Session Refresh

After profile updates (especially name/image), refresh the session:
```typescript
// Frontend after profile update
await authClient.getSession(); // Forces session refresh
```

---

## 10. Dependencies

- **better-auth** - Password/email change APIs
- **File Uploads Integration** - Avatar/logo storage
- **Audit Logs** - Activity tracking
- **Organizations Module** - Existing org CRUD

---

## 11. Future Enhancements (Out of Scope)

- Two-factor authentication setup in profile
- Connected accounts (OAuth providers)
- Profile privacy settings
- Organization billing address
- Custom organization themes
- Delete account functionality

---

*End of spec*

