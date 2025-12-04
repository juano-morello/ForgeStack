# Onboarding Wizard

**Epic:** Onboarding
**Priority:** Phase 4D
**Depends on:** Authentication, Organization Management, Billing (optional)
**Status:** Draft

---

## Overview

This specification defines the first-time user onboarding wizard for ForgeStack. The onboarding wizard guides new users through initial setup after signup, helping them create their first organization, invite team members, and optionally select a plan.

### Core Capabilities

- **Step-based wizard** – Guided multi-step flow for new user setup
- **Progress tracking** – Visual progress indicator and localStorage persistence
- **Skip functionality** – Users can skip optional steps or entire onboarding
- **Org creation** – Create first organization during onboarding
- **Team invitations** – Optionally invite team members
- **Plan selection** – Choose subscription plan (if billing enabled)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                  Onboarding Page (/onboarding)                   ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  ProgressBar (Step 1 of 5)                                │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  WizardStep (dynamic based on current step)               │  ││
│  │  │  - WelcomeStep                                            │  ││
│  │  │  - CreateOrgStep                                          │  ││
│  │  │  - InviteTeamStep                                         │  ││
│  │  │  - ChoosePlanStep                                         │  ││
│  │  │  - CompleteStep                                           │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  Navigation (Back / Next / Skip)                          │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  State: { currentStep, orgId?, invites[], planId? }                 │
│  Persisted in: localStorage                                          │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                              │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    UsersModule (extended)                         ││
│  │  GET  /users/me/onboarding-status                                ││
│  │  POST /users/me/complete-onboarding                              ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  Existing services used:                                              │
│  - OrganizationsService.create()                                      │
│  - InvitationsService.create() (if team invites enabled)              │
│  - SubscriptionsService.selectPlan() (if billing enabled)             │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Database (Postgres)                           │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  users table                                                      ││
│  │  + onboardingCompletedAt: timestamp | null                        ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Full-screen experience** – No app shell, focused wizard UI
- **Progressive disclosure** – One step at a time to reduce cognitive load
- **Skippable** – Users can skip optional steps or entire onboarding
- **Persistent progress** – Progress saved to localStorage to survive refresh
- **Mobile responsive** – Works on all screen sizes

---

## Onboarding Flow

### Step 1: Welcome

| Element | Description |
|---------|-------------|
| Greeting | "Welcome, {userName}!" personalized message |
| Intro Text | Brief intro to ForgeStack and what to expect |
| CTA Button | "Let's get started" button to proceed |
| Skip Link | "Skip onboarding" link to go directly to dashboard |

### Step 2: Create Organization

| Element | Description |
|---------|-------------|
| Header | "Create your organization" |
| Name Input | Required organization name field (1-100 chars) |
| Logo Upload | Optional logo upload (drag & drop or click) |
| Skip Button | "Skip – create default org" creates "My Organization" |
| Next Button | "Create & Continue" button |

**Behavior:**
- If skipped, creates organization with name "{userName}'s Organization"
- Logo upload uses existing file upload infrastructure (if available)
- Org ID stored in wizard state for subsequent steps

### Step 3: Invite Team (Optional)

| Element | Description |
|---------|-------------|
| Header | "Invite your team" |
| Email Input | Multi-email input field (comma-separated or multi-line) |
| Role Selector | Default role for invitees (MEMBER or ADMIN) |
| Skip Button | "I'll do this later" skip button |
| Next Button | "Send Invites & Continue" button |

**Behavior:**
- Emails validated before sending
- Invalid emails highlighted with error
- Invitations sent via InvitationsService
- Can skip entirely without adding any invites

### Step 4: Choose Plan (Conditional)

| Element | Description |
|---------|-------------|
| Header | "Choose your plan" |
| Plan Cards | Display available plans with features |
| Free Tier | Free tier highlighted as default/recommended |
| Skip Button | "Start with Free" button |
| Select Button | "Select Plan" button on each plan card |

**Behavior:**
- Only shown if billing feature is enabled
- Skipped automatically if billing disabled
- Free tier can be selected without payment
- Paid tiers redirect to Stripe Checkout (handled post-onboarding)

### Step 5: Complete

