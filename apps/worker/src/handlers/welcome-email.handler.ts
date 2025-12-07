/**
 * Welcome Email Handler
 * Sends welcome emails to new users
 */

import { Job } from 'bullmq';
import { render } from '@react-email/components';
import { WelcomeEmail } from '@forgestack/emails';
import { sendEmail } from '../services/email.service';
import { config } from '../config';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('WelcomeEmail');

export interface WelcomeEmailJobData {
  userId: string;
  email: string;
  name?: string;
}

export async function handleWelcomeEmail(job: Job<WelcomeEmailJobData>) {
  const { email, name } = job.data;

  logger.info({ jobId: job.id, email, name }, 'Processing welcome email job');

  const dashboardUrl = `${config.email.appUrl}/dashboard`;

  // Render the email template
  const html = await render(
    WelcomeEmail({
      userName: name,
      dashboardUrl,
    })
  );

  await sendEmail({
    to: email,
    subject: 'Welcome to ForgeStack! 🚀',
    html,
  });

  logger.info({ email }, 'Welcome email sent successfully');
  return { sent: true, email };
}

