import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityItem } from './activity-item';
import type { Activity } from '@/types/activities';

describe('ActivityItem', () => {
  const mockActivity: Activity = {
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
  };

  it('renders activity with actor name and title', () => {
    render(<ActivityItem activity={mockActivity} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('created project Test Project')).toBeInTheDocument();
  });

  it('renders avatar with initials fallback', () => {
    render(<ActivityItem activity={mockActivity} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders relative timestamp', () => {
    render(<ActivityItem activity={mockActivity} />);

    // Should show "recently" or "X ago"
    const timeElement = screen.getByText(/ago|recently/i);
    expect(timeElement).toBeInTheDocument();
  });

  it('renders aggregation count when greater than 1', () => {
    const aggregatedActivity = {
      ...mockActivity,
      aggregationCount: 5,
    };

    render(<ActivityItem activity={aggregatedActivity} />);

    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    const activityWithDescription = {
      ...mockActivity,
      description: 'Additional context about this activity',
    };

    render(<ActivityItem activity={activityWithDescription} />);

    expect(screen.getByText('Additional context about this activity')).toBeInTheDocument();
  });

  it('renders view link when resource is available', () => {
    render(<ActivityItem activity={mockActivity} />);

    const viewLink = screen.getByText('View');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink.closest('a')).toHaveAttribute('href', '/projects/project-1');
  });

  it('does not render view link when resource is not available', () => {
    const activityWithoutResource = {
      ...mockActivity,
      resourceType: null,
      resourceId: null,
      resourceName: null,
    };

    render(<ActivityItem activity={activityWithoutResource} />);

    expect(screen.queryByText('View')).not.toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    const { container } = render(<ActivityItem activity={mockActivity} showIcon={false} />);

    // Check that the ActivityIcon component is not rendered
    const iconContainer = container.querySelector('.rounded-full.p-2');
    expect(iconContainer).toBeNull();
  });
});

