import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';

// Mock the auth-client
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
}));

import { signIn } from '@/lib/auth-client';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    render(<LoginForm />);

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByLabelText(/email address/i);

    // Try to submit without filling in fields
    await user.click(submitButton);

    // HTML5 validation should prevent submission
    expect(emailInput).toBeInvalid();
  });

  it('submits form with valid email and password', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn.email).mockResolvedValue({});

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    vi.mocked(signIn.email).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    // Create a promise that we can control
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    vi.mocked(signIn.email).mockReturnValue(loginPromise as Promise<Record<string, unknown>>);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Resolve the login
    resolveLogin!({});

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});

