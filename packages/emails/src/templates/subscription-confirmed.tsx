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

export interface SubscriptionConfirmedEmailProps extends BaseEmailProps {
  planName: string;
  amount: string;
  nextBillingDate: string;
}

export function SubscriptionConfirmedEmail({
  planName,
  amount,
  nextBillingDate,
  orgBranding,
  previewText = 'Your subscription is confirmed',
}: SubscriptionConfirmedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>Subscription Confirmed ✓</Text>
            <Text style={paragraphStyle}>
              Thank you for subscribing to {planName}!
            </Text>
            <Section style={detailsBox}>
              <Text style={detailLabel}>Plan</Text>
              <Text style={detailValue}>{planName}</Text>
              <Text style={detailLabel}>Amount</Text>
              <Text style={detailValue}>{amount}</Text>
              <Text style={detailLabel}>Next Billing Date</Text>
              <Text style={detailValue}>{nextBillingDate}</Text>
            </Section>
            <Text style={paragraphStyle}>
              Your subscription is now active. You have full access to all features included in your plan.
            </Text>
            <Text style={paragraphStyle}>
              You can manage your subscription, update payment methods, or view invoices anytime from your account settings.
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

const detailsBox = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '6px',
  margin: '24px 0',
};

const detailLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '8px 0 4px',
};

const detailValue = {
  fontSize: '16px',
  color: '#111827',
  margin: '0 0 16px',
};

