/**
 * Auth Layout
 *
 * Centered layout with minimal dark tech aesthetic for authentication pages.
 */

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative px-4 py-12">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Radial gradient */}
      <div className="absolute inset-0 bg-gradient-radial" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <span className="text-2xl font-bold">ForgeStack</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Multi-tenant SaaS Starter Kit
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

