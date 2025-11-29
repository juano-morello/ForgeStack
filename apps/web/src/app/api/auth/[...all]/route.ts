/**
 * better-auth API Route Handler
 *
 * This catch-all route handles all authentication requests:
 * - POST /api/auth/sign-up/email - Email/password signup
 * - POST /api/auth/sign-in/email - Email/password login
 * - POST /api/auth/sign-out - Logout
 * - GET /api/auth/session - Get current session
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);

