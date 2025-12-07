# Email Templates System (react-email)

**Epic:** Infrastructure
**Priority:** P2
**Depends on:** BullMQ Worker, Resend Integration, Organizations Module
**Status:** Draft

---

## Overview

Implement a professional transactional email system using react-email for beautiful, responsive, type-safe email templates. This system will provide consistent email branding across all ForgeStack communications with support for per-organization customization.

### Why react-email?

- **React Components** – Write emails as React components with full TypeScript support
- **Preview Server** – Live preview during development with hot reload
- **Inline CSS** – Automatic CSS inlining for email client compatibility
- **Responsive** – Mobile-friendly emails out of the box
- **Tested Components** – Pre-built components for common email patterns

### Key Components

1. **`packages/emails`** – Shared email templates package
2. **Template Components** – React Email templates for each email type
3. **Email Service** – Render and send emails via Resend
4. **Preview Server** – Development server for template preview
5. **Org Customization** – Per-organization branding (logo, colors)

### Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   NestJS API    │         │  BullMQ Worker  │         │     Resend      │
│                 │         │                 │         │                 │
│  Queue email    │ ──────▶ │  Render + Send  │ ──────▶ │  Deliver email  │
│  job to Redis   │         │  via EmailSvc   │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        │                   ┌───────▼───────┐
        │                   │packages/emails│
        │                   │               │
        │                   │ React Email   │
        │                   │ Templates     │
        └───────────────────┴───────────────┘
