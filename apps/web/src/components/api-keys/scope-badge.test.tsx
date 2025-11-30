/**
 * Tests for ScopeBadge Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScopeBadge } from './scope-badge';

describe('ScopeBadge', () => {
  it('should render scope label correctly', () => {
    render(<ScopeBadge scope="projects:read" />);
    expect(screen.getByText('Read Projects')).toBeInTheDocument();
  });

  it('should render full access scope', () => {
    render(<ScopeBadge scope="*" />);
    expect(screen.getByText('Full Access')).toBeInTheDocument();
  });

  it('should show tooltip with description when showTooltip is true', () => {
    render(<ScopeBadge scope="projects:read" showTooltip={true} />);
    const badge = screen.getByText('Read Projects').closest('span');
    expect(badge).toHaveAttribute('title', 'View projects and their details');
  });

  it('should not show tooltip when showTooltip is false', () => {
    render(<ScopeBadge scope="projects:read" showTooltip={false} />);
    const badge = screen.getByText('Read Projects');
    // When showTooltip is false, the badge is not wrapped in a span with title
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement).not.toHaveAttribute('title');
  });

  it('should apply correct variant for read scopes', () => {
    const { container } = render(<ScopeBadge scope="projects:read" />);
    const badge = container.querySelector('.bg-secondary');
    expect(badge).toBeInTheDocument();
  });

  it('should apply correct variant for write scopes', () => {
    const { container } = render(<ScopeBadge scope="projects:write" />);
    const badge = container.querySelector('.bg-primary');
    expect(badge).toBeInTheDocument();
  });

  it('should apply correct variant for full access', () => {
    const { container } = render(<ScopeBadge scope="*" />);
    const badge = container.querySelector('.bg-destructive');
    expect(badge).toBeInTheDocument();
  });
});