| Element | Description |
|---------|-------------|
| Success Icon | Checkmark or celebration animation |
| Message | "You're all set!" success message |
| Summary | Brief summary of what was configured |
| Quick Links | Links to common next actions (Create Project, View Docs) |
| CTA Button | "Go to Dashboard" button |

**Behavior:**
- Calls `POST /users/me/complete-onboarding` to mark complete
- Clears localStorage wizard state
- Redirects to `/dashboard` on CTA click

---

## Acceptance Criteria

### API Endpoints

#### GET /api/v1/users/me/onboarding-status

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | No (uses `@NoOrgRequired()`) |
| Response (200) | `{ needsOnboarding: boolean, completedAt: string | null }` |

**Behavior:**
- Returns `needsOnboarding: true` if `onboardingCompletedAt` is null
- Returns `needsOnboarding: false` if onboarding already completed
- Used by frontend to determine redirect after login

#### POST /api/v1/users/me/complete-onboarding

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | No (uses `@NoOrgRequired()`) |
| Response (200) | `{ completedAt: string }` |

**Behavior:**
- Sets `onboardingCompletedAt` to current timestamp
- Idempotent – calling again returns existing timestamp
- Does not require org context (user may have skipped org creation)

### Frontend Requirements

#### 1. Onboarding Route (`/onboarding`)
- Full-screen layout (no sidebar, no header)
- Clean, focused UI with centered content
- Progress bar at top showing current step
- Responsive design for mobile

#### 2. Post-Signup Redirect
- After successful signup, check onboarding status
- If `needsOnboarding: true`, redirect to `/onboarding`
- If already completed, redirect to `/dashboard`

#### 3. Progress Persistence
- Store wizard state in localStorage
- Keys: `forgestack_onboarding_step`, `forgestack_onboarding_data`
- Restore progress on page reload
- Clear on completion or skip

#### 4. Skip Entire Onboarding
- "Skip onboarding" link visible on all steps
- Confirms skip with modal dialog
- Calls complete-onboarding endpoint
- Redirects to dashboard

### Database Schema

#### users table extension

