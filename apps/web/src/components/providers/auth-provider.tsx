'use client';

/**
 * Auth Provider Component
 *
 * Wraps the application to provide authentication context.
 * This is a simple wrapper since better-auth handles state internally.
 */

import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // better-auth manages session state internally via cookies
  // This provider can be extended to add additional auth context if needed
  return <>{children}</>;
}

