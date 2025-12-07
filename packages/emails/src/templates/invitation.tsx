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

export interface InvitationEmailProps extends BaseEmailProps {
  inviterName?: string;
  orgName: string;
  inviteUrl: string;
}

export function InvitationEmail({
  inviterName,
  orgName,
  inviteUrl,
  orgBranding,
  previewText = `You've been invited to join ${orgName}`,
}: InvitationEmailProps) {
  const inviteMessage = inviterName
    ? `${inviterName} has invited you to join ${orgName}`
    : `You've been invited to join ${orgName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Header branding={orgBranding} />
          <Section style={contentSection}>
            <Text style={headingStyle}>You're Invited! 🎉</Text>
            <Text style={paragraphStyle}>
              {inviteMessage} on ForgeStack.
            </Text>
            <Text style={paragraphStyle}>
              Join your team to collaborate on projects, manage tasks, and build amazing things together.
            </Text>
            <Button
              href={inviteUrl}
              primaryColor={orgBranding?.primaryColor}
            >
              Accept Invitation
            </Button>
            <Text style={paragraphStyle}>
              If you don't want to join this organization, you can safely ignore this email.
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

