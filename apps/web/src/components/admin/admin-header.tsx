'use client';

/**
 * Admin Header Component
 *
 * Header for super-admin dashboard with breadcrumbs and user menu.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-muted-foreground hidden md:block">
              {userEmail}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

