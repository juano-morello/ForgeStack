/**
 * Email Service
 * Handles sending emails via Resend
 */

import { Resend } from 'resend';
import { config } from '../config';

// Initialize Resend client (will be null if no API key)
const resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 * Falls back to console logging if no API key is configured
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const { to, subject, html, text } = options;

  if (!resend) {
    // Development mode: log email instead of sending
    console.log('[Email] No RESEND_API_KEY configured, logging email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text || html.substring(0, 200)}...`);
    return { id: `dev-${Date.now()}` };
  }

  const { data, error } = await resend.emails.send({
    from: config.email.fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('[Email] Failed to send:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log(`[Email] Sent successfully, id: ${data?.id}`);
  return { id: data?.id || 'unknown' };
}