```

### Email Types

| Category | Template | Trigger |
|----------|----------|---------|
| Auth | Welcome Email | User signup |
| Auth | Password Reset | Password reset request |
| Auth | Email Verification | Email change request |
| Org | Organization Invitation | Member invited |
| Org | Invitation Accepted | Invite accepted notification |
| Billing | Subscription Confirmed | Subscription created |
| Billing | Payment Failed | Payment failed |
| Billing | Subscription Cancelled | Subscription cancelled |
| Notification | Generic Notification | Any notification with email |

---

## Acceptance Criteria

### Template Package Setup
- [ ] `packages/emails` package created with react-email
- [ ] Preview server runs at `localhost:3030` via `pnpm email:dev`
- [ ] All templates render correctly in preview server
- [ ] Templates are exported with TypeScript types for props
- [ ] Package is consumable by `@forgestack/worker`

### Core Templates
- [ ] Welcome email template with dashboard CTA
- [ ] Password reset template with reset link and expiry
- [ ] Organization invitation template with accept/decline buttons
- [ ] Subscription confirmation with plan details
- [ ] Payment failed with update payment CTA
- [ ] Generic notification template for system alerts

### Template Features
- [ ] All templates are responsive (mobile + desktop)
- [ ] All templates include unsubscribe link (where applicable)
- [ ] All templates use consistent header/footer layout
- [ ] All templates support dark mode preferences (optional)
- [ ] CSS is automatically inlined for email clients
- [ ] Templates pass email client compatibility checks

### Organization Branding
- [ ] Templates accept org branding props (logo, primary color)
- [ ] Default ForgeStack branding used when org branding not set
- [ ] Logo rendered at appropriate size (max 200px width)
- [ ] Primary color applied to buttons and accents
- [ ] Org name displayed in relevant templates

### Email Service Integration
- [ ] Worker renders templates server-side before sending
- [ ] Templates receive strongly-typed props
- [ ] Plain text version auto-generated from HTML
- [ ] Email metadata (subject, preview text) defined per template
- [ ] Failed renders logged with template name and props

### Queue Integration
- [ ] Emails queued via BullMQ `email` queue
- [ ] Jobs include retry logic (3 attempts, exponential backoff)
- [ ] Failed jobs logged with error details
- [ ] Job completion tracked for debugging

---

## Tasks & Subtasks

### 1. Package Setup Tasks

#### 1.1 Create packages/emails Package
- [ ] Create `packages/emails/` directory structure
- [ ] Initialize `package.json` with react-email dependencies
- [ ] Configure TypeScript with `tsconfig.json`
- [ ] Add to pnpm workspace in `pnpm-workspace.yaml`
- [ ] Configure Turborepo build pipeline in `turbo.json`

#### 1.2 Configure react-email
- [ ] Install `@react-email/components` and `react-email`
- [ ] Create `emails/` directory for template components
- [ ] Configure preview server script
- [ ] Add `email:dev` script to root `package.json`
- [ ] Create `.react-email/` config (gitignored)

#### 1.3 Create Shared Components
- [ ] Create `components/layout.tsx` – Base email layout
- [ ] Create `components/header.tsx` – Email header with logo
- [ ] Create `components/footer.tsx` – Email footer with links
- [ ] Create `components/button.tsx` – CTA button component
- [ ] Create `components/divider.tsx` – Section divider
- [ ] Create `types/branding.ts` – Org branding type definitions

### 2. Template Implementation Tasks

#### 2.1 Welcome Email Template
- [ ] Create `emails/welcome.tsx`
- [ ] Props: `{ userName, dashboardUrl, orgBranding? }`
- [ ] Include greeting, platform intro, dashboard CTA
- [ ] Export `WelcomeEmailProps` type

#### 2.2 Password Reset Template
- [ ] Create `emails/password-reset.tsx`
- [ ] Props: `{ userName?, resetUrl, expiresIn, orgBranding? }`
- [ ] Include reset button, expiry warning, security note
- [ ] Export `PasswordResetEmailProps` type

#### 2.3 Organization Invitation Template
- [ ] Create `emails/invitation.tsx`
- [ ] Props: `{ inviterName?, orgName, role, acceptUrl, declineUrl, expiresIn, orgBranding? }`
- [ ] Include accept/decline buttons, role explanation
- [ ] Export `InvitationEmailProps` type

#### 2.4 Subscription Confirmed Template
- [ ] Create `emails/subscription-confirmed.tsx`
- [ ] Props: `{ orgName, planName, amount, billingPeriod, billingPortalUrl, orgBranding? }`
- [ ] Include plan details, billing portal link
- [ ] Export `SubscriptionConfirmedEmailProps` type

#### 2.5 Payment Failed Template
- [ ] Create `emails/payment-failed.tsx`
- [ ] Props: `{ orgName, amount, retryDate?, billingPortalUrl, orgBranding? }`
- [ ] Include update payment CTA, urgency messaging
- [ ] Export `PaymentFailedEmailProps` type

#### 2.6 Generic Notification Template
- [ ] Create `emails/notification.tsx`
- [ ] Props: `{ title, body, link?, unsubscribeUrl?, orgBranding? }`
- [ ] Flexible template for system notifications
- [ ] Export `NotificationEmailProps` type

### 3. Worker Integration Tasks

#### 3.1 Update Email Service
- [ ] Add `@forgestack/emails` dependency to worker
- [ ] Import and use react-email `render()` function
- [ ] Create template renderer wrapper with error handling
- [ ] Generate plain text from HTML using `render({ plainText: true })`

#### 3.2 Update Email Handlers
- [ ] Refactor `welcome-email.handler.ts` to use template
- [ ] Refactor `send-invitation.handler.ts` to use template
- [ ] Refactor `notification-email.handler.ts` to use template
- [ ] Add new handler for billing emails

#### 3.3 Org Branding Integration
- [ ] Fetch org branding (logo, primaryColor) in handlers
- [ ] Pass branding props to templates
- [ ] Cache org branding to avoid repeated DB queries
- [ ] Fallback to default branding if org not found

### 4. Testing Tasks

#### 4.1 Template Unit Tests
- [ ] Test each template renders without errors
- [ ] Test templates with all optional props
- [ ] Test templates with org branding
- [ ] Test templates without org branding (defaults)
- [ ] Snapshot tests for template HTML output

#### 4.2 Email Service Tests
- [ ] Test template rendering produces valid HTML
- [ ] Test plain text generation
- [ ] Test error handling for invalid props
- [ ] Test branding fallback logic

---

## Test Plan

### Unit Tests

#### Template Rendering Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Welcome template renders with name | Valid HTML with personalized greeting |
| Welcome template renders without name | Valid HTML with generic greeting |
| Invitation template with inviter name | Shows "John invited you" |
| Invitation template without inviter | Shows "You've been invited" |
| All templates accept org branding | Custom logo/colors applied |
| Templates without branding | Default ForgeStack branding |
| Password reset shows expiry | "Link expires in 1 hour" text |
| Payment failed shows retry date | Next retry date displayed |

#### Email Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Render welcome email | Returns HTML string |
| Render with invalid props | Throws descriptive error |
| Generate plain text | Returns text without HTML |
| Fetch org branding | Returns logo and primaryColor |
| Missing org branding | Returns default branding |

### Integration Tests

#### Worker Handler Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Welcome email handler uses template | Calls render with correct props |
| Invitation email includes org branding | Logo visible in email |
| Billing email sent on subscription | Correct template and props |
| Failed template render | Job fails, error logged |

### Visual Tests

#### Preview Server Tests
| Test Case | Expected Result |
|-----------|-----------------|
| All templates visible in preview | No render errors |
| Templates responsive on mobile | Layout adjusts correctly |
| Dark mode preview works | Colors adjust appropriately |
| Links clickable in preview | Navigation works |

---

## API Reference

### Template Props

#### Common Props (all templates)
```typescript
interface OrgBranding {
  orgName: string;
  logo?: string;        // URL to org logo
  primaryColor?: string; // Hex color (e.g., "#3B82F6")
}

