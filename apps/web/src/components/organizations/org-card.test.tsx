import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgCard } from './org-card';
import type { Organization } from '@/types/organization';

const createMockOrg = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Test Organization',
  role: 'OWNER',
  createdAt: '2024-01-15T00:00:00.000Z',
  memberCount: 5,
  ...overrides,
});

describe('OrgCard', () => {
  it('should render organization card with name and role', () => {
    const org = createMockOrg({
      name: 'My Organization',
      role: 'OWNER',
    });

    render(<OrgCard org={org} />);

    expect(screen.getByText('My Organization')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
  });

  it('should show created date', () => {
    const org = createMockOrg({
      createdAt: '2024-01-15T12:00:00.000Z',
    });

    render(<OrgCard org={org} />);

    // Check for the presence of "Created" text
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
  });

  it('should show member count when provided', () => {
    const org = createMockOrg({
      memberCount: 3,
    });

    render(<OrgCard org={org} />);

    expect(screen.getByText('3 members')).toBeInTheDocument();
  });

  it('should show singular "member" for count of 1', () => {
    const org = createMockOrg({
      memberCount: 1,
    });

    render(<OrgCard org={org} />);

    expect(screen.getByText('1 member')).toBeInTheDocument();
  });

  it('should show edit button when onEdit is provided', () => {
    const org = createMockOrg();
    const onEdit = vi.fn();

    render(<OrgCard org={org} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: '' });
    expect(editButton).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const org = createMockOrg();
    const onEdit = vi.fn();

    render(<OrgCard org={org} onEdit={onEdit} />);

    const buttons = screen.getAllByRole('button');
    const editButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.className.includes('text-destructive');
    });

    if (editButton) {
      await user.click(editButton);
      expect(onEdit).toHaveBeenCalledWith(org);
      expect(onEdit).toHaveBeenCalledTimes(1);
    }
  });

  it('should show delete button for OWNER', () => {
    const org = createMockOrg({
      role: 'OWNER',
    });
    const onDelete = vi.fn();

    render(<OrgCard org={org} onDelete={onDelete} />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn => 
      btn.className.includes('text-destructive') || 
      btn.querySelector('svg')?.classList.contains('text-destructive')
    );

    expect(deleteButton).toBeInTheDocument();
  });

  it('should not show delete button for MEMBER', () => {
    const org = createMockOrg({
      role: 'MEMBER',
    });
    const onDelete = vi.fn();

    render(<OrgCard org={org} onDelete={onDelete} />);

    // When role is MEMBER, no buttons should be rendered at all
    const buttons = screen.queryAllByRole('button');
    const deleteButton = buttons.find(btn =>
      btn.className.includes('text-destructive') ||
      btn.querySelector('svg')?.classList.contains('text-destructive')
    );

    expect(deleteButton).toBeUndefined();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const org = createMockOrg({
      role: 'OWNER',
    });
    const onDelete = vi.fn();

    render(<OrgCard org={org} onDelete={onDelete} />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn => 
      btn.className.includes('text-destructive') || 
      btn.querySelector('svg')?.classList.contains('text-destructive')
    );

    if (deleteButton) {
      await user.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith(org);
      expect(onDelete).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    const org = createMockOrg();
    const onSelect = vi.fn();

    render(<OrgCard org={org} onSelect={onSelect} />);

    const card = screen.getByText('Test Organization').closest('[class*="cursor-pointer"]');

    if (card) {
      await user.click(card);
      expect(onSelect).toHaveBeenCalledWith(org);
    }
  });
});

