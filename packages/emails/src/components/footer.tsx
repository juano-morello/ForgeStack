import * as React from 'react';
import { Hr, Link, Section, Text } from '@react-email/components';

interface FooterProps {
  unsubscribeUrl?: string;
}

export function Footer({ unsubscribeUrl }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Hr style={dividerStyle} />
      <Section style={footerSection}>
        <Text style={footerText}>
          © {currentYear} ForgeStack. All rights reserved.
        </Text>
        <Text style={footerText}>
          <Link href="https://forgestack.dev" style={linkStyle}>
            Website
          </Link>
          {' • '}
          <Link href="https://forgestack.dev/docs" style={linkStyle}>
            Documentation
          </Link>
          {' • '}
          <Link href="https://forgestack.dev/support" style={linkStyle}>
            Support
          </Link>
        </Text>
        {unsubscribeUrl && (
          <Text style={footerText}>
            <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
              Unsubscribe from these emails
            </Link>
          </Text>
        )}
      </Section>
    </>
  );
}

const dividerStyle = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footerSection = {
  padding: '24px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0',
};

const linkStyle = {
  color: '#3b82f6',
  textDecoration: 'none',
};

const unsubscribeLinkStyle = {
  color: '#9ca3af',
  textDecoration: 'underline',
};

