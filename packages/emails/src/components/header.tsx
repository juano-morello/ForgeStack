import * as React from 'react';
import { Img, Section, Text } from '@react-email/components';
import type { OrgBranding } from '../types';

interface HeaderProps {
  branding?: OrgBranding;
}

const DEFAULT_LOGO = 'https://forgestack.dev/logo.png';
const DEFAULT_ORG_NAME = 'ForgeStack';

export function Header({ branding }: HeaderProps) {
  const logo = branding?.logo || DEFAULT_LOGO;
  const orgName = branding?.orgName || DEFAULT_ORG_NAME;

  return (
    <Section style={headerSection}>
      <Img
        src={logo}
        alt={`${orgName} logo`}
        width="150"
        height="auto"
        style={logoStyle}
      />
      <Text style={orgNameStyle}>{orgName}</Text>
    </Section>
  );
}

const headerSection = {
  padding: '32px 0 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
};

const logoStyle = {
  maxWidth: '200px',
  margin: '0 auto',
  display: 'block',
};

const orgNameStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#111827',
  margin: '16px 0 0',
};

