/**
 * better-auth Client Configuration
 *
 * This configures the better-auth client for browser-side authentication.
 * Used in React components for auth state and operations.
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// Export auth methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

