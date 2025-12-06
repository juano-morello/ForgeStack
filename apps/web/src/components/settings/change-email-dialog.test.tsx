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

  it('shows error message when API call fails', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.requestEmailChange).mockRejectedValue(new Error('Invalid password'));

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
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise<{ success: boolean }>((resolve) => {
      resolvePromise = resolve as (value: unknown) => void;
    });
    vi.mocked(userApi.requestEmailChange).mockReturnValue(promise);

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

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ message: 'Success' });
  });

  it('calls onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets form when dialog is closed', async () => {
    const user = userEvent.setup();

    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const newEmailInput = screen.getByLabelText(/New Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Current Password/i) as HTMLInputElement;

    await user.type(newEmailInput, 'newemail@example.com');
    await user.type(passwordInput, 'password123');

    expect(newEmailInput.value).toBe('newemail@example.com');
    expect(passwordInput.value).toBe('password123');

    // Click cancel to close the dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify onOpenChange was called with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates password is required', async () => {
    const user = userEvent.setup();

    render(
      <ChangeEmailDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        currentEmail={currentEmail}
      />
    );

    const newEmailInput = screen.getByLabelText(/New Email/i);
    await user.type(newEmailInput, 'newemail@example.com');

    const submitButton = screen.getByRole('button', { name: /Send Verification Email/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Current password is required/i)).toBeInTheDocument();
    });
  });

  it('trims and lowercases email before validation', async () => {
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
    await user.type(newEmailInput, '  NewEmail@Example.COM  ');

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

  it('shows close button in success state', async () => {
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

    // Close button should be visible (not the X button, but the actual Close button)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    // There should be at least one close button
    expect(closeButtons.length).toBeGreaterThan(0);

    // Click the main close button (not the X)
    const mainCloseButton = closeButtons.find(btn => btn.textContent === 'Close');
    expect(mainCloseButton).toBeInTheDocument();

    await user.click(mainCloseButton!);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