interface BaseEmailProps {
  orgBranding?: OrgBranding;
  previewText?: string; // Email preview in inbox
}
```

#### WelcomeEmailProps
```typescript
interface WelcomeEmailProps extends BaseEmailProps {
  userName?: string;
  dashboardUrl: string;
}
```

#### PasswordResetEmailProps
```typescript
interface PasswordResetEmailProps extends BaseEmailProps {
  userName?: string;
  resetUrl: string;
  expiresIn: string; // e.g., "1 hour"
}
```

#### InvitationEmailProps
```typescript
interface InvitationEmailProps extends BaseEmailProps {
  inviterName?: string;
  orgName: string;
  role: 'OWNER' | 'MEMBER';
  acceptUrl: string;
  declineUrl?: string;
  expiresIn: string; // e.g., "7 days"
}
```

#### BillingEmailProps
```typescript
interface SubscriptionConfirmedEmailProps extends BaseEmailProps {
  orgName: string;
  planName: string;
  amount: string;         // Formatted price, e.g., "$29.00"
  billingPeriod: 'monthly' | 'yearly';
  billingPortalUrl: string;
}

interface PaymentFailedEmailProps extends BaseEmailProps {
  orgName: string;
  amount: string;
  retryDate?: string;     // ISO date string
  billingPortalUrl: string;
}
```

### Queue Job Data

#### Email Job Schema
```typescript
interface EmailJobData {
  template: 'welcome' | 'password-reset' | 'invitation' |
            'subscription-confirmed' | 'payment-failed' | 'notification';
  to: string;
  subject: string;
  props: Record<string, unknown>; // Template-specific props
  orgId?: string;          // For branding lookup
  replyTo?: string;
  tags?: string[];         // Resend tags for analytics
}
```

---

## Project Structure

```
packages/emails/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main exports
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   └── branding.ts       # OrgBranding types
│   ├── components/
│   │   ├── layout.tsx        # Base email layout
│   │   ├── header.tsx        # Email header
│   │   ├── footer.tsx        # Email footer
│   │   ├── button.tsx        # CTA button
│   │   └── divider.tsx       # Section divider
│   └── emails/
│       ├── welcome.tsx
│       ├── password-reset.tsx
│       ├── invitation.tsx
│       ├── subscription-confirmed.tsx
│       ├── payment-failed.tsx
│       └── notification.tsx
└── emails/                   # Preview server directory
    └── [same as src/emails/] # Symlink or copy for preview

