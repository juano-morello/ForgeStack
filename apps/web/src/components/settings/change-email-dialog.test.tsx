import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeEmailDialog } from './change-email-dialog';
import { userApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  userApi: {
    requestEmailChange: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ChangeEmailDialog', () => {
  const mockOnOpenChange = vi.fn();
  const currentEmail = 'user@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    expect(screen.getByText('Change Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Email/i)).toHaveValue(currentEmail);
  });

  it('does not render when closed', () => {
    render(
      <ChangeEmailDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    expect(screen.queryByText('Change Email Address')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New email is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    // Use getElementById to avoid label matching issues
    // Use "test@x" which passes browser's lenient email validation but fails our regex
    // (our regex requires format: something@something.something)
    const newEmailInput = document.getElementById('new-email') as HTMLInputElement;
    await user.type(newEmailInput, 'test@x');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates email is different from current', async () => {
    const user = userEvent.setup();
    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const newEmailInput = screen.getByLabelText(/New Email/i);
    await user.type(newEmailInput, currentEmail);

    const passwordInput = screen.getByLabelText(/Current Password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New email must be different from current email/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.requestEmailChange).mockResolvedValue({ message: 'Success' });

    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const newEmailInput = screen.getByLabelText(/New Email/i);
    await user.type(newEmailInput, 'newemail@example.com');

    const passwordInput = screen.getByLabelText(/Current Password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(userApi.requestEmailChange).toHaveBeenCalledWith({
        newEmail: 'newemail@example.com',
        password: 'password123',
      });
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.requestEmailChange).mockResolvedValue({ message: 'Success' });

    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const newEmailInput = screen.getByLabelText(/New Email/i);
    await user.type(newEmailInput, 'newemail@example.com');

    const passwordInput = screen.getByLabelText(/Current Password/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Verification email sent!/i)).toBeInTheDocument();
    });
  });
});