```sql
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

---

## Tasks & Subtasks

### Backend Tasks

#### 1. Create Database Migration
- [ ] Create migration file for `onboarding_completed_at` column
- [ ] Add column to users table (nullable timestamp)
- [ ] Update Drizzle schema in `@forgestack/db`

#### 2. Extend UsersService
- [ ] Add `getOnboardingStatus(userId)` method
- [ ] Add `completeOnboarding(userId)` method
- [ ] Query/update `onboardingCompletedAt` field

#### 3. Extend UsersController
- [ ] Add `GET /users/me/onboarding-status` endpoint
- [ ] Add `POST /users/me/complete-onboarding` endpoint
- [ ] Apply `@NoOrgRequired()` decorator to both endpoints

#### 4. Create DTOs
- [ ] Create `OnboardingStatusDto` response type
- [ ] Create `CompleteOnboardingDto` response type

### Frontend Tasks

#### 1. Create Onboarding Layout
- [ ] Create `apps/web/src/app/(onboarding)/layout.tsx`
- [ ] Full-screen layout without app shell
- [ ] Centered content container
- [ ] Optional background pattern/gradient

#### 2. Create Onboarding Page
- [ ] Create `apps/web/src/app/(onboarding)/onboarding/page.tsx`
- [ ] Wizard state management with useState/useReducer
- [ ] Step navigation logic
- [ ] localStorage persistence

#### 3. Create Progress Bar Component
- [ ] Create `apps/web/src/components/onboarding/progress-bar.tsx`
- [ ] Visual step indicator (1 of 5)
- [ ] Animated progress fill
- [ ] Step labels (optional)

#### 4. Create Welcome Step
- [ ] Create `apps/web/src/components/onboarding/steps/welcome-step.tsx`
- [ ] Personalized greeting with user name
- [ ] ForgeStack intro text
- [ ] "Let's get started" CTA button

#### 5. Create Org Step
- [ ] Create `apps/web/src/components/onboarding/steps/create-org-step.tsx`
- [ ] Organization name input with validation
- [ ] Optional logo upload field
- [ ] "Skip" and "Create & Continue" buttons
- [ ] Call `POST /organizations` on submit

#### 6. Create Invite Step
- [ ] Create `apps/web/src/components/onboarding/steps/invite-team-step.tsx`
- [ ] Multi-email input component
- [ ] Role selector dropdown
- [ ] Email validation
- [ ] "Skip" and "Send Invites" buttons
- [ ] Call invitations API on submit

#### 7. Create Plan Step
- [ ] Create `apps/web/src/components/onboarding/steps/choose-plan-step.tsx`
- [ ] Plan cards with features list
- [ ] Free tier highlighted
- [ ] "Select Plan" buttons
- [ ] Conditionally render based on billing feature flag

#### 8. Create Complete Step
- [ ] Create `apps/web/src/components/onboarding/steps/complete-step.tsx`
- [ ] Success message and icon
- [ ] Summary of configured items
- [ ] Quick links section
- [ ] "Go to Dashboard" CTA

#### 9. Create useOnboarding Hook
- [ ] Create `apps/web/src/hooks/use-onboarding.ts`
- [ ] `checkOnboardingStatus()` – fetch status from API
- [ ] `completeOnboarding()` – mark as complete
- [ ] Loading and error states

#### 10. Update Auth Flow
- [ ] Update post-signup redirect logic
- [ ] Check onboarding status after login/signup
- [ ] Redirect to `/onboarding` if needed

#### 11. Create Skip Confirmation Modal
- [ ] Create `apps/web/src/components/onboarding/skip-modal.tsx`
- [ ] Confirmation dialog with warning message
- [ ] "Cancel" and "Skip Anyway" buttons

---

## Test Plan

### Backend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `UsersService.getOnboardingStatus()` returns true when null | `needsOnboarding: true` |
| `UsersService.getOnboardingStatus()` returns false when set | `needsOnboarding: false` |
| `UsersService.completeOnboarding()` sets timestamp | `onboardingCompletedAt` is current time |
| `UsersService.completeOnboarding()` is idempotent | Returns existing timestamp if called twice |

### Backend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /users/me/onboarding-status` returns 200 | Status object returned |
| `GET /users/me/onboarding-status` without auth returns 401 | Unauthorized error |
| `POST /users/me/complete-onboarding` returns 200 | Timestamp returned |
| `POST /users/me/complete-onboarding` updates user record | DB record updated |
| Both endpoints work without X-Org-Id header | No 400 error |

### Frontend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| ProgressBar renders correct step count | "Step 1 of 5" visible |
| ProgressBar shows correct fill percentage | 20% filled for step 1 |
| WelcomeStep displays user name | Personalized greeting shown |
| CreateOrgStep validates empty name | Error message displayed |
| CreateOrgStep calls API on submit | Organization created |
| CreateOrgStep skip creates default org | Default org name used |
| InviteTeamStep validates email format | Invalid emails highlighted |
| InviteTeamStep allows skip | Proceeds without invites |
| ChoosePlanStep hidden when billing disabled | Component not rendered |
| CompleteStep calls complete API | Onboarding marked complete |
| Skip modal appears on skip link click | Modal displayed |
| Skip modal confirms skip | Redirects to dashboard |

### Frontend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Full wizard flow works end-to-end | All steps complete |
| Progress persists on page reload | Returns to current step |
| Skip entire onboarding works | Redirected to dashboard |
| Post-signup redirects to onboarding | /onboarding page shown |
| Completed user redirects to dashboard | /dashboard shown |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| New user completes onboarding | Sign up → Complete all steps → Click "Go to Dashboard" | Dashboard displayed |
| User skips onboarding entirely | Sign up → Click "Skip onboarding" → Confirm | Dashboard displayed |
| User skips optional steps | Sign up → Welcome → Skip org → Skip invites → Skip plan → Complete | Dashboard displayed |
| User creates org during onboarding | Sign up → Enter org name → Submit | Org created, proceeds to next step |
| User invites team during onboarding | Sign up → Create org → Enter emails → Submit | Invites sent |
| Returning user skips onboarding check | Login (completed user) → | Direct to dashboard |
| Progress persists across refresh | Start onboarding → Step 2 → Refresh → | Returns to step 2 |

---

## Implementation Notes

### Project Structure

