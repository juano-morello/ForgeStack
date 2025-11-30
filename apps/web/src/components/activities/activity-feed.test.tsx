import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityFeed } from './activity-feed';
import * as useActivitiesHook from '@/hooks/use-activities';
import * as orgProviderModule from '@/components/providers/org-provider';
import type { Activity } from '@/types/activities';

// Mock the hooks
vi.mock('@/hooks/use-activities');
vi.mock('@/components/providers/org-provider');

describe('ActivityFeed', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      orgId: 'org-1',
      actorId: 'user-1',
      actorName: 'John Doe',
      actorAvatar: null,
      type: 'project.created',
      title: 'created project Test Project',
      description: null,
      resourceType: 'project',
      resourceId: 'project-1',
      resourceName: 'Test Project',
      metadata: null,
      aggregationCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no organization is selected', () => {
    vi.spyOn(orgProviderModule, 'useOrgContext').mockReturnValue({
      currentOrg: null,
      organizations: [],
      isLoading: false,
      error: null,
      fetchOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      setCurrentOrg: vi.fn(),
      clearCurrentOrg: vi.fn(),
    });

    vi.spyOn(useActivitiesHook, 'useActivities').mockReturnValue({
      activities: [],
      isLoading: false,
      error: null,
      hasMore: false,
      fetchActivities: vi.fn(),
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ActivityFeed />);

    expect(screen.getByText('No organization selected')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.spyOn(orgProviderModule, 'useOrgContext').mockReturnValue({
      currentOrg: { id: 'org-1', name: 'Test Org', createdAt: new Date().toISOString() },
      organizations: [],
      isLoading: false,
      error: null,
      fetchOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      setCurrentOrg: vi.fn(),
      clearCurrentOrg: vi.fn(),
    });

    vi.spyOn(useActivitiesHook, 'useActivities').mockReturnValue({
      activities: [],
      isLoading: true,
      error: null,
      hasMore: false,
      fetchActivities: vi.fn(),
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });

    const { container } = render(<ActivityFeed />);

    // Check for loading spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders activities list', async () => {
    vi.spyOn(orgProviderModule, 'useOrgContext').mockReturnValue({
      currentOrg: { id: 'org-1', name: 'Test Org', createdAt: new Date().toISOString() },
      organizations: [],
      isLoading: false,
      error: null,
      fetchOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      setCurrentOrg: vi.fn(),
      clearCurrentOrg: vi.fn(),
    });

    vi.spyOn(useActivitiesHook, 'useActivities').mockReturnValue({
      activities: mockActivities,
      isLoading: false,
      error: null,
      hasMore: false,
      fetchActivities: vi.fn(),
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('created project Test Project')).toBeInTheDocument();
    });
  });

  it('renders empty state when no activities', () => {
    vi.spyOn(orgProviderModule, 'useOrgContext').mockReturnValue({
      currentOrg: { id: 'org-1', name: 'Test Org', createdAt: new Date().toISOString() },
      organizations: [],
      isLoading: false,
      error: null,
      fetchOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      setCurrentOrg: vi.fn(),
      clearCurrentOrg: vi.fn(),
    });

    vi.spyOn(useActivitiesHook, 'useActivities').mockReturnValue({
      activities: [],
      isLoading: false,
      error: null,
      hasMore: false,
      fetchActivities: vi.fn(),
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ActivityFeed />);

    expect(screen.getByText('No activities yet')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.spyOn(orgProviderModule, 'useOrgContext').mockReturnValue({
      currentOrg: { id: 'org-1', name: 'Test Org', createdAt: new Date().toISOString() },
      organizations: [],
      isLoading: false,
      error: null,
      fetchOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      setCurrentOrg: vi.fn(),
      clearCurrentOrg: vi.fn(),
    });

    vi.spyOn(useActivitiesHook, 'useActivities').mockReturnValue({
      activities: [],
      isLoading: false,
      error: 'Failed to fetch activities',
      hasMore: false,
      fetchActivities: vi.fn(),
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });

    render(<ActivityFeed />);

    expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
  });
});

