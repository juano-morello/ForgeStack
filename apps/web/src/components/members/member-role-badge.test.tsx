import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberRoleBadge } from './member-role-badge';

describe('MemberRoleBadge', () => {
  it('renders "OWNER" with destructive styling for OWNER role', () => {
    render(<MemberRoleBadge role="OWNER" />);

    const badge = screen.getByText('OWNER');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('font-semibold');
    expect(badge).toHaveClass('bg-red-600');
  });

  it('renders "MEMBER" with secondary styling for MEMBER role', () => {
    render(<MemberRoleBadge role="MEMBER" />);

    const badge = screen.getByText('MEMBER');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('font-semibold');
    expect(badge).not.toHaveClass('bg-red-600');
  });

  it('applies custom className when provided', () => {
    render(<MemberRoleBadge role="OWNER" className="custom-class" />);

    const badge = screen.getByText('OWNER');
    expect(badge).toHaveClass('custom-class');
  });
});

