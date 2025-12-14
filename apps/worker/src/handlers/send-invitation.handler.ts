/**
 * Send Invitation Email Handler
 * Sends invitation emails to users invited to organizations
 */

import { Job } from 'bullmq';
import { render } from '@react-email/components';
import { InvitationEmail } from '@forgestack/emails';
import { sendEmail } from '../services/email.service';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('SendInvitation');

export interface SendInvitationJobData {
  invitationId: string;
  email: string;
  orgName: string;
  role: 'OWNER' | 'MEMBER';
  token: string;
  inviterName?: string;
}

export async function handleSendInvitation(job: Job<SendInvitationJobData>) {
  const startTime = Date.now();
  const { email, orgName, token, inviterName } = job.data;

  logger.info({ jobId: job.id, email, orgName }, 'Starting invitation email job');

  try {
    const inviteUrl = `${config.email.appUrl}/invitations/accept?token=${token}`;

    // Render the email template
    const html = await render(
      InvitationEmail({
        inviterName,
        orgName,
        inviteUrl,
      })
    );

    await sendEmail({
      to: email,
      subject: `You're invited to join ${orgName}`,
      html,
    });

    const duration = Date.now() - startTime;
    logger.info({ jobId: job.id, email, orgName, durationMs: duration }, 'Invitation email sent successfully');
    return { sent: true, email };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ jobId: job.id, email, orgName, durationMs: duration, error }, 'Invitation email job failed');
    throw error;
  }
}

