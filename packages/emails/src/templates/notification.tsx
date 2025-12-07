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

export interface NotificationEmailProps extends BaseEmailProps {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  unsubscribeUrl?: string;
}

export function NotificationEmail({
  title,
  message,
  actionUrl,
  actionText,
  unsubscribeUrl,
  orgBranding,
  previewText,
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText || title}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>{title}</Text>
            <Text style={paragraphStyle}>{message}</Text>
            {actionUrl && actionText && (
              <Button
                href={actionUrl}
                primaryColor={orgBranding?.primaryColor}
              >
                {actionText}
              </Button>
            )}
          </Section>
          <Footer unsubscribeUrl={unsubscribeUrl} />
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
  whiteSpace: 'pre-wrap' as const,
};

