'use client';

/**
 * Mobile Navigation Component
 *
 * Slide-out menu for mobile navigation.
 * Uses shadcn Sheet component.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, FolderKanban, Building2, CreditCard, Key, Webhook, ScrollText, Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/ai', label: 'AI Chat', icon: Sparkles },
  { href: '/activities', label: 'Activity', icon: Activity },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/settings/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

interface MobileNavProps {
  onNavigate?: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              ForgeStack
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

