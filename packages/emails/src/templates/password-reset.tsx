import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { BaseEmailProps } from '../types';
import { Button } from '../components/button';
import { Footer } from '../components/footer';
import { Header } from '../components/header';

export interface PasswordResetEmailProps extends BaseEmailProps {
  userName?: string;
  resetUrl: string;
  expiresIn: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  expiresIn,
  orgBranding,
  previewText = 'Reset your password',
}: PasswordResetEmailProps) {
  const greeting = userName ? `Hi ${userName}` : 'Hello';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>Reset Your Password</Text>
            <Text style={paragraphStyle}>
              {greeting}, we received a request to reset your password.
            </Text>
            <Text style={paragraphStyle}>
              Click the button below to create a new password. This link will expire in {expiresIn}.
            </Text>
            <Button
              href={resetUrl}
              primaryColor={orgBranding?.primaryColor}
            >
              Reset Password
            </Button>
            <Text style={warningStyle}>
              ⚠️ If you didn't request this password reset, please ignore this email or contact support
              if you have concerns about your account security.
            </Text>
            <Text style={paragraphStyle}>
              For security reasons, this link can only be used once and will expire after {expiresIn}.
            </Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const contentSection = {
  padding: '32px 24px',
};

const headingStyle = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 24px',
};

const paragraphStyle = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '16px 0',
};

const warningStyle = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  padding: '12px',
  borderRadius: '6px',
  margin: '16px 0',
};

