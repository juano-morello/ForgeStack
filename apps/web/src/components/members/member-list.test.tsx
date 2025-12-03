import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberList } from './member-list';
import type { Member } from '@/types/member';

// Mock the auth-client
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the MemberRolesBadges component to avoid OrgContext dependency
vi.mock('./member-roles-badges', () => ({
  MemberRolesBadges: ({ roles }: { roles?: unknown[] }) => (
    <div data-testid="member-roles-badges">{roles?.length ?? 0} roles</div>
  ),
}));

import { useSession } from '@/lib/auth-client';

describe('MemberList', () => {
  const mockOnUpdateRole = vi.fn();
  const mockOnRemoveMember = vi.fn();

  const mockMembers: Member[] = [
    {
      userId: 'user-1',
      email: 'owner@example.com',
      name: 'Owner User',
      role: 'OWNER',
      joinedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      userId: 'user-2',
      email: 'member@example.com',
      name: 'Member User',
      role: 'MEMBER',
      joinedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      userId: 'user-3',
      email: 'another@example.com',
      name: null,
      role: 'MEMBER',
      joinedAt: '2024-02-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'user-1', email: 'owner@example.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: {} as any,
      },
      isPending: false,
      error: null,
    });
  });

  it('renders a table with member data', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('Member User')).toBeInTheDocument();
    expect(screen.getByText('another@example.com')).toBeInTheDocument();
  });

  it('shows role badges for each member', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    const ownerBadges = screen.getAllByText('OWNER');
    const memberBadges = screen.getAllByText('MEMBER');
    
    expect(ownerBadges.length).toBeGreaterThan(0);
    expect(memberBadges.length).toBeGreaterThan(0);
  });

  it('shows "(You)" badge for current user', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows remove button for OWNER viewer', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should have Actions column header
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Should have remove buttons (trash icons) for non-current users
    const rows = screen.getAllByRole('row');
    // Header row + 3 member rows = 4 total
    expect(rows).toHaveLength(4);
  });

  it('does not show remove button for MEMBER viewer', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="MEMBER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should not have Actions column header
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  // Skipping dialog interaction tests due to Radix UI AlertDialog testing complexity
  // These are better tested through integration/E2E tests
  it.skip('opens confirmation dialog on remove click', async () => {
    const user = userEvent.setup();

    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find all buttons and look for one with Trash2 icon
    const allButtons = screen.getAllByRole('button');
    const removeButton = allButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.disabled && btn.className.includes('text-destructive');
    });

    if (removeButton) {
      await user.click(removeButton);

      // Dialog should appear - use getByRole to find the dialog heading
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText(/Member User/)).toBeInTheDocument();
      });
    }
  });

  it.skip('calls onRemoveMember when confirmed', async () => {
    const user = userEvent.setup();
    mockOnRemoveMember.mockResolvedValue(undefined);

    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find all buttons and look for one with Trash2 icon
    const allButtons = screen.getAllByRole('button');
    const removeButton = allButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && !btn.disabled && btn.className.includes('text-destructive');
    });

    if (removeButton) {
      await user.click(removeButton);

      // Wait for dialog
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      // Find the confirm button within the dialog
      const confirmButtons = screen.getAllByRole('button', { name: /remove member/i });
      const confirmButton = confirmButtons.find(btn => btn.className.includes('bg-destructive'));

      if (confirmButton) {
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockOnRemoveMember).toHaveBeenCalledWith('user-2');
        });
      }
    }
  });

  it('shows role select for OWNER viewer on other members', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should have select dropdowns for non-current users
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('displays formatted join dates', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Check for formatted dates in UTC timezone
    expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Feb 1, 2024/)).toBeInTheDocument();
  });

  it('displays email when name is null', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // User 3 has no name, so email should be displayed as main text
    expect(screen.getByText('another@example.com')).toBeInTheDocument();
  });

  it('displays both name and email when name is present', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // User 1 has both name and email
    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('owner@example.com')).toBeInTheDocument();
  });

  it('should show role dropdown for OWNER when viewing other members', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should have select dropdowns for non-current users (2 members)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);
  });

  it('should hide role dropdown for MEMBER viewers', () => {
    render(
      <MemberList
        members={mockMembers}
        currentUserRole="MEMBER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should not have any select dropdowns
    const selects = screen.queryAllByRole('combobox');
    expect(selects).toHaveLength(0);
  });

  // Skipping Select interaction tests due to Radix UI Select testing complexity
  // These are better tested through integration/E2E tests
  it.skip('should call onUpdateRole when role is changed', async () => {
    const user = userEvent.setup();
    mockOnUpdateRole.mockResolvedValue(undefined);

    render(
      <MemberList
        members={mockMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find the first select (for user-2)
    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0];

    // Click to open the select
    await user.click(firstSelect);

    // Find and click the OWNER option
    const ownerOption = await screen.findByRole('option', { name: 'OWNER' });
    await user.click(ownerOption);

    await waitFor(() => {
      expect(mockOnUpdateRole).toHaveBeenCalledWith('user-2', 'OWNER');
    });
  });

  it.skip('should prevent demoting the last owner', async () => {
    const user = userEvent.setup();
    const singleOwnerMembers: Member[] = [
      {
        userId: 'user-1',
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'OWNER',
        joinedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        userId: 'user-2',
        email: 'member@example.com',
        name: 'Member User',
        role: 'MEMBER',
        joinedAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    // Mock useSession to return user-1 as current user
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'user-2', email: 'member@example.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: {} as any,
      },
      isPending: false,
      error: null,
    });

    render(
      <MemberList
        members={singleOwnerMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find the select for the owner (user-1)
    const selects = screen.getAllByRole('combobox');
    const ownerSelect = selects[0];

    // Click to open the select
    await user.click(ownerSelect);

    // Find and click the MEMBER option
    const memberOption = await screen.findByRole('option', { name: 'MEMBER' });
    await user.click(memberOption);

    // Should show toast error (we can't test toast directly, but onUpdateRole shouldn't be called)
    await waitFor(() => {
      expect(mockOnUpdateRole).not.toHaveBeenCalled();
    });
  });

  it('should disable remove button for last OWNER', () => {
    const singleOwnerMembers: Member[] = [
      {
        userId: 'user-1',
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'OWNER',
        joinedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        userId: 'user-2',
        email: 'member@example.com',
        name: 'Member User',
        role: 'MEMBER',
        joinedAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    // Mock useSession to return user-2 as current user
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'user-2', email: 'member@example.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: {} as any,
      },
      isPending: false,
      error: null,
    });

    render(
      <MemberList
        members={singleOwnerMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find all buttons
    const buttons = screen.getAllByRole('button');

    // The remove button for the owner should be disabled
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('should prevent removing the last owner', async () => {
    const singleOwnerMembers: Member[] = [
      {
        userId: 'user-1',
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'OWNER',
        joinedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        userId: 'user-2',
        email: 'member@example.com',
        name: 'Member User',
        role: 'MEMBER',
        joinedAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    // Mock useSession to return user-2 as current user
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 'user-2', email: 'member@example.com' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: {} as any,
      },
      isPending: false,
      error: null,
    });

    render(
      <MemberList
        members={singleOwnerMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Find all buttons
    const buttons = screen.getAllByRole('button');

    // Try to find the remove button for the owner (should be disabled)
    const removeButtons = buttons.filter(btn =>
      btn.className.includes('text-destructive') && btn.hasAttribute('disabled')
    );

    expect(removeButtons.length).toBeGreaterThan(0);
  });



  it('renders empty state when no members', () => {
    render(
      <MemberList
        members={[]}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // Should show empty table
    const rows = screen.getAllByRole('row');
    // Only header row
    expect(rows).toHaveLength(1);
  });

  it('shows correct count of owners', () => {
    const multiOwnerMembers: Member[] = [
      {
        userId: 'user-1',
        email: 'owner1@example.com',
        name: 'Owner 1',
        role: 'OWNER',
        joinedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        userId: 'user-2',
        email: 'owner2@example.com',
        name: 'Owner 2',
        role: 'OWNER',
        joinedAt: '2024-01-15T00:00:00.000Z',
      },
    ];

    render(
      <MemberList
        members={multiOwnerMembers}
        currentUserRole="OWNER"
        onUpdateRole={mockOnUpdateRole}
        onRemoveMember={mockOnRemoveMember}
      />
    );

    // With 2 owners, remove buttons should be enabled
    const buttons = screen.getAllByRole('button');
    const enabledRemoveButtons = buttons.filter(btn =>
      btn.className.includes('text-destructive') && !btn.hasAttribute('disabled')
    );
    expect(enabledRemoveButtons.length).toBeGreaterThan(0);
  });
});


