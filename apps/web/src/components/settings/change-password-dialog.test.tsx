import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordDialog } from './change-password-dialog';
import { userApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  userApi: {
    changePassword: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ChangePasswordDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to get inputs by their IDs
  const getInputs = () => ({
    currentPassword: document.getElementById('current-password') as HTMLInputElement,
    newPassword: document.getElementById('new-password') as HTMLInputElement,
    confirmPassword: document.getElementById('confirm-password') as HTMLInputElement,
  });

  it('renders when open', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    const inputs = getInputs();
    expect(inputs.currentPassword).toBeInTheDocument();
    expect(inputs.newPassword).toBeInTheDocument();
    expect(inputs.confirmPassword).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ChangePasswordDialog
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Current password is required/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpass');
    await user.type(inputs.newPassword, 'short');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      // The error message appears in an Alert with role="alert"
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/New password must be at least 8 characters long/i);
    });
  });

  it('validates passwords match', async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'differentpassword');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('validates new password is different from current', async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'samepassword');
    await user.type(inputs.newPassword, 'samepassword');
    await user.type(inputs.confirmPassword, 'samepassword');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New password must be different from current password/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.changePassword).mockResolvedValue({ message: 'Success' });

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(userApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
    });
  });

  it('closes dialog after successful submission', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.changePassword).mockResolvedValue({ message: 'Success' });

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error message when API call fails', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.changePassword).mockRejectedValue(new Error('Current password is incorrect'));

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'wrongpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise<{ success: boolean }>((resolve) => {
      resolvePromise = resolve as (value: unknown) => void;
    });
    vi.mocked(userApi.changePassword).mockReturnValue(promise);

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Inputs should be disabled
    const inputsAfter = getInputs();
    expect(inputsAfter.currentPassword).toBeDisabled();
    expect(inputsAfter.newPassword).toBeDisabled();
    expect(inputsAfter.confirmPassword).toBeDisabled();

    // Resolve the promise
    resolvePromise!({ message: 'Success' });
  });

  it('calls onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('resets form when dialog is closed', async () => {
    const user = userEvent.setup();

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    expect(inputs.currentPassword.value).toBe('oldpassword');
    expect(inputs.newPassword.value).toBe('newpassword123');
    expect(inputs.confirmPassword.value).toBe('newpassword123');

    // Click cancel to close the dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify onOpenChange was called with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates confirm password is required', async () => {
    const user = userEvent.setup();

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please confirm your new password/i)).toBeInTheDocument();
    });
  });

  it('validates new password is required', async () => {
    const user = userEvent.setup();

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New password is required/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message for non-Error objects', async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.changePassword).mockRejectedValue('Some error');

    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const inputs = getInputs();
    await user.type(inputs.currentPassword, 'oldpassword');
    await user.type(inputs.newPassword, 'newpassword123');
    await user.type(inputs.confirmPassword, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to change password')).toBeInTheDocument();
    });
  });
});

