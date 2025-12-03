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

  it('renders when open', () => {
    render(
      <ChangePasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
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

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    await user.type(currentPasswordInput, 'oldpass');

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    await user.type(newPasswordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/New password must be at least 8 characters long/i)).toBeInTheDocument();
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

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    await user.type(currentPasswordInput, 'oldpassword');

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    await user.type(newPasswordInput, 'newpassword123');

    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(confirmPasswordInput, 'differentpassword');

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

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    await user.type(currentPasswordInput, 'samepassword');

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    await user.type(newPasswordInput, 'samepassword');

    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(confirmPasswordInput, 'samepassword');

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

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    await user.type(currentPasswordInput, 'oldpassword');

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    await user.type(newPasswordInput, 'newpassword123');

    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(confirmPasswordInput, 'newpassword123');

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

    const currentPasswordInput = screen.getByLabelText(/Current Password/i);
    await user.type(currentPasswordInput, 'oldpassword');

    const newPasswordInput = screen.getByLabelText(/New Password/i);
    await user.type(newPasswordInput, 'newpassword123');

    const confirmPasswordInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(confirmPasswordInput, 'newpassword123');

    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

