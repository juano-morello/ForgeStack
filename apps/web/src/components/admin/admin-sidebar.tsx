'use client';

/**
 * Admin Sidebar Component
 *
 * Navigation sidebar for super-admin dashboard.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Building2, ScrollText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/super-admin',
    label: 'Dashboard',
    icon: Shield,
  },
  {
    href: '/super-admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/super-admin/organizations',
    label: 'Organizations',
    icon: Building2,
  },
  {
    href: '/super-admin/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/10 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Super Admin</h2>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/super-admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