```
apps/api/src/
├── users/
│   ├── users.service.ts     # Extended with onboarding methods
│   ├── users.controller.ts  # Extended with onboarding endpoints
│   └── dto/
│       └── onboarding.dto.ts
└── ...

apps/web/src/
├── app/
│   ├── (onboarding)/
│   │   ├── layout.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   └── (auth)/
│       └── signup/
│           └── page.tsx     # Updated for redirect
├── components/
│   └── onboarding/
│       ├── progress-bar.tsx
│       ├── skip-modal.tsx
│       └── steps/
│           ├── welcome-step.tsx
│           ├── create-org-step.tsx
│           ├── invite-team-step.tsx
│           ├── choose-plan-step.tsx
│           └── complete-step.tsx
├── hooks/
│   └── use-onboarding.ts
└── lib/
    └── onboarding-storage.ts
```

### Wizard State Shape

```typescript
interface OnboardingState {
  currentStep: number;
  data: {
    orgId?: string;
    orgName?: string;
    invitedEmails?: string[];
    selectedPlanId?: string;
  };
}
```

### localStorage Persistence

```typescript
// apps/web/src/lib/onboarding-storage.ts
const STEP_KEY = 'forgestack_onboarding_step';
const DATA_KEY = 'forgestack_onboarding_data';

export function getOnboardingProgress(): OnboardingState | null {
  if (typeof window === 'undefined') return null;
  const step = localStorage.getItem(STEP_KEY);
  const data = localStorage.getItem(DATA_KEY);
  if (!step) return null;
  return {
    currentStep: parseInt(step, 10),
    data: data ? JSON.parse(data) : {},
  };
}

export function saveOnboardingProgress(state: OnboardingState): void {
  localStorage.setItem(STEP_KEY, state.currentStep.toString());
  localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
}

export function clearOnboardingProgress(): void {
  localStorage.removeItem(STEP_KEY);
  localStorage.removeItem(DATA_KEY);
}
```

### Post-Signup Redirect Logic

```typescript
// In signup success handler
async function handleSignupSuccess() {
  const status = await checkOnboardingStatus();
  if (status.needsOnboarding) {
    router.push('/onboarding');
  } else {
    router.push('/dashboard');
  }
}
```

### Skip Modal Component

```typescript
// apps/web/src/components/onboarding/skip-modal.tsx
export function SkipOnboardingModal({ onConfirm, onCancel }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip Onboarding?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          You can always set up your organization and invite team members later
          from the settings page.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Skip Anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Design Specifications

### Layout
- Full-screen wizard (100vh, no scrolling if possible)
- Centered content with max-width of 600px
- Progress bar fixed at top (h-1 or h-2)
- Navigation buttons at bottom

### Colors
- Progress bar: primary color (brand blue)
- Background: subtle gradient or pattern
- Cards: white with subtle shadow

### Typography
- Step titles: text-2xl font-bold
- Body text: text-muted-foreground
- Button text: font-medium

### Spacing
- Section padding: p-8 on desktop, p-4 on mobile
- Element spacing: space-y-6

### Animations
- Step transitions: fade + slide
- Progress bar: smooth width transition
- Success step: confetti or checkmark animation

---

## Security Considerations

1. **Authentication required** – All onboarding endpoints require valid session
2. **No org context needed** – Endpoints use `@NoOrgRequired()` decorator
3. **Idempotent completion** – Safe to call complete multiple times
4. **Input validation** – Validate org name, email formats
5. **Rate limiting** – Apply rate limits to invitation sending

---

## Dependencies

- **Authentication** – User must be authenticated
- **Organization Management** – For creating organizations
- **Invitations Service** – For sending team invites (optional)
- **Billing/Subscriptions** – For plan selection (optional)
- **@forgestack/ui** – Dialog, Button, Input components
- **Feature Flags** – To conditionally show billing step

---

## Future Enhancements (Out of Scope for v1)

- Onboarding analytics tracking
- A/B testing different onboarding flows
- Video tutorials in welcome step
- Template project creation during onboarding
- Import from existing tools (Jira, GitHub, etc.)
- Personalized recommendations based on team size
- Re-run onboarding for existing users
- Admin-configurable onboarding steps

---

*End of spec*

