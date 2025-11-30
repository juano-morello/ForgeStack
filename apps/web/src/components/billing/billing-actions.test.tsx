/**
 * BillingActions Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingActions } from './billing-actions';
import type { Subscription } from '@/types/billing';

describe('BillingActions', () => {
  const mockOnManageBilling = vi.fn();

  const mockActiveSubscription: Subscription = {
    id: 'sub_123',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: '2024-01-01T00:00:00.000Z',
    currentPeriodEnd: '2024-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
  };

  beforeEach(() => {
    mockOnManageBilling.mockClear();
  });

  it('does not render when user is not owner', () => {
    const { container } = render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={false}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders for owner users', () => {
    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(screen.getByText('Billing Management')).toBeInTheDocument();
  });

  it('shows manage billing button', () => {
    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(screen.getByText('Manage Billing')).toBeInTheDocument();
  });

  it('calls onManageBilling when clicking manage billing button', async () => {
    const user = userEvent.setup();
    mockOnManageBilling.mockResolvedValue(undefined);

    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );

    const manageButton = screen.getByText('Manage Billing');
    await user.click(manageButton);

    await waitFor(() => {
      expect(mockOnManageBilling).toHaveBeenCalledTimes(1);
    });
  });

  it('shows cancel subscription button for active subscription', () => {
    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
  });

  it('does not show cancel button when subscription is already canceling', () => {
    const cancelingSubscription: Subscription = {
      ...mockActiveSubscription,
      cancelAtPeriodEnd: true,
    };

    render(
      <BillingActions
        subscription={cancelingSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('does not show cancel button when no subscription', () => {
    render(
      <BillingActions
        subscription={null}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when clicking cancel subscription', async () => {
    const user = userEvent.setup();

    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    expect(screen.getByText('Cancel Subscription?')).toBeInTheDocument();
    expect(screen.getByText(/You will be redirected to the billing portal/)).toBeInTheDocument();
  });

  it('calls onManageBilling when confirming cancellation', async () => {
    const user = userEvent.setup();
    mockOnManageBilling.mockResolvedValue(undefined);

    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
      />
    );

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    const confirmButton = screen.getByText('Continue to Portal');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnManageBilling).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons when isLoading is true', () => {
    render(
      <BillingActions
        subscription={mockActiveSubscription}
        isOwner={true}
        onManageBilling={mockOnManageBilling}
        isLoading={true}
      />
    );

    const manageButton = screen.getByText('Manage Billing');
    expect(manageButton).toBeDisabled();
  });
});