apps/worker/src/
├── services/
│   ├── email.service.ts      # Updated with template rendering
│   └── email-templates.ts    # Template helper functions
└── handlers/
    ├── welcome-email.handler.ts       # Uses WelcomeEmail
    ├── send-invitation.handler.ts     # Uses InvitationEmail
    ├── notification-email.handler.ts  # Uses NotificationEmail
    └── billing-email.handler.ts       # NEW: billing templates
```

---

## Dependencies

### packages/emails

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-email/components` | `^0.0.x` | React Email component library |
| `react-email` | `^3.x` | Preview server and render |
| `react` | `^19.x` | React runtime |
| `react-dom` | `^19.x` | React DOM (for rendering) |

### apps/worker (additions)

| Package | Version | Purpose |
|---------|---------|---------|
| `@forgestack/emails` | `workspace:*` | Email templates package |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for email delivery | Yes |
| `EMAIL_FROM` | Default from address | Yes |
| `APP_URL` | Base URL for email links | Yes |

---

## Multi-Tenancy Considerations

- [ ] Org branding fetched per-email (logo, primaryColor from organizations table)
- [ ] Emails remain functional if org branding is null
- [ ] Default ForgeStack branding hardcoded as fallback
- [ ] Org name always displayed when available
- [ ] No org-specific data leaks across tenants

---

## Security Considerations

1. **No sensitive data in templates** – Never include passwords, API keys, or tokens in email body
2. **Signed links** – Password reset and invitation links must use signed tokens with expiry
3. **Unsubscribe tokens** – Signed JWTs to prevent unsubscribe link abuse
4. **Rate limiting** – Email sending rate-limited per user/org
5. **Template injection** – Sanitize any user-provided content before rendering
6. **Preview server** – Only runs in development (not in production)
7. **Org branding validation** – Validate logo URLs are from allowed domains

---

## Performance Considerations

1. **Template precompilation** – Consider precompiling templates for faster rendering
2. **Branding cache** – Cache org branding with short TTL to reduce DB queries
3. **Async rendering** – Template rendering is async, doesn't block job processing
4. **Batch sending** – Consider batching emails for bulk operations
5. **Queue priority** – Transactional emails (password reset) higher priority than notifications

---

## Migration Notes

### Worker Handler Updates

Existing email handlers need refactoring:

1. `welcome-email.handler.ts` – Replace inline HTML with `WelcomeEmail` component
2. `send-invitation.handler.ts` – Replace inline HTML with `InvitationEmail` component
3. `notification-email.handler.ts` – Replace inline HTML with `NotificationEmail` component

### Backward Compatibility

- Existing email jobs will continue to work during migration
- New template system can be rolled out incrementally per email type
- Feature flag `use_react_email_templates` can gate adoption

---

## Development Workflow

### Starting Preview Server

```bash
# From repo root
pnpm email:dev

# Opens http://localhost:3030
```

### Creating New Template

1. Create `packages/emails/src/emails/my-template.tsx`
2. Export component and props type
3. Add to `packages/emails/src/index.ts` exports
4. Create preview in `packages/emails/emails/my-template.tsx`
5. Test in preview server
6. Create handler in worker or update existing

### Template Testing

```bash
# Run template unit tests
pnpm --filter @forgestack/emails test

# Visual testing via preview server
pnpm email:dev
```

---

## Future Enhancements (Out of Scope)

- **Email analytics** – Track open rates, click rates via Resend
- **A/B testing** – Test different email variants
- **Localization** – Multi-language email templates
- **Rich templates** – Support for attachments, calendar invites
- **Template versioning** – Track template changes over time
- **Email scheduling** – Send emails at optimal times
- **Digest emails** – Daily/weekly notification summaries
- **Custom domains** – Per-org sender domains

---

*End of spec*

