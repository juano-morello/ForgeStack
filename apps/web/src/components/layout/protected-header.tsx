'use client';

/**
 * Protected Header Component
 *
 * Shared header for protected pages with navigation links.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrgSelector } from '@/components/organizations/org-selector';
import { LogoutButton } from '@/components/auth/logout-button';

interface ProtectedHeaderProps {
  userEmail?: string;
}

export function ProtectedHeader({ userEmail }: ProtectedHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/organizations', label: 'Organizations' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
              ForgeStack
            </Link>
            <OrgSelector />
            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-4 ml-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || 
                  (link.href !== '/dashboard' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-gray-600 hidden md:block">
                {userEmail}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="sm:hidden pb-3">
          <div className="flex items-center gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

