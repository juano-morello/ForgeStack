import * as React from 'react';
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  primaryColor?: string;
}

const DEFAULT_PRIMARY_COLOR = '#3b82f6';

export function Button({ href, children, primaryColor }: ButtonProps) {
  const bgColor = primaryColor || DEFAULT_PRIMARY_COLOR;

  return (
    <EmailButton
      href={href}
      style={{
        ...buttonStyle,
        backgroundColor: bgColor,
      }}
    >
      {children}
    </EmailButton>
  );
}

const buttonStyle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '6px',
  margin: '16px 0',
};

