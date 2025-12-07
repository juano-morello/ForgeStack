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

export interface PaymentFailedEmailProps extends BaseEmailProps {
  amount: string;
  updatePaymentUrl: string;
  retryDate?: string;
}

export function PaymentFailedEmail({
  amount,
  updatePaymentUrl,
  retryDate,
  orgBranding,
  previewText = 'Payment failed - action required',
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>Payment Failed</Text>
            <Text style={warningStyle}>
              ⚠️ We were unable to process your payment of {amount}.
            </Text>
            <Text style={paragraphStyle}>
              Your subscription is still active, but we need you to update your payment method to avoid
              any interruption in service.
            </Text>
            {retryDate && (
              <Text style={paragraphStyle}>
                We'll automatically retry the payment on {retryDate}. Please update your payment method
                before then to ensure uninterrupted service.
              </Text>
            )}
            <Button
              href={updatePaymentUrl}
              primaryColor={orgBranding?.primaryColor}
            >
              Update Payment Method
            </Button>
            <Text style={paragraphStyle}>
              If you have any questions or need assistance, please don't hesitate to contact our support team.
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
  fontSize: '16px',
  lineHeight: '24px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  padding: '16px',
  borderRadius: '6px',
  margin: '16px 0',
  fontWeight: '600',
};

