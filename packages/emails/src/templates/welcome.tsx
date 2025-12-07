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

export interface WelcomeEmailProps extends BaseEmailProps {
  userName?: string;
  dashboardUrl: string;
}

export function WelcomeEmail({
  userName,
  dashboardUrl,
  orgBranding,
  previewText = 'Welcome to ForgeStack!',
}: WelcomeEmailProps) {
  const greeting = userName ? `Hi ${userName}` : 'Welcome';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>{greeting}! 👋</Text>
            <Text style={paragraphStyle}>
              Welcome to {orgBranding?.orgName || 'ForgeStack'}! We're excited to have you on board.
            </Text>
            <Text style={paragraphStyle}>
              Your account is now active and ready to use. Get started by exploring your dashboard
              and setting up your first project.
            </Text>
            <Button
              href={dashboardUrl}
              primaryColor={orgBranding?.primaryColor}
            >
              Go to Dashboard
            </Button>
            <Text style={paragraphStyle}>
              If you have any questions or need help getting started, our support team is here to help.
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

