/**
 * Notification Email Handler
 * Sends email notifications to users via Resend
 */

import { Job } from 'bullmq';
import { sendEmail } from '../services/email.service';
import { config } from '../config';
import { withServiceContext, notifications, users, eq, and } from '@forgestack/db';

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

  console.log(`[NotificationEmail] Processing job ${job.id} for user ${userId}`);

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
      console.error(`[NotificationEmail] User ${userId} not found`);
      throw new Error(`User ${userId} not found`);
    }

    if (!user.email) {
      console.error(`[NotificationEmail] User ${userId} has no email`);
      throw new Error(`User ${userId} has no email`);
    }

    // Build email content
    const actionLink = link ? `${config.email.appUrl}${link}` : undefined;
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        ${body ? `<p>${body}</p>` : ''}
        ${actionLink ? `<p><a href="${actionLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from ForgeStack.
        </p>
      </div>
    `;

    const textContent = `
${title}

${body || ''}

${actionLink ? `View details: ${actionLink}` : ''}

---
This is an automated notification from ForgeStack.
    `.trim();

    // Send email via Resend
    await sendEmail({
      to: user.email,
      subject: title,
      html: htmlContent,
      text: textContent,
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
      console.error('[NotificationEmail] Failed to update emailSent flag:', updateError);
      // Don't throw - email was sent successfully
    }

    console.log(`[NotificationEmail] Email sent successfully to ${user.email}`);
    return { success: true, email: user.email };
  } catch (error) {
    console.error('[NotificationEmail] Failed to send email:', error);
    throw error; // Let BullMQ retry
  }
}

