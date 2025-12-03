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
});

