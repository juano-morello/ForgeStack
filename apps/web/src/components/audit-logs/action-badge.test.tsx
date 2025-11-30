import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionBadge } from './action-badge';

describe('ActionBadge', () => {
  it('renders action label for created action', () => {
    render(<ActionBadge action="project.created" />);
    
    expect(screen.getByText('Project Created')).toBeInTheDocument();
  });

  it('renders action label for updated action', () => {
    render(<ActionBadge action="member.role_changed" />);
    
    expect(screen.getByText('Role Changed')).toBeInTheDocument();
  });

  it('renders action label for deleted action', () => {
    render(<ActionBadge action="api_key.revoked" />);
    
    expect(screen.getByText('API Key Revoked')).toBeInTheDocument();
  });

  it('renders unknown action as-is', () => {
    render(<ActionBadge action="unknown.action" />);
    
    expect(screen.getByText('unknown.action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ActionBadge action="project.created" className="custom-class" />);
    
    const badge = container.querySelector('.custom-class');
    expect(badge).toBeInTheDocument();
  });
});

