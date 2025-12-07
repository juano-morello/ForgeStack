# Email System

ForgeStack's transactional email system using react-email and Resend.

## Architecture Overview

```
packages/emails/           # Email templates package
├── src/
│   ├── templates/         # react-email templates
│   │   ├── welcome.tsx
│   │   ├── password-reset.tsx
│   │   ├── invitation.tsx
│   │   ├── subscription-confirmed.tsx
│   │   ├── payment-failed.tsx
│   │   └── notification.tsx
│   ├── components/        # Shared email components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── button.tsx
│   └── index.ts           # Exports all templates
apps/worker/src/handlers/  # Email sending via BullMQ
└── email.handler.ts
```

## Template Structure

```typescript
// packages/emails/src/templates/welcome.tsx
import { Html, Head, Body, Container, Section, Text, Button, Img } from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
  orgName: string;
  loginUrl: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export function WelcomeEmail({ userName, orgName, loginUrl, branding }: WelcomeEmailProps) {
  const primaryColor = branding?.primaryColor ?? '#6366f1';

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
          {branding?.logoUrl && <Img src={branding.logoUrl} alt={orgName} width={120} />}
          <Section style={{ backgroundColor: 'white', padding: 32, borderRadius: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: 600 }}>Welcome to {orgName}!</Text>
            <Text>Hi {userName},</Text>
            <Text>Your account has been created. Click below to get started:</Text>
            <Button href={loginUrl} style={{ backgroundColor: primaryColor, color: 'white', padding: '12px 24px', borderRadius: 6 }}>
              Go to Dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
```

## Sending Emails (Worker)

```typescript
// apps/worker/src/handlers/email.handler.ts
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail, InvitationEmail, PasswordResetEmail } from '@forge/emails';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailJob =
  | { type: 'welcome'; to: string; userName: string; orgName: string; loginUrl: string }
  | { type: 'invitation'; to: string; inviterName: string; orgName: string; inviteUrl: string }
  | { type: 'password-reset'; to: string; resetUrl: string; expiresIn: string };

export async function handleEmail(job: Job<EmailJob>) {
  const { type, to, ...props } = job.data;

  let html: string;
  let subject: string;

  switch (type) {
    case 'welcome':
      html = await render(WelcomeEmail(props as any));
      subject = `Welcome to ${props.orgName}!`;
      break;
    case 'invitation':
      html = await render(InvitationEmail(props as any));
      subject = `You've been invited to ${props.orgName}`;
      break;
    case 'password-reset':
      html = await render(PasswordResetEmail(props as any));
      subject = 'Reset your password';
      break;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  });
}
```

## Queueing Emails (Backend)

```typescript
// apps/api/src/modules/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJob } from '@forge/worker';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue<EmailJob>) {}

  async sendWelcome(to: string, userName: string, orgName: string) {
    await this.emailQueue.add('send', {
      type: 'welcome',
      to,
      userName,
      orgName,
      loginUrl: `${process.env.APP_URL}/login`,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }

  async sendInvitation(to: string, inviterName: string, orgName: string, token: string) {
    await this.emailQueue.add('send', {
      type: 'invitation',
      to,
      inviterName,
      orgName,
      inviteUrl: `${process.env.APP_URL}/invitations/accept?token=${token}`,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }
}
```

## Development Preview

```bash
# Start react-email dev server
cd packages/emails
pnpm dev
# Opens http://localhost:3030 with live preview
```

## Core Templates

| Template | Trigger | Variables |
|----------|---------|-----------|
| `welcome` | User signup | userName, orgName, loginUrl |
| `password-reset` | Forgot password | resetUrl, expiresIn |
| `invitation` | Team invite | inviterName, orgName, inviteUrl |
| `subscription-confirmed` | Successful payment | planName, amount, nextBillingDate |
| `payment-failed` | Failed charge | amount, updatePaymentUrl, retryDate |
| `notification` | Generic alerts | title, message, actionUrl, actionText |

## Organization Branding

Organizations can customize email appearance:

```typescript
// Get org branding for emails
const branding = await this.orgRepository.getBranding(orgId);
// Returns: { logoUrl?: string, primaryColor?: string }
```

## Related Files

- `packages/emails/` - Email templates package
- `apps/worker/src/handlers/email.handler.ts` - Email worker
- `apps/api/src/modules/email/email.service.ts` - Email queueing service
- `.ai/patterns/background-job.md` - BullMQ patterns

