/**
 * ImpersonationBanner Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImpersonationBanner } from './impersonation-banner';
import type { ImpersonationSession } from '@/lib/api';

describe('ImpersonationBanner', () => {
  const mockSession: ImpersonationSession = {
    sessionId: 'session-123',
    targetUser: {
      id: 'user-123',
      email: 'target@example.com',
      name: 'Target User',
    },
    startedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-15T11:00:00Z',
    remainingSeconds: 3600,
  };

  const mockOnEndImpersonation = vi.fn();

  it('renders target user name and email', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/Target User/)).toBeInTheDocument();
    expect(screen.getByText(/\(target@example\.com\)/)).toBeInTheDocument();
  });

  it('renders target user email when no name', () => {
    const sessionWithoutName: ImpersonationSession = {
      ...mockSession,
      targetUser: {
        ...mockSession.targetUser,
        name: null,
      },
    };

    render(
      <ImpersonationBanner
        session={sessionWithoutName}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/target@example\.com/)).toBeInTheDocument();
    // Should not render parentheses when name is null
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('displays remaining time in hours, minutes, and seconds', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3665} // 1h 1m 5s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/1h 1m 5s/)).toBeInTheDocument();
  });

  it('displays remaining time in minutes and seconds when less than 1 hour', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={125} // 2m 5s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/2m 5s/)).toBeInTheDocument();
  });

  it('displays remaining time in seconds only when less than 1 minute', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={45} // 45s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/45s/)).toBeInTheDocument();
  });

  it('displays zero seconds correctly', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={0}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/0s/)).toBeInTheDocument();
  });

  it('calls onEndImpersonation when exit button clicked', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    const exitButton = screen.getByRole('button', { name: /Exit Impersonation/i });
    fireEvent.click(exitButton);

    expect(mockOnEndImpersonation).toHaveBeenCalledTimes(1);
  });

  it('renders correct time format for exactly 1 hour', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600} // 1h 0m 0s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/1h 0m 0s/)).toBeInTheDocument();
  });

  it('renders correct time format for exactly 1 minute', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={60} // 1m 0s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/1m 0s/)).toBeInTheDocument();
  });

  it('renders correct time format for multiple hours', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={7384} // 2h 3m 4s
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/2h 3m 4s/)).toBeInTheDocument();
  });

  it('renders impersonating label', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/Impersonating:/)).toBeInTheDocument();
  });

  it('renders time remaining label', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByText(/Time remaining:/)).toBeInTheDocument();
  });

  it('renders exit button with correct text', () => {
    render(
      <ImpersonationBanner
        session={mockSession}
        remainingTime={3600}
        onEndImpersonation={mockOnEndImpersonation}
      />
    );

    expect(screen.getByRole('button', { name: /Exit Impersonation/i })).toBeInTheDocument();
  });
});

