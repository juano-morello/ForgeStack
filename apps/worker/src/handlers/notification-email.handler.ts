/**
 * Notification Email Handler
 * Sends email notifications to users via Resend
 */

import { Job } from 'bullmq';
import { render } from '@react-email/components';
import { NotificationEmail } from '@forgestack/emails';
import { sendEmail } from '../services/email.service';
import { config } from '../config';
import { withServiceContext, notifications, users, eq, and } from '@forgestack/db';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('NotificationEmail');

export interface NotificationEmailJobData {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

export async function handleNotificationEmail(job: Job<NotificationEmailJobData>) {
  const { userId, title, body, link } = job.data;

  logger.info({ jobId: job.id, userId, title }, 'Processing notification email job');

  try {
    // Get user email from database
    const user = await withServiceContext('NotificationEmailHandler.getUser', async (tx) => {
      const [userRecord] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return userRecord;
    });

    if (!user) {
      logger.error({ userId }, 'User not found');
      throw new Error(`User ${userId} not found`);
    }

    if (!user.email) {
      logger.error({ userId }, 'User has no email');
      throw new Error(`User ${userId} has no email`);
    }

    // Build email content
    const actionUrl = link ? `${config.email.appUrl}${link}` : undefined;

    // Render the email template
    const html = await render(
      NotificationEmail({
        title,
        message: body || '',
        actionUrl,
        actionText: actionUrl ? 'View Details' : undefined,
      })
    );

    // Send email via Resend
    await sendEmail({
      to: user.email,
      subject: title,
      html,
    });

    // Update notification record to mark email as sent
    // Note: We don't fail the job if this update fails
    try {
      await withServiceContext('NotificationEmailHandler.updateEmailSent', async (tx) => {
        await tx
          .update(notifications)
          .set({ emailSent: true })
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.type, job.data.type),
              eq(notifications.emailSent, false)
            )
          );
      });
    } catch (updateError) {
      logger.error({ error: updateError }, 'Failed to update emailSent flag');
      // Don't throw - email was sent successfully
    }

    logger.info({ email: user.email }, 'Notification email sent successfully');
    return { success: true, email: user.email };
  } catch (error) {
    logger.error({ error }, 'Failed to send notification email');
    throw error; // Let BullMQ retry
  }
}

