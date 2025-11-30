/**
 * Feature Flags List Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagsList } from './feature-flags-list';
import type { FeatureFlag } from '@/types/feature-flags';

describe('FeatureFlagsList', () => {
  const mockFlags: FeatureFlag[] = [
    {
      id: 'flag-1',
      key: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Access to advanced analytics',
      type: 'plan',
      defaultValue: false,
      plans: ['pro', 'enterprise'],
      percentage: null,
      enabled: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'flag-2',
      key: 'beta-features',
      name: 'Beta Features',
      description: 'Access to beta features',
      type: 'boolean',
      defaultValue: false,
      plans: null,
      percentage: null,
      enabled: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleEnabled = vi.fn().mockResolvedValue(undefined);

  it('renders loading state', () => {
    const { container } = render(
      <FeatureFlagsList
        flags={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    // Check for skeleton elements by class
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no flags', () => {
    render(
      <FeatureFlagsList
        flags={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    expect(screen.getByText('No feature flags yet')).toBeInTheDocument();
  });

  it('renders list of flags', () => {
    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.getByText('Beta Features')).toBeInTheDocument();
    expect(screen.getByText('advanced-analytics')).toBeInTheDocument();
    expect(screen.getByText('beta-features')).toBeInTheDocument();
  });

  it('filters flags by search query', async () => {
    const user = userEvent.setup();

    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or key...');
    await user.type(searchInput, 'analytics');

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Beta Features')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no results', async () => {
    const user = userEvent.setup();

    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name or key...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No flags found matching your search')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    const editButtons = screen.getAllByTitle('Edit flag');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockFlags[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete flag');
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockFlags[0]);
  });

  it('displays flag type badges', () => {
    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    expect(screen.getByText('Plan-Based')).toBeInTheDocument();
    expect(screen.getByText('Boolean')).toBeInTheDocument();
  });

  it('displays enabled/disabled status', () => {
    render(
      <FeatureFlagsList
        flags={mockFlags}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleEnabled={mockOnToggleEnabled}
      />
    );

    const enabledLabels = screen.getAllByText('Enabled');
    const disabledLabels = screen.getAllByText('Disabled');

    expect(enabledLabels).toHaveLength(1);
    expect(disabledLabels).toHaveLength(1);
  });
});

