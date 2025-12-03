/**
 * Welcome Email Handler
 * Sends welcome emails to new users
 */

import { Job } from 'bullmq';
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

  const greeting = name ? `Hi ${name}` : 'Welcome';
  const dashboardUrl = `${config.email.appUrl}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">${greeting}, welcome to ForgeStack! 🚀</h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for signing up. We're excited to have you on board!
        </p>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ForgeStack helps you manage your projects and collaborate with your team.
          Get started by creating your first organization.
        </p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${dashboardUrl}"
             style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Go to Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

        <p style="color: #999; font-size: 12px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
${greeting}, welcome to ForgeStack! 🚀

Thank you for signing up. We're excited to have you on board!

ForgeStack helps you manage your projects and collaborate with your team.
Get started by creating your first organization.

Go to Dashboard: ${dashboardUrl}
  `.trim();

  await sendEmail({
    to: email,
    subject: 'Welcome to ForgeStack! 🚀',
    html,
    text,
  });

  logger.info({ email }, 'Welcome email sent successfully');
  return { sent: true, email };
}

