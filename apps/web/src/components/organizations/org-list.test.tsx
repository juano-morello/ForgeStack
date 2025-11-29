import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgList } from './org-list';
import type { Organization } from '@/types/organization';

// Mock the org context
const mockSetCurrentOrg = vi.fn();
const mockUseOrgContext = vi.fn();

vi.mock('@/components/providers/org-provider', () => ({
  useOrgContext: () => mockUseOrgContext(),
}));

const createMockOrg = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Test Organization',
  createdAt: '2024-01-01T00:00:00.000Z',
  role: 'MEMBER',
  ...overrides,
});

describe('OrgList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no organizations', () => {
    mockUseOrgContext.mockReturnValue({
      organizations: [],
      currentOrg: null,
      isLoading: false,
      error: null,
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList />);

    expect(screen.getByText(/no organizations/i)).toBeInTheDocument();
    expect(screen.getByText(/get started by creating a new organization/i)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockUseOrgContext.mockReturnValue({
      organizations: [],
      currentOrg: null,
      isLoading: true,
      error: null,
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList />);

    // Loading skeletons should be present
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    mockUseOrgContext.mockReturnValue({
      organizations: [],
      currentOrg: null,
      isLoading: false,
      error: 'Failed to load organizations',
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList />);

    expect(screen.getByText(/failed to load organizations/i)).toBeInTheDocument();
  });

  it('renders organization list with role badges', () => {
    const orgs: Organization[] = [
      createMockOrg({ id: 'org-1', name: 'My Company', role: 'OWNER' }),
      createMockOrg({ id: 'org-2', name: 'Another Org', role: 'MEMBER' }),
    ];

    mockUseOrgContext.mockReturnValue({
      organizations: orgs,
      currentOrg: null,
      isLoading: false,
      error: null,
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList />);

    expect(screen.getByText('My Company')).toBeInTheDocument();
    expect(screen.getByText('Another Org')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('clicking org triggers selection', async () => {
    const user = userEvent.setup();
    const orgs: Organization[] = [
      createMockOrg({ id: 'org-1', name: 'My Company', role: 'OWNER' }),
    ];
    const onSelect = vi.fn();

    mockUseOrgContext.mockReturnValue({
      organizations: orgs,
      currentOrg: null,
      isLoading: false,
      error: null,
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList onSelect={onSelect} />);

    await user.click(screen.getByText('My Company'));

    expect(mockSetCurrentOrg).toHaveBeenCalledWith(orgs[0]);
    expect(onSelect).toHaveBeenCalledWith(orgs[0]);
  });

  it('highlights currently selected organization', () => {
    const orgs: Organization[] = [
      createMockOrg({ id: 'org-1', name: 'Selected Org', role: 'OWNER' }),
      createMockOrg({ id: 'org-2', name: 'Other Org', role: 'MEMBER' }),
    ];

    mockUseOrgContext.mockReturnValue({
      organizations: orgs,
      currentOrg: orgs[0],
      isLoading: false,
      error: null,
      setCurrentOrg: mockSetCurrentOrg,
    });

    render(<OrgList />);

    // Selected org should have the ring styling (from OrgCard with isSelected=true)
    const selectedCard = screen.getByText('Selected Org').closest('[class*="ring-"]');
    expect(selectedCard).toBeInTheDocument();
  });
});

