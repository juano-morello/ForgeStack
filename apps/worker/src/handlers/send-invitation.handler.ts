/**
 * Send Invitation Email Handler
 * Sends invitation emails to users invited to organizations
 */

import { Job } from 'bullmq';
import { sendEmail } from '../services/email.service';
import { config } from '../config';

export interface SendInvitationJobData {
  invitationId: string;
  email: string;
  orgName: string;
  role: 'OWNER' | 'MEMBER';
  token: string;
  inviterName?: string;
}

export async function handleSendInvitation(job: Job<SendInvitationJobData>) {
  const { email, orgName, role, token, inviterName } = job.data;

  console.log(`[SendInvitation] Processing job ${job.id} for ${email}`);

  const acceptUrl = `${config.email.appUrl}/invitations/accept?token=${token}`;
  const declineUrl = `${config.email.appUrl}/invitations/decline?token=${token}`;

  const roleText = role === 'OWNER' ? 'an owner' : 'a member';
  const inviterText = inviterName ? `${inviterName} has` : 'You have been';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">You're invited to join ${orgName}</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ${inviterText} invited you to join <strong>${orgName}</strong> as ${roleText}.
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Click the button below to accept this invitation and join the organization.
        </p>
        
        <div style="margin: 32px 0; text-align: center;">
          <a href="${acceptUrl}" 
             style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px;">
          If you don't want to join, you can <a href="${declineUrl}" style="color: #666;">decline this invitation</a>.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        
        <p style="color: #999; font-size: 12px;">
          This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
You're invited to join ${orgName}

${inviterText} invited you to join ${orgName} as ${roleText}.

Accept invitation: ${acceptUrl}

Decline invitation: ${declineUrl}

This invitation will expire in 7 days.
  `.trim();

  await sendEmail({
    to: email,
    subject: `You're invited to join ${orgName}`,
    html,
    text,
  });

  console.log(`[SendInvitation] Sent invitation email to ${email}`);
  return { sent: true, email };
}

