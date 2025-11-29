/**
 * Next.js Middleware for Authentication
 *
 * Handles route protection by checking for valid session cookies.
 * Redirects unauthenticated users to the login page.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/invitations/decline'];

// Routes that start with these prefixes are public
const publicPrefixes = ['/api/auth', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if this route starts with a public prefix
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Check for session cookie (better-auth uses this cookie name by default)
  const sessionCookie = request.cookies.get('better-auth.session_token');

  if (!sessionCookie) {
    // Redirect to login if no session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

