/**
 * PlanSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanSelector } from './plan-selector';

describe('PlanSelector', () => {
  const mockOnSelectPlan = vi.fn();

  beforeEach(() => {
    mockOnSelectPlan.mockClear();
  });

  it('renders all three plans', () => {
    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('displays plan prices correctly', () => {
    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('$299')).toBeInTheDocument();
  });

  it('shows "Most Popular" badge on Pro plan', () => {
    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('highlights current plan', () => {
    render(<PlanSelector currentPlan="pro" onSelectPlan={mockOnSelectPlan} />);
    const currentBadge = screen.getByText('Current');
    expect(currentBadge).toBeInTheDocument();
  });

  it('disables button for current plan', () => {
    render(<PlanSelector currentPlan="basic" onSelectPlan={mockOnSelectPlan} />);
    const buttons = screen.getAllByRole('button');
    const basicButton = buttons.find(btn => btn.textContent === 'Current Plan');
    expect(basicButton).toBeDisabled();
  });

  it('calls onSelectPlan when selecting a plan', async () => {
    const user = userEvent.setup();
    mockOnSelectPlan.mockResolvedValue(undefined);

    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    
    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]);

    await waitFor(() => {
      expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onSelectPlan for current plan', async () => {
    const user = userEvent.setup();
    render(<PlanSelector currentPlan="basic" onSelectPlan={mockOnSelectPlan} />);
    
    const currentPlanButton = screen.getByText('Current Plan');
    await user.click(currentPlanButton);

    expect(mockOnSelectPlan).not.toHaveBeenCalled();
  });

  it('shows processing state while selecting', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockOnSelectPlan.mockReturnValue(promise);

    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    
    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]);

    expect(screen.getByText('Processing...')).toBeInTheDocument();

    resolvePromise!();
    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });
  });

  it('displays plan features', () => {
    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    expect(screen.getByText('Up to 10 projects')).toBeInTheDocument();
    expect(screen.getByText('Unlimited projects')).toBeInTheDocument();
    expect(screen.getByText('Everything in Pro')).toBeInTheDocument();
  });

  it('disables all buttons when isLoading is true', () => {
    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} isLoading={true} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('handles plan selection error gracefully', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOnSelectPlan.mockRejectedValue(new Error('Failed to select plan'));

    render(<PlanSelector currentPlan="free" onSelectPlan={mockOnSelectPlan} />);
    
    const selectButtons = screen.getAllByText('Select Plan');
    await user.click(selectButtons[0]);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

